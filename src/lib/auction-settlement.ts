import { prisma } from './prisma';
import { NotificationService } from './notification-service';
import { Decimal } from '@prisma/client/runtime/library';

export interface AuctionSettlementResult {
  success: boolean;
  winnerId?: string;
  finalPrice?: number;
  balanceUpdates: Array<{
    userId: string;
    type: 'REFUND' | 'DEDUCTION' | 'WARNING';
    amount: number;
    newBalance: number;
    status: 'SUCCESS' | 'NEGATIVE_BALANCE' | 'ERROR';
  }>;
  errors: string[];
}

export class AuctionSettlementService {
  /**
   * Process auction end and handle all balance settlements
   */
  static async processAuctionEnd(productId: string): Promise<AuctionSettlementResult> {
    const result: AuctionSettlementResult = {
      success: false,
      balanceUpdates: [],
      errors: []
    };

    try {
      console.log(`🏁 Processing auction settlement for ${productId}`);

      // Start a transaction to ensure data consistency
      const settlement = await prisma.$transaction(async (tx) => {
        // Get auction details and all bids
        const product = await tx.product.findUnique({
          where: { id: productId },
          include: {
            bids: {
              orderBy: { amount: 'desc' },
              include: { user: true }
            },
            agent: true
          }
        });

        if (!product) {
          throw new Error('Auction not found');
        }

        // Update auction status to ENDED
        await tx.product.update({
          where: { id: productId },
          data: { auctionStatus: 'ENDED' }
        });

        if (product.bids.length === 0) {
          console.log(`📝 Auction ${productId} ended with no bids`);
          return { winnerId: null, finalPrice: 0, bidders: [] };
        }

        // Get winning bid (highest amount)
        const winningBid = product.bids[0];
        const finalPrice = Number(winningBid.amount);
        
        // Update product with winner info
        await tx.product.update({
          where: { id: productId },
          data: {
            winnerId: winningBid.userId,
            finalPrice: new Decimal(finalPrice)
          }
        });

        // Get all unique bidders
        const uniqueBidders = new Map();
        product.bids.forEach(bid => {
          if (!uniqueBidders.has(bid.userId)) {
            uniqueBidders.set(bid.userId, {
              user: bid.user,
              highestBid: Number(bid.amount),
              isWinner: bid.userId === winningBid.userId
            });
          } else {
            const existing = uniqueBidders.get(bid.userId);
            if (Number(bid.amount) > existing.highestBid) {
              existing.highestBid = Number(bid.amount);
            }
          }
        });

        return {
          winnerId: winningBid.userId,
          finalPrice,
          product,
          bidders: Array.from(uniqueBidders.values())
        };
      });

      if (!settlement.winnerId) {
        result.success = true;
        return result;
      }

      result.winnerId = settlement.winnerId;
      result.finalPrice = settlement.finalPrice;

      // Process each bidder's balance
      for (const bidder of settlement.bidders) {
        try {
          if (bidder.isWinner) {
            // Winner: Deduct final price from real balance
            const balanceUpdate = await this.processWinnerSettlement(
              bidder.user.id,
              settlement.finalPrice,
              settlement.product.title,
              productId
            );
            result.balanceUpdates.push(balanceUpdate);
          } else {
            // Loser: Refund their highest bid from virtual balance to real balance
            const balanceUpdate = await this.processLoserRefund(
              bidder.user.id,
              bidder.highestBid,
              settlement.product.title,
              productId
            );
            result.balanceUpdates.push(balanceUpdate);
          }
        } catch (error) {
          console.error(`Error processing settlement for user ${bidder.user.id}:`, error);
          result.errors.push(`Failed to settle for user ${bidder.user.id}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;

      console.log(`✅ Auction settlement completed for ${productId}. Winner: ${settlement.winnerId}, Final Price: $${settlement.finalPrice}`);
      
      return result;

    } catch (error) {
      console.error(`❌ Error in auction settlement for ${productId}:`, error);
      result.errors.push(`Settlement failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Process winner settlement: Deduct final price from real balance
   */
  private static async processWinnerSettlement(
    userId: string,
    finalPrice: number,
    productTitle: string,
    productId: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const currentRealBalance = Number(user.balanceReal);
      const newRealBalance = currentRealBalance - finalPrice;

      // Update user's real balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          balanceReal: new Decimal(newRealBalance)
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId,
          type: 'AUCTION_WIN',
          amount: new Decimal(finalPrice),
          balanceType: 'REAL',
          status: 'COMPLETED',
          description: `Payment for winning auction: "${productTitle}"`,
          metadata: {
            productId,
            auctionEndTime: new Date(),
            finalPrice,
            previousBalance: currentRealBalance,
            newBalance: newRealBalance
          }
        }
      });

      // Send notifications based on balance status
      if (newRealBalance < 0) {
        // Negative balance - send warning notification
        await NotificationService.createNotification({
          userId,
          type: 'PAYMENT_REQUIRED',
          title: '⚠️ Payment Required - Negative Balance',
          message: `Your account balance is now -$${Math.abs(newRealBalance).toFixed(2)} after winning "${productTitle}". Please add funds to cover this amount.`,
          relatedId: productId,
          relatedType: 'PRODUCT',
          data: {
            productTitle,
            finalPrice,
            negativeAmount: Math.abs(newRealBalance),
            productId,
            urgency: 'HIGH'
          }
        });

        // Send email notification for negative balance
        await NotificationService.sendPaymentNotification(
          userId,
          'FAILED',
          Math.abs(newRealBalance),
          {
            reason: 'INSUFFICIENT_FUNDS',
            productTitle,
            finalPrice,
            productId,
            actionRequired: 'ADD_FUNDS'
          }
        );

        return {
          userId,
          type: 'DEDUCTION' as const,
          amount: finalPrice,
          newBalance: newRealBalance,
          status: 'NEGATIVE_BALANCE' as const
        };
      } else {
        // Successful payment
        await NotificationService.createNotification({
          userId,
          type: 'AUCTION_WON',
          title: '🎉 Congratulations! You Won!',
          message: `You won "${productTitle}" for $${finalPrice}! Payment of $${finalPrice} has been deducted from your balance.`,
          relatedId: productId,
          relatedType: 'PRODUCT',
          data: {
            productTitle,
            finalPrice,
            newBalance: newRealBalance,
            productId
          }
        });

        await NotificationService.sendPaymentNotification(
          userId,
          'RECEIVED',
          finalPrice,
          {
            productTitle,
            productId,
            newBalance: newRealBalance
          }
        );

        return {
          userId,
          type: 'DEDUCTION' as const,
          amount: finalPrice,
          newBalance: newRealBalance,
          status: 'SUCCESS' as const
        };
      }
    } catch (error) {
      console.error(`Error processing winner settlement for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process loser refund: Return their bid from virtual to real balance
   */
  private static async processLoserRefund(
    userId: string,
    bidAmount: number,
    productTitle: string,
    productId: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const currentRealBalance = Number(user.balanceReal);
      const currentVirtualBalance = Number(user.balanceVirtual);
      
      // Return bid amount from virtual to real balance
      const newRealBalance = currentRealBalance + bidAmount;
      const newVirtualBalance = Math.max(0, currentVirtualBalance - bidAmount);

      // Update user's balances
      await prisma.user.update({
        where: { id: userId },
        data: {
          balanceReal: new Decimal(newRealBalance),
          balanceVirtual: new Decimal(newVirtualBalance)
        }
      });

      // Create transaction record for refund
      await prisma.transaction.create({
        data: {
          userId,
          type: 'BID_REFUND',
          amount: new Decimal(bidAmount),
          balanceType: 'REAL',
          status: 'COMPLETED',
          description: `Refund for unsuccessful bid on: "${productTitle}"`,
          metadata: {
            productId,
            bidAmount,
            auctionEndTime: new Date(),
            previousRealBalance: currentRealBalance,
            previousVirtualBalance: currentVirtualBalance,
            newRealBalance,
            newVirtualBalance
          }
        }
      });

      // Send refund notification
      await NotificationService.createNotification({
        userId,
        type: 'BID_REFUNDED',
        title: '💰 Bid Refunded',
        message: `Your bid of $${bidAmount} for "${productTitle}" has been refunded to your account.`,
        relatedId: productId,
        relatedType: 'PRODUCT',
        data: {
          productTitle,
          bidAmount,
          newRealBalance,
          productId
        }
      });

      await NotificationService.sendPaymentNotification(
        userId,
        'REFUNDED',
        bidAmount,
        {
          productTitle,
          productId,
          newBalance: newRealBalance
        }
      );

      return {
        userId,
        type: 'REFUND' as const,
        amount: bidAmount,
        newBalance: newRealBalance,
        status: 'SUCCESS' as const
      };

    } catch (error) {
      console.error(`Error processing refund for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check for users with negative balances and send reminders
   */
  static async checkNegativeBalances(): Promise<void> {
    try {
      const usersWithNegativeBalance = await prisma.user.findMany({
        where: {
          balanceReal: { lt: 0 }
        }
      });

      for (const user of usersWithNegativeBalance) {
        const negativeAmount = Math.abs(Number(user.balanceReal));
        
        // Check if we sent a reminder recently (within 24 hours)
        const recentReminder = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            notificationType: 'PAYMENT_REQUIRED',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        });

        if (!recentReminder) {
          await NotificationService.createNotification({
            userId: user.id,
            type: 'PAYMENT_REQUIRED',
            title: '🔴 Urgent: Negative Balance',
            message: `Your account has a negative balance of -$${negativeAmount.toFixed(2)}. Please add funds to your account immediately.`,
            data: {
              negativeAmount,
              urgency: 'URGENT',
              actionRequired: 'ADD_FUNDS'
            }
          });

          console.log(`Sent negative balance reminder to user ${user.id}: -$${negativeAmount}`);
        }
      }
    } catch (error) {
      console.error('Error checking negative balances:', error);
    }
  }

  /**
   * Get settlement history for a product
   */
  static async getSettlementHistory(productId: string) {
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          metadata: {
            path: ['productId'],
            equals: productId
          }
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        productId,
        transactions: transactions.map(tx => ({
          id: tx.id,
          userId: tx.userId,
          user: tx.user,
          type: tx.type,
          amount: Number(tx.amount),
          balanceType: tx.balanceType,
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt,
          metadata: tx.metadata
        }))
      };
    } catch (error) {
      console.error('Error getting settlement history:', error);
      return { productId, transactions: [] };
    }
  }
}

// Export for use in other modules
export default AuctionSettlementService;