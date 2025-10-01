import { NextRequest, NextResponse } from 'next/server';
import prisma from 'src/lib/prisma';

/**
 * Cron job endpoint to automatically update auction statuses
 * SCHEDULED -> LIVE (when startTime is reached)
 * LIVE -> ENDED (when endTime is reached)
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    // Update SCHEDULED auctions to LIVE if startTime has passed
    const scheduledToLive = await prisma.product.updateMany({
      where: {
        auctionStatus: 'SCHEDULED',
        startTime: {
          lte: now,
        },
      },
      data: {
        auctionStatus: 'LIVE',
      },
    });

    // Update LIVE auctions to ENDED if endTime has passed
    const liveToEnded = await prisma.product.updateMany({
      where: {
        auctionStatus: 'LIVE',
        endTime: {
          lte: now,
        },
      },
      data: {
        auctionStatus: 'ENDED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Auction statuses updated successfully',
      data: {
        scheduledToLive: scheduledToLive.count,
        liveToEnded: liveToEnded.count,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating auction statuses:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to update auction statuses',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
