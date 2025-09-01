import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType 
} from 'src/lib/api-response';

// Validation schema for balance operations
const depositSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(100000, 'Maximum deposit amount is $100,000'),
  currency: z.string().default('USD'),
  paymentMethodId: z.string().optional(),
  description: z.string().optional(),
});

const transferSchema = z.object({
  fromBalance: z.enum(['real', 'virtual'], {
    errorMap: () => ({ message: 'From balance must be either "real" or "virtual"' })
  }),
  toBalance: z.enum(['real', 'virtual'], {
    errorMap: () => ({ message: 'To balance must be either "real" or "virtual"' })
  }),
  amount: z.number()
    .positive('Amount must be positive')
    .max(100000, 'Maximum transfer amount is $100,000'),
  description: z.string().optional(),
});

// GET /api/users/balance - Get user balance information
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    const userId = request.user.id;

    // Get user balance with transaction history
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        balanceReal: true,
        balanceVirtual: true,
        virtualMultiplier: true,
        transactions: {
          select: {
            id: true,
            transactionType: true,
            amountReal: true,
            amountVirtual: true,
            currency: true,
            status: true,
            description: true,
            createdAt: true,
            metadata: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        paymentMethods: {
          select: {
            id: true,
            methodType: true,
            provider: true,
            isDefault: true,
            isVerified: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return handleAPIError(new Error('User not found'));
    }

    // Calculate balance statistics
    const totalBalance = Number(user.balanceReal) + Number(user.balanceVirtual);
    const virtualEquivalent = Number(user.balanceReal) * Number(user.virtualMultiplier);

    const balanceData = {
      balances: {
        real: Number(user.balanceReal),
        virtual: Number(user.balanceVirtual),
        totalEquivalent: totalBalance,
        virtualMultiplier: Number(user.virtualMultiplier),
        maxVirtualFromReal: virtualEquivalent,
      },
      recentTransactions: user.transactions.map((t: any) => ({
        ...t,
        amountReal: Number(t.amountReal),
        amountVirtual: Number(t.amountVirtual),
      })),
      paymentMethods: user.paymentMethods,
    };

    return successResponse({
      balance: balanceData,
      message: 'Balance information retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// POST /api/users/balance/deposit - Deposit funds to real balance
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    const userId = request.user.id;
    const body = await request.json();

    // Validate request data
    const { amount, currency, paymentMethodId, description } = depositSchema.parse(body);

    // Get user current balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        balanceReal: true,
        kycStatus: true,
      },
    });

    if (!user) {
      return handleAPIError(new Error('User not found'));
    }

    // Check KYC requirements for large deposits
    if (amount > 1000 && user.kycStatus !== 'VERIFIED') {
      return handleAPIError({
        name: 'KYCRequiredError',
        message: 'KYC verification is required for deposits over $1,000',
      });
    }

    // Validate payment method if provided
    if (paymentMethodId) {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          id: paymentMethodId,
          userId,
          isVerified: true,
        },
      });

      if (!paymentMethod) {
        return handleAPIError({
          name: 'PaymentMethodNotFoundError',
          message: 'Payment method not found or inactive',
        });
      }
    }

    // In a real implementation, this would integrate with Binance Pay or other payment processors
    // For now, we'll simulate a successful deposit
    const transactionId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        id: transactionId,
        userId,
        transactionType: 'DEPOSIT',
        amountReal: amount,
        amountVirtual: 0,
        currency,
        status: 'PENDING',
        description: description || `Deposit of $${amount}`,
        metadata: {
          paymentMethodId,
          depositType: 'manual',
        },
      },
    });

    // In production, this would wait for payment confirmation
    // For demo purposes, we'll immediately confirm the transaction
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time

    // Update transaction and user balance
    await prisma.$transaction(async (tx: any) => {
      // Update transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          balanceReal: {
            increment: amount,
          },
        },
      });
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        targetId: userId,
        entityType: 'user',
        entityId: userId,
        action: 'deposit_completed',
        newValues: {
          amount,
          currency,
          transactionId: transaction.id,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      transaction: {
        id: transaction.id,
        amount,
        currency,
        status: 'COMPLETED',
        type: 'DEPOSIT',
        createdAt: transaction.createdAt,
      },
      message: 'Deposit completed successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Deposit validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });

// PUT /api/users/balance/transfer - Transfer between real and virtual balance
export const PUT = withAuth(async (request) => {
  try {
    validateMethod(request, ['PUT']);
    validateContentType(request);

    const userId = request.user.id;
    const body = await request.json();

    // Validate request data
    const { fromBalance, toBalance, amount, description } = transferSchema.parse(body);

    // Validate transfer direction
    if (fromBalance === toBalance) {
      return handleAPIError({
        name: 'InvalidTransferError',
        message: 'Cannot transfer between the same balance type',
      });
    }

    // Get user current balances
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        balanceReal: true,
        balanceVirtual: true,
        virtualMultiplier: true,
      },
    });

    if (!user) {
      return handleAPIError(new Error('User not found'));
    }

    const currentRealBalance = Number(user.balanceReal);
    const currentVirtualBalance = Number(user.balanceVirtual);
    const multiplier = Number(user.virtualMultiplier);

    // Calculate transfer amounts based on direction
    let realChange = 0;
    let virtualChange = 0;
    let transferDescription = description || '';

    if (fromBalance === 'real' && toBalance === 'virtual') {
      // Real to Virtual: Apply multiplier
      if (amount > currentRealBalance) {
        return handleAPIError({
          name: 'InsufficientFundsError',
          message: `Insufficient real balance. Available: $${currentRealBalance}`,
        });
      }
      realChange = -amount;
      virtualChange = amount * multiplier;
      transferDescription = transferDescription || `Convert $${amount} real to $${virtualChange} virtual`;
    } else if (fromBalance === 'virtual' && toBalance === 'real') {
      // Virtual to Real: Apply reverse multiplier
      if (amount > currentVirtualBalance) {
        return handleAPIError({
          name: 'InsufficientFundsError',
          message: `Insufficient virtual balance. Available: $${currentVirtualBalance}`,
        });
      }
      virtualChange = -amount;
      realChange = amount / multiplier;
      transferDescription = transferDescription || `Convert $${amount} virtual to $${realChange} real`;
    }

    const transactionId = `trf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Execute transfer in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Create transaction record
      await tx.transaction.create({
        data: {
          id: transactionId,
          userId,
          transactionType: 'TRANSFER',
          amountReal: realChange,
          amountVirtual: virtualChange,
          currency: 'USD',
          status: 'COMPLETED',
          description: transferDescription,
          metadata: {
            fromBalance,
            toBalance,
            multiplier,
            originalAmount: amount,
          },
          processedAt: new Date(),
        },
      });

      // Update user balances
      await tx.user.update({
        where: { id: userId },
        data: {
          balanceReal: {
            increment: realChange,
          },
          balanceVirtual: {
            increment: virtualChange,
          },
        },
      });
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        targetId: userId,
        entityType: 'user',
        entityId: userId,
        action: 'balance_transfer',
        newValues: {
          fromBalance,
          toBalance,
          amount,
          realChange,
          virtualChange,
          multiplier,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      transfer: {
        id: transactionId,
        fromBalance,
        toBalance,
        originalAmount: amount,
        realChange,
        virtualChange,
        multiplier,
        newBalances: {
          real: currentRealBalance + realChange,
          virtual: currentVirtualBalance + virtualChange,
        },
      },
      message: 'Balance transfer completed successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Transfer validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });