
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { NotificationService } from 'src/lib/notification-service';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType,
  errorResponse,
  ErrorCodes
} from 'src/lib/api-response';

// Validation schema for placing bids
const placeBidSchema = z.object({
  amount: z.number().positive('Bid amount must be positive'),
  isAnonymous: z.boolean().optional().default(false),
  customName: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/products/[id]/bid - Place a bid on a product
export const POST = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    const { id } = await params;
    const body = await request.json();
    const validatedData = placeBidSchema.parse(body);

    // Get the product with auction details
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        auctionStatus: true,
        currentBid: true,
        startingBid: true,
        bidIncrement: true,
        startTime: true,
        endTime: true,
        bidCount: true,
        highestBidderId: true,
      },
    });

    if (!product) {
      return errorResponse(ErrorCodes.PRODUCT_NOT_FOUND, 'Product not found', 404);
    }

    // Check if auction is active
    if (product.auctionStatus !== 'LIVE') {
      return errorResponse(ErrorCodes.AUCTION_NOT_LIVE, 'This auction is not currently active', 400);
    }

    // Check if auction has ended
    if (product.endTime && new Date(product.endTime) < new Date()) {
      return errorResponse(ErrorCodes.AUCTION_ENDED, 'This auction has already ended', 400);
    }

    // Calculate minimum bid (convert Decimal to number for arithmetic)
    const currentBid = product.currentBid ? product.currentBid.toNumber() : 
                      (product.startingBid ? product.startingBid.toNumber() : 0);
    const bidIncrement = product.bidIncrement ? product.bidIncrement.toNumber() : 5;
    const minimumBid = currentBid + bidIncrement;

    // Validate bid amount
    if (validatedData.amount < minimumBid) {
      return errorResponse(ErrorCodes.BID_TOO_LOW, `Minimum bid amount is $${minimumBid.toFixed(2)}`, 400);
    }

    // Check user's virtual balance and account for their existing bid if they are the current highest bidder
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        balanceVirtual: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return errorResponse(ErrorCodes.USER_NOT_FOUND, 'User not found', 404);
    }

    const userVirtualBalance = user.balanceVirtual.toNumber();
    let requiredBalance = validatedData.amount;
    
    // If the user is already the highest bidder, they only need to pay the difference
    if (product.highestBidderId === request.user.id && product.currentBid) {
      const currentBidAmount = product.currentBid.toNumber();
      requiredBalance = validatedData.amount - currentBidAmount;
    }
    
    // Check if user has enough virtual balance for the required amount
    if (userVirtualBalance < requiredBalance) {
      return errorResponse(
        ErrorCodes.INSUFFICIENT_BALANCE, 
        `Insufficient virtual balance. Required: $${requiredBalance.toFixed(2)}, Available: $${userVirtualBalance.toFixed(2)}`, 
        400
      );
    }

    // Allow users to increase their own bids (self-outbidding allowed)

    // Create the bid and deduct balance in a transaction
    const bid = await prisma.$transaction(async (tx) => {
      let actualDeductionAmount = validatedData.amount;
      
      // If there's a previous highest bidder who isn't the current user, refund their bid
      if (product.highestBidderId && product.highestBidderId !== request.user.id && product.currentBid) {
        const previousBidAmount = product.currentBid.toNumber();
        
        // Refund the previous highest bidder
        await tx.user.update({
          where: { id: product.highestBidderId },
          data: {
            balanceVirtual: {
              increment: previousBidAmount,
            },
          },
        });

        // Create refund transaction record
        await tx.transaction.create({
          data: {
            userId: product.highestBidderId,
            transactionType: 'REFUND',
            amountReal: 0,
            amountVirtual: previousBidAmount,
            currency: 'USD',
            description: `Bid refund for ${product.title} - $${previousBidAmount} (outbid)`,
            externalReference: `REFUND_${id}_${Date.now()}`,
            status: 'COMPLETED',
          },
        });
      } else if (product.highestBidderId === request.user.id && product.currentBid) {
        // User is increasing their own bid, only deduct the difference
        const currentBidAmount = product.currentBid.toNumber();
        actualDeductionAmount = validatedData.amount - currentBidAmount;
      }

      // Create the bid
      const newBid = await tx.bid.create({
        data: {
          amount: validatedData.amount,
          userId: request.user.id,
          productId: id,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Deduct the required amount from user's virtual balance
      if (actualDeductionAmount > 0) {
        await tx.user.update({
          where: { id: request.user.id },
          data: {
            balanceVirtual: {
              decrement: actualDeductionAmount,
            },
          },
        });

        // Create transaction record for the bid deduction
        await tx.transaction.create({
          data: {
            userId: request.user.id,
            transactionType: 'BID_PLACEMENT',
            amountReal: 0,
            amountVirtual: actualDeductionAmount,
            currency: 'USD',
            description: `Bid placed on ${product.title} - $${validatedData.amount} (deducted: $${actualDeductionAmount})`,
            externalReference: `BID_${newBid.id}`,
            status: 'COMPLETED',
          },
        });
      }

      return newBid;
    });

    // Send notification about the bid (async - don't fail if this fails)
    NotificationService.sendBidPlacedNotification(bid.id).catch(error => {
      console.error('❌ Failed to send bid notification:', error);
    });

    // Update product with new bid information
    await prisma.product.update({
      where: { id },
      data: {
        currentBid: validatedData.amount,
        bidCount: (product.bidCount || 0) + 1,
        highestBidderId: request.user.id,
        lastBidAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'bid',
        entityId: bid.id,
        action: 'bid_placed',
        newValues: {
          productId: id,
          amount: validatedData.amount,
          isAnonymous: validatedData.isAnonymous,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Broadcast real-time bid update to all connected clients via WebSocket server
    setImmediate(async () => {
      try {
        const bidderName = validatedData.customName || `${user.firstName} ${user.lastName}`;
        
        const bidUpdate = {
          type: 'bid_update',
          productId: id,
          bid: {
            id: bid.id,
            amount: bid.amount.toNumber(),
            bidTime: bid.createdAt.toISOString(),
            userId: bid.userId,
            bidderName: validatedData.isAnonymous ? 'Anonymous Bidder' : bidderName,
          },
          currentBid: validatedData.amount,
          bidCount: (product.bidCount || 0) + 1,
          message: `New bid: $${validatedData.amount.toFixed(2)} by ${validatedData.isAnonymous ? 'Anonymous Bidder' : bidderName}`,
        };

        // Make HTTP request to WebSocket server's internal broadcast endpoint
        const wsServerUrl = process.env.WS_SERVER_URL || 'http://localhost:8081';
        
        const response = await fetch(`${wsServerUrl}/broadcast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'bid_update',
            data: bidUpdate
          }),
        }).catch(error => {
          console.error('❌ HTTP broadcast request failed:', error);
          return null;
        });

        if (response && response.ok) {
          console.log(`📡 Broadcast bid update for product ${id}: $${validatedData.amount} by ${bidderName}`);
        } else {
          console.warn('⚠️ Failed to broadcast bid update via HTTP');
        }
      } catch (error) {
        console.error('❌ Failed to broadcast bid update:', error);
        // Don't fail the bid if WebSocket broadcast fails - this runs async
      }
    });

    return successResponse({
      bid: {
        id: bid.id,
        amount: bid.amount.toNumber(),
        bidTime: bid.createdAt,
        userId: bid.userId,
        bidderName: validatedData.customName || `${bid.user.firstName} ${bid.user.lastName}`,
      },
      message: 'Bid placed successfully',
    });

  } catch (error) {
    console.error('❌ Bid placement error:', error);
    
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Invalid bid data provided',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    // Handle Prisma errors specifically
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      
      // Handle common Prisma errors
      if (prismaError.code === 'P2002') {
        return handleAPIError({
          name: 'DuplicateEntryError',
          message: 'A bid with this data already exists',
        });
      }
      
      if (prismaError.code === 'P2025') {
        return handleAPIError({
          name: 'RecordNotFoundError',
          message: 'Product or user not found',
        });
      }
      
      if (prismaError.code === 'P1001' || prismaError.code === 'P1017') {
        return handleAPIError({
          name: 'DatabaseConnectionError',
          message: 'Database connection failed. Please try again.',
        });
      }
    }
    
    // Handle network/timeout errors
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
        return handleAPIError({
          name: 'TimeoutError',
          message: 'Request timed out. Please try again.',
        });
      }
      
      if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
        return handleAPIError({
          name: 'NetworkError',
          message: 'Network error occurred. Please check your connection.',
        });
      }
    }

    // Generic fallback
    return handleAPIError({
      name: 'InternalServerError',
      message: 'An unexpected error occurred while processing your bid. Please try again.',
    });
  }
}, { required: true });