import type { NextRequest } from 'next/server';

import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse 
} from 'src/lib/api-response';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/auctions/[id] - Get single auction
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    validateMethod(request, ['GET']);
    const { id } = await params;

    const auction = await prisma.product.findUnique({
      where: { 
        id,
        auctionStatus: {
          in: ['SCHEDULED', 'LIVE', 'ENDED']
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        agent: {
          select: {
            id: true,
            displayName: true,
            businessName: true,
            logoUrl: true,
            rating: true,
            reviewCount: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!auction) {
      return handleAPIError({
        name: 'AuctionNotFoundError',
        message: 'Auction not found',
      }, 404);
    }

    const auctionData = {
      ...auction,
      images: typeof auction.images === 'string' ? JSON.parse(auction.images) : auction.images,
      estimatedValueMin: Number(auction.estimatedValueMin),
      estimatedValueMax: Number(auction.estimatedValueMax),
      reservePrice: auction.reservePrice ? Number(auction.reservePrice) : null,
      startingBid: auction.startingBid ? Number(auction.startingBid) : null,
      currentBid: auction.currentBid ? Number(auction.currentBid) : 0,
      bidIncrement: auction.bidIncrement ? Number(auction.bidIncrement) : null,
      buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
    };

    return successResponse(auctionData);

  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT /api/auctions/[id] - Update auction (Agent/Admin only)
export const PUT = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['PUT']);
    const { id } = await params;

    // Check permissions
    if (!['AGENT', 'ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Only authorized users can update auctions',
      });
    }

    // Implementation for updating auction would go here
    return handleAPIError({
      name: 'NotImplementedError',
      message: 'Auction update not implemented yet',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// DELETE /api/auctions/[id] - Delete auction (Agent/Admin only)  
export const DELETE = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['DELETE']);
    const { id } = await params;

    // Check permissions
    if (!['AGENT', 'ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Only authorized users can delete auctions',
      });
    }

    // Implementation for deleting auction would go here
    return handleAPIError({
      name: 'NotImplementedError',
      message: 'Auction deletion not implemented yet',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });