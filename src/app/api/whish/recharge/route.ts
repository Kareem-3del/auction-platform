import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { verifyAccessToken } from 'src/lib/auth';
import { 
  successResponse, 
  errorResponse, 
  ErrorCodes,
  validationErrorResponse 
} from 'src/lib/api-response';
import { getVirtualBalanceMultiplier } from 'src/lib/settings';

const rechargeSchema = z.object({
  amount: z.number().min(1).max(10000),
  currency: z.string().default('USD'),
  paymentMethod: z.string().default('WHISH_MONEY'),
});

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse(ErrorCodes.AUTH_TOKEN_INVALID, 'Authentication required', 401);
    }

    const token = authHeader.substring(7);
    let payload;
    
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      return errorResponse(ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid token', 401);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return errorResponse(ErrorCodes.USER_NOT_FOUND, 'User not found or inactive', 404);
    }

    const body = await request.json();
    const validatedData = rechargeSchema.parse(body);
    const { amount, currency, paymentMethod } = validatedData;

    // Get virtual balance multiplier from settings
    const virtualMultiplier = await getVirtualBalanceMultiplier();

    // Simulate Whish.money payment processing
    // In a real implementation, you would integrate with Whish.money's API
    const transactionId = `whish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Execute all operations in a database transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create WhishRecharge record
      const whishRecharge = await tx.whishRecharge.create({
        data: {
          userId: user.id,
          amount,
          currency,
          status: 'COMPLETED', // Simulating successful payment
          transactionId,
          whishPaymentId: `whish_${transactionId}`,
          processingFee: amount * 0.025, // 2.5% processing fee
          paymentMethod,
          processedAt: new Date(),
        },
      });

      // Calculate processing fee (2.5%)
      const processingFee = amount * 0.025;
      const netAmount = amount - processingFee;

      // Update user real and virtual balance (after deducting fee)
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balanceReal: {
            increment: netAmount,
          },
          balanceVirtual: {
            increment: netAmount * virtualMultiplier, // Use settings multiplier
          },
        },
        select: {
          balanceReal: true,
          balanceVirtual: true,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          transactionType: 'DEPOSIT',
          amountReal: netAmount,
          amountVirtual: netAmount * virtualMultiplier, // Virtual balance with settings multiplier
          currency: 'USD',
          paymentMethod: 'WHISH_MONEY',
          externalReference: whishRecharge.whishPaymentId,
          description: `Wallet recharge via Whish.money - $${amount} (fee: $${processingFee.toFixed(2)})`,
          status: 'COMPLETED',
          processedAt: new Date(),
          metadata: {
            paymentMethod: 'whish',
            transactionId,
            whishPaymentId: whishRecharge.whishPaymentId,
            originalAmount: amount,
            processingFee: processingFee,
            netAmount: netAmount,
            virtualMultiplier,
          },
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: user.id,
          notificationType: 'PAYMENT_RECEIVED',
          title: 'Wallet Recharged Successfully',
          message: `Your wallet has been recharged with $${netAmount.toFixed(2)} via Whish.money (fee: $${processingFee.toFixed(2)}). Virtual balance: $${(netAmount * virtualMultiplier).toFixed(2)}`,
          deliveryMethod: 'IN_APP',
          data: {
            originalAmount: amount,
            netAmount: netAmount,
            processingFee: processingFee,
            virtualAmount: netAmount * virtualMultiplier,
            paymentMethod: 'whish',
            transactionId,
            whishPaymentId: whishRecharge.whishPaymentId,
          },
        },
      });

      return { whishRecharge, updatedUser };
    });

    const responseData = {
      recharge: {
        id: result.whishRecharge.id,
        amount: Number(result.whishRecharge.amount),
        currency: result.whishRecharge.currency,
        status: result.whishRecharge.status,
        transactionId: result.whishRecharge.transactionId,
        processedAt: result.whishRecharge.processedAt,
      },
      newBalanceReal: Number(result.updatedUser.balanceReal),
      newBalanceVirtual: Number(result.updatedUser.balanceVirtual),
      virtualMultiplier,
      message: `Recharge completed successfully! Real: $${netAmount.toFixed(2)} (after $${processingFee.toFixed(2)} fee), Virtual: $${(netAmount * virtualMultiplier).toFixed(2)}`,
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Whish recharge error:', error);
    
    if (error instanceof z.ZodError) {
      return validationErrorResponse('Invalid request data', error.errors);
    }
    
    return errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to process recharge', 500);
  }
}