
import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse 
} from 'src/lib/api-response';

// GET /api/users/stats - Get current user's statistics
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    const userId = request.user.id;

    // Get user's bidding and auction statistics
    const [
      activeBidsCount,
      wonAuctionsCount,
      watchedAuctionsCount,
      totalSpentAggregate,
    ] = await Promise.all([
      // Count active bids (bids on active products with live auction status)
      prisma.bid.count({
        where: {
          userId,
          product: {
            auctionStatus: 'LIVE'
          }
        }
      }),

      // Count won auctions (products won)
      prisma.product.count({
        where: {
          winnerId: userId,
          auctionStatus: 'ENDED'
        }
      }),

      // Count watched auctions (this would need a watchlist table in real implementation)
      // For now, return 0 or implement based on your watchlist logic
      Promise.resolve(0),

      // Calculate total spent on completed auctions
      prisma.product.aggregate({
        _sum: {
          finalPrice: true
        },
        where: {
          winnerId: userId,
          auctionStatus: 'ENDED'
        }
      }),
    ]);

    const stats = {
      activeBids: activeBidsCount,
      auctionsWon: wonAuctionsCount,
      watchedAuctions: watchedAuctionsCount,
      totalSpent: totalSpentAggregate._sum.finalPrice || 0,
    };

    return successResponse({
      data: stats,
      message: 'User statistics retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });