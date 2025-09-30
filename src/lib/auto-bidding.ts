/**
 * Auto-Bidding System
 * Automatically places bids on behalf of users when they are outbid
 */

import { prisma } from './prisma';
import { logger } from './logger';
import type { Bid, Product, User } from '@prisma/client';

interface AutoBidResult {
  success: boolean;
  bid?: Bid;
  error?: string;
  reason?: string;
}

/**
 * Process auto-bids for a product after a new manual bid
 */
export async function processAutoBids(productId: string, newBidAmount: number): Promise<void> {
  try {
    logger.info('Processing auto-bids', { productId, newBidAmount });

    // Get the product with current state
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        currentBid: true,
        bidIncrement: true,
        auctionStatus: true,
        endTime: true,
      },
    });

    if (!product || product.auctionStatus !== 'LIVE') {
      logger.warn('Product not eligible for auto-bidding', {
        productId,
        status: product?.auctionStatus,
      });
      return;
    }

    // Check if auction has ended
    if (product.endTime && new Date() > product.endTime) {
      logger.info('Auction ended, skipping auto-bids', { productId });
      return;
    }

    // Get all active auto-bids for this product, ordered by max amount (highest first)
    const autoBids = await prisma.bid.findMany({
      where: {
        productId,
        bidType: 'AUTOMATIC',
        status: 'ACTIVE',
        maxAmount: {
          gt: newBidAmount, // Only consider auto-bids with max amount higher than current bid
        },
      },
      include: {
        user: {
          select: {
            id: true,
            balanceVirtual: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { maxAmount: 'desc' }, // Highest max amount first
        { createdAt: 'asc' }, // Earliest auto-bid wins ties
      ],
    });

    if (autoBids.length === 0) {
      logger.info('No eligible auto-bids found', { productId });
      return;
    }

    logger.info(`Found ${autoBids.length} eligible auto-bids`, { productId });

    // Process auto-bids one by one
    let currentBidAmount = newBidAmount;
    const bidIncrement = Number(product.bidIncrement) || 1;

    for (const autoBid of autoBids) {
      const maxAmount = Number(autoBid.maxAmount);
      const userBalance = Number(autoBid.user.balanceVirtual);

      // Calculate next bid amount
      const nextBidAmount = currentBidAmount + bidIncrement;

      // Check if this auto-bid can afford the next bid
      if (nextBidAmount > maxAmount) {
        logger.debug('Auto-bid max amount exceeded', {
          userId: autoBid.userId,
          maxAmount,
          nextBidAmount,
        });
        continue;
      }

      // Check if user has sufficient balance
      if (userBalance < nextBidAmount) {
        logger.warn('Auto-bid user has insufficient balance', {
          userId: autoBid.userId,
          required: nextBidAmount,
          available: userBalance,
        });
        continue;
      }

      // Place auto-bid
      const result = await placeAutoBid({
        productId,
        userId: autoBid.userId,
        amount: nextBidAmount,
        originalAutoBidId: autoBid.id,
        maxAmount: autoBid.maxAmount!,
      });

      if (result.success && result.bid) {
        currentBidAmount = Number(result.bid.amount);

        logger.bid('Auto-bid placed successfully', productId, {
          userId: autoBid.userId,
          bidId: result.bid.id,
          amount: nextBidAmount,
          maxAmount,
        });

        // Notify user that their auto-bid was triggered
        await createAutoBidNotification(autoBid.userId, product.title, nextBidAmount);

        // Only allow one auto-bid per round to prevent rapid escalation
        break;
      }
    }
  } catch (error) {
    logger.error('Error processing auto-bids', error, { productId });
  }
}

/**
 * Place an individual auto-bid
 */
async function placeAutoBid({
  productId,
  userId,
  amount,
  originalAutoBidId,
  maxAmount,
}: {
  productId: string;
  userId: string;
  amount: number;
  originalAutoBidId: string;
  maxAmount: number;
}): Promise<AutoBidResult> {
  try {
    const bid = await prisma.$transaction(async (tx) => {
      // Double-check user balance within transaction
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balanceVirtual: true },
      });

      if (!user || Number(user.balanceVirtual) < amount) {
        throw new Error('Insufficient balance');
      }

      // Create the auto-bid
      const newBid = await tx.bid.create({
        data: {
          productId,
          userId,
          amount,
          bidType: 'AUTOMATIC',
          maxAmount,
          status: 'ACTIVE',
        },
      });

      // Update product with new current bid
      await tx.product.update({
        where: { id: productId },
        data: {
          currentBid: amount,
          bidCount: { increment: 1 },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'bid',
          entityId: newBid.id,
          targetId: productId,
          action: 'auto_bid_placed',
          newValues: {
            amount,
            productId,
            originalAutoBidId,
          },
          ipAddress: 'system',
          userAgent: 'auto-bidding-system',
        },
      });

      return newBid;
    });

    return { success: true, bid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Failed to place auto-bid', error, {
      userId,
      productId,
      amount,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Create notification for triggered auto-bid
 */
async function createAutoBidNotification(
  userId: string,
  productTitle: string,
  bidAmount: number
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'BID_ACTIVITY',
        title: 'Auto-Bid Placed',
        message: `Your automatic bid of $${bidAmount.toFixed(2)} was placed on "${productTitle}"`,
        data: {
          productTitle,
          bidAmount,
          isAutoBid: true,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to create auto-bid notification', error, { userId });
  }
}

/**
 * Cancel/deactivate an auto-bid
 */
export async function cancelAutoBid(bidId: string, userId: string): Promise<boolean> {
  try {
    const bid = await prisma.bid.findFirst({
      where: {
        id: bidId,
        userId,
        bidType: 'AUTOMATIC',
      },
    });

    if (!bid) {
      return false;
    }

    await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'CANCELLED' },
    });

    logger.info('Auto-bid cancelled', { bidId, userId });
    return true;
  } catch (error) {
    logger.error('Failed to cancel auto-bid', error, { bidId, userId });
    return false;
  }
}

/**
 * Get active auto-bids for a user
 */
export async function getUserAutoBids(userId: string): Promise<any[]> {
  try {
    const autoBids = await prisma.bid.findMany({
      where: {
        userId,
        bidType: 'AUTOMATIC',
        status: 'ACTIVE',
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            currentBid: true,
            auctionStatus: true,
            endTime: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return autoBids.map((bid) => ({
      id: bid.id,
      amount: Number(bid.amount),
      maxAmount: Number(bid.maxAmount),
      createdAt: bid.createdAt,
      product: {
        ...bid.product,
        currentBid: Number(bid.product.currentBid),
      },
    }));
  } catch (error) {
    logger.error('Failed to get user auto-bids', error, { userId });
    return [];
  }
}
