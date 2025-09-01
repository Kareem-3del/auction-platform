
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { 
  ErrorCodes, 
  errorResponse, 
  handleAPIError, 
  validateMethod,
  successResponse,
  validateContentType,
  validateRequiredFields
} from 'src/lib/api-response';

// Validation schema
const chargeAccountSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(10000, 'Maximum charge amount is $10,000'),
  paymentMethod: z.enum(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'STRIPE']),
  currency: z.string().default('USD'),
  description: z.string().optional(),
});

export const POST = withAuth(async (request) => {
  try {
    // Validate request method and content type
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['amount', 'paymentMethod']);
    if (!validation.isValid) {
      return errorResponse(
        ErrorCodes.VALIDATION_FAILED,
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      );
    }

    // Validate with Zod schema
    const validatedData = chargeAccountSchema.parse(body);

    // Get user from request (available from withAuth)
    const userId = request.user.id;

    // Create charge record in database
    const chargeRecord = await prisma.transaction.create({
      data: {
        userId,
        transactionType: 'DEPOSIT',
        amountReal: validatedData.amount,
        amountVirtual: 0,
        currency: validatedData.currency,
        paymentMethod: validatedData.paymentMethod,
        status: 'PENDING',
        description: validatedData.description || `Account charge via ${validatedData.paymentMethod}`,
        metadata: {
          chargeMethod: validatedData.paymentMethod,
          requestedAt: new Date().toISOString(),
        },
      },
    });

    // For demo purposes, we'll simulate successful payment processing
    // In production, you would integrate with actual payment providers
    let paymentResult;
    
    switch (validatedData.paymentMethod) {
      case 'CREDIT_CARD':
        // Simulate Stripe/payment gateway processing
        paymentResult = {
          success: true,
          transactionId: `cc_${Date.now()}`,
          message: 'Credit card payment processed successfully',
        };
        break;
        
      case 'PAYPAL':
        // Simulate PayPal processing
        paymentResult = {
          success: true,
          transactionId: `pp_${Date.now()}`,
          message: 'PayPal payment processed successfully',
        };
        break;
        
      case 'BANK_TRANSFER':
        // Bank transfer usually requires manual verification
        paymentResult = {
          success: true,
          transactionId: `bt_${Date.now()}`,
          message: 'Bank transfer initiated - pending verification',
          requiresVerification: true,
        };
        break;
        
      case 'STRIPE':
        // Simulate Stripe processing
        paymentResult = {
          success: true,
          transactionId: `stripe_${Date.now()}`,
          message: 'Stripe payment processed successfully',
        };
        break;
        
      default:
        throw new Error('Unsupported payment method');
    }

    if (paymentResult.success) {
      // Update transaction status
      await prisma.transaction.update({
        where: { id: chargeRecord.id },
        data: {
          status: paymentResult.requiresVerification ? 'PENDING' : 'COMPLETED',
          externalReference: paymentResult.transactionId,
          processedAt: new Date(),
          paymentDetails: {
            ...(chargeRecord.metadata as object || {}),
            paymentResult,
          },
        },
      });

      // If payment is successful and doesn't require verification, update user balance
      if (!paymentResult.requiresVerification) {
        const virtualAmount = validatedData.amount * 3; // Virtual balance is 3x real balance
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            balanceReal: {
              increment: validatedData.amount,
            },
            balanceVirtual: {
              increment: virtualAmount,
            },
          },
        });
      }

      // Log successful charge
      console.log(`💰 Account charged: User ${userId} charged $${validatedData.amount} via ${validatedData.paymentMethod}`);

      return successResponse({
        transaction: {
          id: chargeRecord.id,
          amount: validatedData.amount,
          currency: validatedData.currency,
          paymentMethod: validatedData.paymentMethod,
          status: paymentResult.requiresVerification ? 'pending_verification' : 'completed',
          transactionId: paymentResult.transactionId,
        },
        message: paymentResult.message,
        requiresVerification: paymentResult.requiresVerification || false,
      });
    } else {
      // Update transaction as failed
      await prisma.transaction.update({
        where: { id: chargeRecord.id },
        data: {
          status: 'FAILED',
          paymentDetails: {
            ...(chargeRecord.metadata as object || {}),
            paymentResult,
          },
        },
      });

      return errorResponse(
        ErrorCodes.PAYMENT_FAILED,
        paymentResult.message || 'Payment processing failed',
        400
      );
    }

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

// GET endpoint to retrieve charge history
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    const userId = request.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = (page - 1) * limit;

    // Get user's charge history
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionType: 'DEPOSIT',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        amountReal: true,
        amountVirtual: true,
        currency: true,
        paymentMethod: true,
        status: true,
        description: true,
        externalReference: true,
        createdAt: true,
        processedAt: true,
      },
    });

    // Get total count for pagination
    const total = await prisma.transaction.count({
      where: {
        userId,
        transactionType: 'DEPOSIT',
      },
    });

    return successResponse({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });