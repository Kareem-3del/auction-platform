import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { verifyAccessToken } from 'src/lib/auth';
import { 
  apiResponse,
  successResponse,
  errorResponse,
  ErrorCodes,
  validationErrorResponse
} from 'src/lib/api-response';
import { getVirtualBalanceMultiplier } from 'src/lib/settings';

// Binance Pay API integration would go here in production
// For now, we'll simulate the recharge process

const rechargeSchema = z.object({
  amount: z.number().min(1).max(10000),
  currency: z.string().default('USDT'),
  paymentMethod: z.string().default('BINANCE_PAY'),
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
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { 
        id: true, 
        email: true, 
        isActive: true,
        balanceReal: true
      }
    });

    if (!user || !user.isActive) {
      return errorResponse(ErrorCodes.USER_NOT_FOUND, 'User not found or inactive', 404);
    }

    // Parse and validate request body
    const body = await request.json();
    const { amount, currency, paymentMethod } = rechargeSchema.parse(body);

    // Get virtual balance multiplier from settings
    const virtualMultiplier = await getVirtualBalanceMultiplier();

    // Generate unique transaction ID
    const transactionId = `binance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate Binance API call (replace with actual integration)
    const binanceResult = await simulateBinancePayment(amount, currency, user.id);
    
    if (binanceResult.success) {
      // Execute all operations in a database transaction for consistency
      const result = await prisma.$transaction(async (tx) => {
        // Create BinanceRecharge record
        const binanceRecharge = await tx.binanceRecharge.create({
          data: {
            userId: user.id,
            amount,
            currency,
            paymentMethod,
            status: 'COMPLETED',
            binanceOrderId: binanceResult.orderId,
            binanceTxId: binanceResult.txId,
            processedAt: new Date(),
            binanceResponse: binanceResult.response
          }
        });

        // Calculate processing fee (0.1%)
        const processingFee = amount * 0.001;
        const netAmount = amount - processingFee;

        // Update user real and virtual balance (after deducting fee)
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            balanceReal: {
              increment: netAmount,
            },
            balanceVirtual: {
              increment: netAmount * virtualMultiplier,
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
            amountVirtual: netAmount * virtualMultiplier,
            currency: 'USD',
            paymentMethod: 'BINANCE_PAY',
            externalReference: binanceResult.orderId,
            description: `Wallet recharge via Binance Pay - $${amount} (fee: $${processingFee.toFixed(2)})`,
            status: 'COMPLETED',
            processedAt: new Date(),
            metadata: {
              paymentMethod: 'binance',
              transactionId,
              binanceOrderId: binanceResult.orderId,
              binanceTxId: binanceResult.txId,
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
            message: `Your wallet has been recharged with $${netAmount.toFixed(2)} via Binance Pay (fee: $${processingFee.toFixed(2)}). Virtual balance: $${(netAmount * virtualMultiplier).toFixed(2)}`,
            deliveryMethod: 'IN_APP',
            data: {
              originalAmount: amount,
              netAmount: netAmount,
              processingFee: processingFee,
              virtualAmount: netAmount * virtualMultiplier,
              paymentMethod: 'binance',
              transactionId,
              binanceOrderId: binanceResult.orderId,
              binanceTxId: binanceResult.txId,
            },
          },
        });

        return { binanceRecharge, updatedUser };
      });

      const responseData = {
        recharge: {
          id: result.binanceRecharge.id,
          amount: Number(result.binanceRecharge.amount),
          currency: result.binanceRecharge.currency,
          status: result.binanceRecharge.status,
          orderId: result.binanceRecharge.binanceOrderId,
          transactionId,
          processedAt: result.binanceRecharge.processedAt,
        },
        newBalanceReal: Number(result.updatedUser.balanceReal),
        newBalanceVirtual: Number(result.updatedUser.balanceVirtual),
        virtualMultiplier,
        message: `Recharge completed successfully! Real: $${netAmount.toFixed(2)} (after $${processingFee.toFixed(2)} fee), Virtual: $${(netAmount * virtualMultiplier).toFixed(2)}`,
      };

      return successResponse(responseData);

    } else {
      // Create failed recharge record
      await prisma.binanceRecharge.create({
        data: {
          userId: user.id,
          amount,
          currency,
          paymentMethod,
          status: 'FAILED',
          failureReason: binanceResult.error,
          binanceResponse: binanceResult.response
        }
      });

      return errorResponse(ErrorCodes.PAYMENT_FAILED, `Recharge failed: ${binanceResult.error}`, 400);
    }

  } catch (error) {
    console.error('Binance recharge error:', error);
    
    if (error instanceof z.ZodError) {
      return validationErrorResponse('Invalid request data', error.errors);
    }

    return errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to process recharge', 500);
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
    
    // Get user recharge history
    const recharges = await prisma.binanceRecharge.findMany({
      where: { userId: payload.sub },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
        binanceOrderId: true,
        createdAt: true,
        processedAt: true,
        failureReason: true
      }
    });

    return apiResponse.success({ recharges });

  } catch (error) {
    console.error('Get recharge history error:', error);
    return apiResponse.internalError('Failed to get recharge history');
  }
}

// Simulate Binance Pay API (replace with actual integration)
async function simulateBinancePayment(amount: number, currency: string, userId: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // For testing purposes, always return success
  // In production, this would integrate with actual Binance Pay API
  return {
    success: true,
    orderId: `BNB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    txId: `BNTX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    response: {
      status: 'SUCCESS',
      amount,
      currency: 'USD', // Convert to USD for our system
      timestamp: new Date().toISOString(),
      userId,
      networkFee: amount * 0.001, // 0.1% network fee
      mockSimulation: true,
      binancePayVersion: '2.0'
    }
  };
}