import { NextRequest, NextResponse } from 'next/server';
import prisma from 'src/lib/prisma';
import { AuctionSettlementService } from 'src/lib/auction-settlement';

/**
 * Cron job endpoint to automatically update auction statuses
 * SCHEDULED -> LIVE (when startTime is reached)
 * LIVE -> ENDED (when endTime is reached)
 * Process winner payment when auction ends using proper settlement service
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

    console.log(`📢 Updated ${scheduledToLive.count} auctions from SCHEDULED to LIVE`);

    // Find LIVE auctions that have ended and need settlement
    const endedAuctions = await prisma.product.findMany({
      where: {
        auctionStatus: 'LIVE',
        endTime: {
          lte: now,
        },
      },
      select: {
        id: true,
        title: true,
        endTime: true,
      },
    });

    console.log(`🏁 Found ${endedAuctions.length} auctions that need settlement`);

    let processedSettlements = 0;
    let failedSettlements = 0;
    const settlementResults = [];

    // Process settlement for each ended auction using the settlement service
    for (const auction of endedAuctions) {
      try {
        console.log(`⚙️ Processing settlement for auction ${auction.id}: "${auction.title}"`);

        const settlementResult = await AuctionSettlementService.processAuctionEnd(auction.id);

        if (settlementResult.success) {
          processedSettlements++;
          console.log(`✅ Settlement successful for auction ${auction.id}`);
        } else {
          failedSettlements++;
          console.error(`❌ Settlement failed for auction ${auction.id}:`, settlementResult.errors);
        }

        settlementResults.push({
          auctionId: auction.id,
          auctionTitle: auction.title,
          success: settlementResult.success,
          winnerId: settlementResult.winnerId,
          finalPrice: settlementResult.finalPrice,
          balanceUpdates: settlementResult.balanceUpdates.length,
          errors: settlementResult.errors,
        });

      } catch (error) {
        console.error(`💥 Error processing settlement for auction ${auction.id}:`, error);
        failedSettlements++;

        settlementResults.push({
          auctionId: auction.id,
          auctionTitle: auction.title,
          success: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });

        // Still try to end the auction even if settlement fails
        try {
          await prisma.product.update({
            where: { id: auction.id },
            data: {
              auctionStatus: 'ENDED',
            },
          });
        } catch (updateError) {
          console.error(`Failed to end auction ${auction.id}:`, updateError);
        }
      }
    }

    console.log(`📊 Settlement Summary: ${processedSettlements} successful, ${failedSettlements} failed`);

    return NextResponse.json({
      success: true,
      message: 'Auction statuses updated successfully',
      data: {
        scheduledToLive: scheduledToLive.count,
        auctionsSettled: endedAuctions.length,
        settlementsProcessed: processedSettlements,
        settlementsFailed: failedSettlements,
        settlementResults: settlementResults,
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
