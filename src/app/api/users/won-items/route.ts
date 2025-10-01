import { NextRequest, NextResponse } from 'next/server';
import prisma from 'src/lib/prisma';
import { getCurrentUser } from 'src/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await getCurrentUser(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Find all ended auctions where this user was the highest bidder
    const wonAuctions = await prisma.product.findMany({
      where: {
        auctionStatus: 'ENDED',
        highestBidderId: userId,
      },
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
          take: 1,
        },
        bids: {
          where: {
            userId: userId,
          },
          orderBy: {
            amount: 'desc',
          },
          take: 1,
        },
        agent: {
          select: {
            id: true,
            businessName: true,
            displayName: true,
            logoUrl: true,
          },
        },
      },
      orderBy: {
        endTime: 'desc',
      },
    });

    const formattedWonItems = wonAuctions.map((auction) => ({
      id: auction.id,
      title: auction.title,
      description: auction.description,
      image: auction.images?.[0]?.url || null,
      winningBid: auction.currentBid,
      endTime: auction.endTime,
      condition: auction.condition,
      location: auction.location,
      agent: auction.agent,
      bidCount: auction.bidCount,
    }));

    return NextResponse.json({
      success: true,
      data: {
        wonItems: formattedWonItems,
        total: formattedWonItems.length,
      },
    });
  } catch (error) {
    console.error('Error fetching won items:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch won items',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
