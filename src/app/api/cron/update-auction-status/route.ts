import { NextRequest, NextResponse } from 'next/server';
import prisma from 'src/lib/prisma';

/**
 * Cron job endpoint to automatically update auction statuses
 * SCHEDULED -> LIVE (when startTime is reached)
 * LIVE -> ENDED (when endTime is reached)
 * Process winner payment when auction ends
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

    // Find LIVE auctions that have ended and need payment processing
    const endedAuctions = await prisma.product.findMany({
      where: {
        auctionStatus: 'LIVE',
        endTime: {
          lte: now,
        },
      },
      include: {
        bids: {
          orderBy: {
            amount: 'desc',
          },
          take: 1,
          include: {
            user: true,
          },
        },
      },
    });

    let processedPayments = 0;
    let failedPayments = 0;

    // Process payment for each ended auction
    for (const auction of endedAuctions) {
      try {
        if (auction.bids.length > 0) {
          const winningBid = auction.bids[0];
          const winner = winningBid.user;

          // Check if winner has sufficient balance
          if (winner.balanceReal >= winningBid.amount) {
            // Process payment in a transaction
            await prisma.$transaction(async (tx) => {
              // Deduct from winner's real balance
              await tx.user.update({
                where: { id: winner.id },
                data: {
                  balanceReal: {
                    decrement: winningBid.amount,
                  },
                },
              });

              // Create transaction record
              await tx.transaction.create({
                data: {
                  userId: winner.id,
                  type: 'PAYMENT',
                  amount: winningBid.amount,
                  balanceType: 'REAL',
                  description: `Payment for winning auction: ${auction.title}`,
                  metadata: {
                    auctionId: auction.id,
                    bidId: winningBid.id,
                    auctionTitle: auction.title,
                  },
                },
              });

              // Update auction status to ENDED
              await tx.product.update({
                where: { id: auction.id },
                data: {
                  auctionStatus: 'ENDED',
                },
              });
            });

            processedPayments++;
          } else {
            // Insufficient balance - still end auction but log warning
            await prisma.product.update({
              where: { id: auction.id },
              data: {
                auctionStatus: 'ENDED',
              },
            });

            console.warn(`Winner ${winner.id} has insufficient balance for auction ${auction.id}. Required: ${winningBid.amount}, Available: ${winner.balanceReal}`);
            failedPayments++;
          }
        } else {
          // No bids - just end the auction
          await prisma.product.update({
            where: { id: auction.id },
            data: {
              auctionStatus: 'ENDED',
            },
          });
        }
      } catch (error) {
        console.error(`Error processing auction ${auction.id}:`, error);
        failedPayments++;

        // Still try to end the auction even if payment fails
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

    return NextResponse.json({
      success: true,
      message: 'Auction statuses updated successfully',
      data: {
        scheduledToLive: scheduledToLive.count,
        liveToEnded: endedAuctions.length,
        paymentsProcessed: processedPayments,
        paymentsFailed: failedPayments,
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
