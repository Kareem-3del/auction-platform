
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType 
} from '@/lib/api-response';

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
      return handleAPIError({
        name: 'ProductNotFoundError',
        message: 'Product not found',
      });
    }

    // Check if auction is active
    if (product.auctionStatus !== 'LIVE') {
      return handleAPIError({
        name: 'AuctionNotActiveError',
        message: 'This auction is not currently active',
      });
    }

    // Check if auction has ended
    if (product.endTime && new Date(product.endTime) < new Date()) {
      return handleAPIError({
        name: 'AuctionEndedError',
        message: 'This auction has already ended',
      });
    }

    // Calculate minimum bid (convert Decimal to number for arithmetic)
    const currentBid = product.currentBid ? product.currentBid.toNumber() : 
                      (product.startingBid ? product.startingBid.toNumber() : 0);
    const bidIncrement = product.bidIncrement ? product.bidIncrement.toNumber() : 5;
    const minimumBid = currentBid + bidIncrement;

    // Validate bid amount
    if (validatedData.amount < minimumBid) {
      return handleAPIError({
        name: 'InvalidBidAmountError',
        message: `Minimum bid amount is $${minimumBid.toFixed(2)}`,
      });
    }

    // Check user's virtual balance
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
      return handleAPIError({
        name: 'UserNotFoundError',
        message: 'User not found',
      });
    }

    const userVirtualBalance = user.balanceVirtual.toNumber();
    
    // Check if user has enough virtual balance
    if (userVirtualBalance < validatedData.amount) {
      return handleAPIError({
        name: 'InsufficientBalanceError',
        message: `Insufficient virtual balance. Required: $${validatedData.amount.toFixed(2)}, Available: $${userVirtualBalance.toFixed(2)}`,
      });
    }

    // Prevent self-outbidding (user can't outbid themselves)
    if (product.highestBidderId === request.user.id) {
      return handleAPIError({
        name: 'SelfOutbidError',
        message: 'You are already the highest bidder',
      });
    }

    // Create the bid
    const bid = await prisma.bid.create({
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

    // Broadcast real-time bid update to all connected clients
    try {
      // Initialize WebSocket server if not already initialized
      await import('@/lib/websocket/server-init');
      const { getBiddingServer } = await import('@/lib/websocket/bidding-server');
      const biddingServer = getBiddingServer();
      
      const bidderName = validatedData.customName || `${user.firstName} ${user.lastName}`;

      biddingServer.broadcastBidUpdate(id, {
        type: 'bid_update',
        productId: id,
        bid: {
          id: bid.id,
          amount: bid.amount.toNumber(),
          bidTime: bid.createdAt.toISOString(),
          userId: bid.userId,
          bidderName,
        },
        currentBid: validatedData.amount,
        bidCount: (product.bidCount || 0) + 1,
        message: `New bid placed: $${validatedData.amount.toFixed(2)} by ${bidderName}`,
      });

      console.log(`📡 Broadcast bid update for product ${id}: $${validatedData.amount} by ${bidderName}`);
    } catch (error) {
      console.error('❌ Failed to broadcast bid update:', error);
      // Don't fail the bid if WebSocket fails
    }

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