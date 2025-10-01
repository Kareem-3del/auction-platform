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

    // Increment view count (async, don't wait for it)
    prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    }).catch(err => console.error('Failed to increment view count:', err));

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
      viewCount: auction.viewCount,
      watcherCount: auction.watcherCount,
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

    // Get existing auction
    const existingAuction = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        agentId: true,
        auctionStatus: true,
      }
    });

    if (!existingAuction) {
      return handleAPIError({
        name: 'AuctionNotFoundError',
        message: 'Auction not found',
      }, 404);
    }

    // If user is an agent, verify they own this auction
    if (request.user.userType === 'AGENT') {
      const agent = await prisma.agent.findUnique({
        where: { userId: request.user.id },
        select: { id: true },
      });

      if (!agent || existingAuction.agentId !== agent.id) {
        return handleAPIError({
          name: 'UnauthorizedError',
          message: 'You can only update your own auctions',
        });
      }
    }

    const body = await request.json();

    // Build update data object
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startingBid !== undefined) updateData.startingBid = body.startingBid;
    if (body.reservePrice !== undefined) updateData.reservePrice = body.reservePrice;
    if (body.bidIncrement !== undefined) updateData.bidIncrement = body.bidIncrement;
    if (body.startTime !== undefined) updateData.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) updateData.endTime = new Date(body.endTime);
    if (body.auctionStatus !== undefined) updateData.auctionStatus = body.auctionStatus;

    // Handle images - convert array to JSON string for storage
    if (body.images !== undefined) {
      updateData.images = JSON.stringify(body.images);
    }

    // Update the auction
    const updatedAuction = await prisma.product.update({
      where: { id },
      data: updateData,
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
          },
        },
      },
    });

    return successResponse({
      ...updatedAuction,
      images: typeof updatedAuction.images === 'string'
        ? JSON.parse(updatedAuction.images)
        : updatedAuction.images,
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