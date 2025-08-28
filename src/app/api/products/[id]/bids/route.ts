import type { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse 
} from '@/lib/api-response';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/products/[id]/bids - Get bid history for a product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    validateMethod(request, ['GET']);

    const { id } = await params;

    // Get the product to verify it exists and has auction functionality
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        auctionStatus: true,
        currentBid: true,
      },
    });

    if (!product) {
      return handleAPIError({
        name: 'ProductNotFoundError',
        message: 'Product not found',
      });
    }

    // Get all bids for this product, ordered by amount (highest first)
    const bids = await prisma.bid.findMany({
      where: { productId: id },
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
      orderBy: [
        { amount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Transform bids to match the expected format
    const transformedBids = bids.map((bid, index) => ({
      id: bid.id,
      amount: bid.amount,
      bidder: {
        id: bid.userId,
        name: `${bid.user.firstName} ${bid.user.lastName}`,
        isAnonymous: false,
        avatar: null, // TODO: Add avatar support
      },
      timestamp: bid.createdAt.toISOString(),
      isWinning: index === 0, // Highest bid is winning
      isAutomatic: false, // TODO: Add auto-bid support
    }));

    return successResponse({
      bids: transformedBids,
      totalBids: bids.length,
      highestBid: transformedBids.length > 0 ? transformedBids[0].amount : 0,
      message: 'Bid history retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}