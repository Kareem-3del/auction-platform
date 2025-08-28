
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { 
  ErrorCodes, 
  errorResponse, 
  handleAPIError, 
  validateMethod,
  successResponse,
  validateContentType,
  validateRequiredFields
} from '@/lib/api-response';

// Validation schema
const updateBalanceSchema = z.object({
  balanceReal: z.number().min(0, 'Real balance cannot be negative').optional(),
  balanceVirtual: z.number().min(0, 'Virtual balance cannot be negative').optional(),
  reason: z.string().min(1, 'Reason is required for balance changes'),
  adjustmentType: z.enum(['SET', 'ADD', 'SUBTRACT']).default('SET'),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT endpoint to update user balance (Admin only)
export const PUT = withAuth(async (request, { params }: RouteParams) => {
  try {
    // Validate request method and content type
    validateMethod(request, ['PUT']);
    validateContentType(request);

    // Check if user is admin
    if (request.user.userType !== 'ADMIN') {
      return errorResponse(
        ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
        'Only administrators can modify user balances',
        403
      );
    }

    // Get user ID from params
    const { id: userId } = await params;

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['reason']);
    if (!validation.isValid) {
      return errorResponse(
        ErrorCodes.VALIDATION_FAILED,
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      );
    }

    // Validate with Zod schema
    const validatedData = updateBalanceSchema.parse(body);

    // Check if at least one balance field is provided
    if (!validatedData.balanceReal && !validatedData.balanceVirtual) {
      return errorResponse(
        ErrorCodes.VALIDATION_FAILED,
        'At least one balance field (balanceReal or balanceVirtual) must be provided',
        400
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        balanceReal: true,
        balanceVirtual: true,
      },
    });

    if (!targetUser) {
      return errorResponse(
        ErrorCodes.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Calculate new balances based on adjustment type
    let newRealBalance = targetUser.balanceReal.toNumber();
    let newVirtualBalance = targetUser.balanceVirtual.toNumber();

    if (validatedData.balanceReal !== undefined) {
      switch (validatedData.adjustmentType) {
        case 'SET':
          newRealBalance = validatedData.balanceReal;
          break;
        case 'ADD':
          newRealBalance += validatedData.balanceReal;
          break;
        case 'SUBTRACT':
          newRealBalance -= validatedData.balanceReal;
          break;
      }
    }

    if (validatedData.balanceVirtual !== undefined) {
      switch (validatedData.adjustmentType) {
        case 'SET':
          newVirtualBalance = validatedData.balanceVirtual;
          break;
        case 'ADD':
          newVirtualBalance += validatedData.balanceVirtual;
          break;
        case 'SUBTRACT':
          newVirtualBalance -= validatedData.balanceVirtual;
          break;
      }
    } else if (validatedData.balanceReal !== undefined && validatedData.adjustmentType === 'SET') {
      // If only real balance is being set, automatically calculate virtual balance (3x real)
      newVirtualBalance = newRealBalance * 3;
    }

    // Ensure balances don't go negative
    newRealBalance = Math.max(0, newRealBalance);
    newVirtualBalance = Math.max(0, newVirtualBalance);

    // Create audit transaction record
    const auditTransaction = await prisma.transaction.create({
      data: {
        userId,
        relatedId: request.user.id, // Admin who made the change
        relatedType: 'ADMIN_ADJUSTMENT',
        transactionType: 'DEPOSIT', // or create a new type for admin adjustments
        amountReal: newRealBalance - targetUser.balanceReal.toNumber(),
        amountVirtual: newVirtualBalance - targetUser.balanceVirtual.toNumber(),
        currency: 'USD',
        status: 'COMPLETED',
        description: `Admin balance adjustment: ${validatedData.reason}`,
        paymentDetails: {
          adminId: request.user.id,
          adminEmail: request.user.email,
          adjustmentType: validatedData.adjustmentType,
          originalBalanceReal: targetUser.balanceReal.toNumber(),
          originalBalanceVirtual: targetUser.balanceVirtual.toNumber(),
          newBalanceReal: newRealBalance,
          newBalanceVirtual: newVirtualBalance,
          reason: validatedData.reason,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Update user balance
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        balanceReal: newRealBalance,
        balanceVirtual: newVirtualBalance,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        balanceReal: true,
        balanceVirtual: true,
      },
    });

    // Log the balance change
    console.log(`⚖️ Balance adjusted by admin ${request.user.email}: User ${targetUser.email} balance changed from $${targetUser.balanceReal}/$${targetUser.balanceVirtual} to $${newRealBalance}/$${newVirtualBalance}`);

    return successResponse({
      user: updatedUser,
      changes: {
        realBalanceChange: newRealBalance - targetUser.balanceReal.toNumber(),
        virtualBalanceChange: newVirtualBalance - targetUser.balanceVirtual.toNumber(),
        adjustmentType: validatedData.adjustmentType,
        reason: validatedData.reason,
      },
      transaction: {
        id: auditTransaction.id,
        createdAt: auditTransaction.createdAt,
      },
      message: 'User balance updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_FAILED,
        'Validation failed',
        422,
        error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }

    return handleAPIError(error);
  }
}, { required: true });

// GET endpoint to view user balance details (Admin only)
export const GET = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['GET']);

    // Check if user is admin
    if (request.user.userType !== 'ADMIN') {
      return errorResponse(
        ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
        'Only administrators can view user balance details',
        403
      );
    }

    // Get user ID from params
    const { id: userId } = await params;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        balanceReal: true,
        balanceVirtual: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse(
        ErrorCodes.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Get recent balance-related transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        OR: [
          { transactionType: 'DEPOSIT' },
          { transactionType: 'WITHDRAWAL' },
          { relatedType: 'ADMIN_ADJUSTMENT' },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        transactionType: true,
        amountReal: true,
        amountVirtual: true,
        status: true,
        description: true,
        createdAt: true,
        paymentDetails: true,
      },
    });

    return successResponse({
      user,
      recentTransactions,
      balanceRatio: user.balanceVirtual.toNumber() / Math.max(user.balanceReal.toNumber(), 1),
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });