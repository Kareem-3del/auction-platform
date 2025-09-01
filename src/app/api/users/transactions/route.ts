import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getCurrentUser } from 'src/lib/auth';
import { prisma } from 'src/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  ErrorCodes 
} from 'src/lib/api-response';

// GET /api/users/transactions - Get user's transaction history
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = token ? await getCurrentUser(token) : null;
    
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const type = searchParams.get('type'); // Filter by transaction type

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };
    if (type) {
      where.type = type;
    }

    // Get transactions and count
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    // Get current balance info
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        balanceReal: true,
        balanceVirtual: true,
        balanceUSD: true
      }
    });

    return successResponse({
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        balanceType: tx.balanceType,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
        metadata: tx.metadata
      })),
      currentBalance: {
        real: Number(currentUser?.balanceReal || 0),
        virtual: Number(currentUser?.balanceVirtual || 0),
        usd: Number(currentUser?.balanceUSD || 0)
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + transactions.length < total
      }
    });

  } catch (error) {
    console.error('Get user transactions error:', error);
    return errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to get transactions', 500);
  }
}