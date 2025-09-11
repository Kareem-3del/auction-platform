import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse,
  validateContentType
} from 'src/lib/api-response';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const placeBidSchema = z.object({
  amount: z.number().positive('Bid amount must be positive'),
  bidType: z.enum(['MANUAL', 'AUTOMATIC']).default('MANUAL'),
  maxAmount: z.number().positive().optional(),
});

// GET /api/auctions/[id]/bids - Get bid history for auction
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    validateMethod(request, ['GET']);
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Check if auction exists
    const auction = await prisma.product.findUnique({
      where: { 
        id,
        auctionStatus: { in: ['SCHEDULED', 'LIVE', 'ENDED'] }
      },
      select: { id: true, title: true }
    });

    if (!auction) {
      return handleAPIError({
        name: 'AuctionNotFoundError',
        message: 'Auction not found',
      }, 404);
    }

    // Get bid history
    const totalCount = await prisma.bid.count({ 
      where: { productId: id } 
    });

    const bids = await prisma.bid.findMany({
      where: { productId: id },
      include: {
        user: {
          select: {
            id: true,
            anonymousDisplayName: true,
            isAnonymousDisplay: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const bidsData = bids.map((bid: any) => ({
      ...bid,
      amount: Number(bid.amount),
      maxAmount: bid.maxAmount ? Number(bid.maxAmount) : null,
      user: {
        id: bid.user.id,
        displayName: bid.user.isAnonymousDisplay 
          ? bid.user.anonymousDisplayName 
          : `${bid.user.firstName} ${bid.user.lastName}`,
      }
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return successResponse(bidsData, {
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

// POST /api/auctions/[id]/bids - Place bid on auction
export const POST = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);
    const { id } = await params;

    const body = await request.json();
    const validatedData = placeBidSchema.parse(body);

    // Check if auction exists and is live
    const auction = await prisma.product.findUnique({
      where: { 
        id,
        auctionStatus: 'LIVE'
      },
      select: { 
        id: true, 
        title: true, 
        currentBid: true, 
        startingBid: true,
        bidIncrement: true,
        endTime: true
      }
    });

    if (!auction) {
      return handleAPIError({
        name: 'AuctionNotFoundError',
        message: 'Auction not found or not currently live',
      }, 404);
    }

    // Check if auction has ended
    if (auction.endTime && new Date() > auction.endTime) {
      return handleAPIError({
        name: 'AuctionEndedError',
        message: 'This auction has already ended',
      }, 400);
    }

    const currentBid = Number(auction.currentBid) || Number(auction.startingBid) || 0;
    const bidIncrement = Number(auction.bidIncrement) || 1;
    const minBid = currentBid + bidIncrement;

    // Validate bid amount
    if (validatedData.amount < minBid) {
      return handleAPIError({
        name: 'InvalidBidError',
        message: `Minimum bid is $${minBid.toFixed(2)}`,
      }, 400);
    }

    // Create the bid
    const bid = await prisma.$transaction(async (tx) => {
      // Create bid record
      const newBid = await tx.bid.create({
        data: {
          productId: id,
          userId: request.user.id,
          amount: validatedData.amount,
          bidType: validatedData.bidType,
          maxAmount: validatedData.maxAmount,
        }
      });

      // Update product with new current bid
      await tx.product.update({
        where: { id },
        data: {
          currentBid: validatedData.amount,
          bidCount: { increment: 1 }
        }
      });

      return newBid;
    });

    return successResponse({
      ...bid,
      amount: Number(bid.amount),
      maxAmount: bid.maxAmount ? Number(bid.maxAmount) : null,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Invalid bid data',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });