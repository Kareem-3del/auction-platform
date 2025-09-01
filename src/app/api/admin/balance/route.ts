import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { verifyAccessToken } from 'src/lib/auth';
import { apiResponse } from 'src/lib/api-response';

const balanceAdjustmentSchema = z.object({
  userId: z.string(),
  balanceType: z.enum(['REAL', 'VIRTUAL', 'USD']),
  amount: z.number(),
  reason: z.string().min(1).max(500),
  reasonAr: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return apiResponse.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { 
        id: true, 
        email: true, 
        userType: true, 
        isActive: true 
      }
    });

    if (!admin || !admin.isActive) {
      return apiResponse.unauthorized('Admin not found or inactive');
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(admin.userType)) {
      return apiResponse.forbidden('Insufficient permissions');
    }

    // Parse and validate request body
    const body = await request.json();
    const { userId, balanceType, amount, reason, reasonAr } = balanceAdjustmentSchema.parse(body);

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        balanceReal: true,
        balanceVirtual: true,
        balanceUSD: true,
        isActive: true
      }
    });

    if (!targetUser) {
      return apiResponse.notFound('User not found');
    }

    // Perform balance adjustment
    const result = await prisma.$transaction(async (tx) => {
      // Get current balance
      let currentBalance: number;
      let balanceField: string;
      
      switch (balanceType) {
        case 'REAL':
          currentBalance = Number(targetUser.balanceReal);
          balanceField = 'balanceReal';
          break;
        case 'VIRTUAL':
          currentBalance = Number(targetUser.balanceVirtual);
          balanceField = 'balanceVirtual';
          break;
        case 'USD':
          currentBalance = Number(targetUser.balanceUSD);
          balanceField = 'balanceUSD';
          break;
      }

      const newBalance = currentBalance + amount;

      // Prevent negative balances
      if (newBalance < 0) {
        throw new Error(`Insufficient balance. Current: ${currentBalance}, Adjustment: ${amount}`);
      }

      // Update user balance
      const updateData: any = {};
      updateData[balanceField] = newBalance;
      
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          balanceReal: true,
          balanceVirtual: true,
          balanceUSD: true
        }
      });

      // Create balance adjustment record
      const adjustment = await tx.balanceAdjustment.create({
        data: {
          userId,
          adjustedBy: admin.id,
          balanceType,
          amount,
          reason,
          reasonAr,
          balanceBefore: currentBalance,
          balanceAfter: newBalance
        }
      });

      // Create transaction record
      const transactionType = amount > 0 ? 'DEPOSIT' : 'WITHDRAWAL';
      const currency = balanceType === 'USD' ? 'USD' : 'PLATFORM';
      
      await tx.transaction.create({
        data: {
          userId,
          transactionType,
          amountReal: balanceType === 'REAL' ? Math.abs(amount) : 0,
          amountVirtual: balanceType === 'VIRTUAL' ? Math.abs(amount) : 0,
          currency,
          status: 'COMPLETED',
          paymentMethod: 'ADMIN_ADJUSTMENT',
          description: `Admin balance adjustment: ${reason}`,
          processedAt: new Date(),
          processedBy: admin.id,
          metadata: {
            adjustmentId: adjustment.id,
            adminEmail: admin.email,
            balanceType,
            balanceBefore: currentBalance,
            balanceAfter: newBalance
          }
        }
      });

      // Create notification for user
      const notificationTitle = amount > 0 ? 'Balance Credited' : 'Balance Debited';
      const notificationMessage = `Your ${balanceType.toLowerCase()} balance has been ${amount > 0 ? 'increased' : 'decreased'} by ${Math.abs(amount)}. Reason: ${reason}`;
      
      await tx.notification.create({
        data: {
          userId,
          notificationType: amount > 0 ? 'PAYMENT_RECEIVED' : 'SYSTEM_ALERT',
          title: notificationTitle,
          message: notificationMessage,
          deliveryMethod: 'IN_APP',
          data: {
            adjustmentId: adjustment.id,
            balanceType,
            amount,
            reason,
            adminId: admin.id
          }
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: admin.id,
          targetId: userId,
          entityType: 'user',
          entityId: userId,
          action: 'balance_adjustment',
          oldValues: {
            [balanceField]: currentBalance
          },
          newValues: {
            [balanceField]: newBalance
          },
          ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'Unknown'
        }
      });

      return {
        adjustment,
        updatedBalances: {
          real: Number(updatedUser.balanceReal),
          virtual: Number(updatedUser.balanceVirtual),
          usd: Number(updatedUser.balanceUSD)
        }
      };
    });

    return apiResponse.success({
      message: 'Balance adjustment completed successfully',
      adjustment: {
        id: result.adjustment.id,
        userId,
        userEmail: targetUser.email,
        userName: `${targetUser.firstName} ${targetUser.lastName}`,
        balanceType,
        amount,
        reason,
        balanceBefore: result.adjustment.balanceBefore,
        balanceAfter: result.adjustment.balanceAfter,
        adjustedBy: admin.email,
        createdAt: result.adjustment.createdAt
      },
      updatedBalances: result.updatedBalances
    });

  } catch (error) {
    console.error('Balance adjustment error:', error);
    
    if (error instanceof z.ZodError) {
      return apiResponse.badRequest('Invalid request data', error.errors);
    }

    if (error instanceof Error && error.message.includes('Insufficient balance')) {
      return apiResponse.badRequest(error.message);
    }

    return apiResponse.internalError('Failed to adjust balance');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return apiResponse.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { userType: true, isActive: true }
    });

    if (!admin || !admin.isActive || !['ADMIN', 'SUPER_ADMIN'].includes(admin.userType)) {
      return apiResponse.forbidden('Insufficient permissions');
    }

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const userId = url.searchParams.get('userId');

    const where = userId ? { userId } : {};

    // Get balance adjustments with pagination
    const [adjustments, total] = await Promise.all([
      prisma.balanceAdjustment.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          },
          admin: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.balanceAdjustment.count({ where })
    ]);

    return apiResponse.success({
      adjustments: adjustments.map(adj => ({
        id: adj.id,
        userId: adj.userId,
        user: {
          email: adj.user.email,
          name: `${adj.user.firstName} ${adj.user.lastName}`
        },
        admin: {
          email: adj.admin.email,
          name: `${adj.admin.firstName} ${adj.admin.lastName}`
        },
        balanceType: adj.balanceType,
        amount: Number(adj.amount),
        reason: adj.reason,
        reasonAr: adj.reasonAr,
        balanceBefore: Number(adj.balanceBefore),
        balanceAfter: Number(adj.balanceAfter),
        createdAt: adj.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get balance adjustments error:', error);
    return apiResponse.internalError('Failed to get balance adjustments');
  }
}