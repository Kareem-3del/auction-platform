
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse 
} from '@/lib/api-response';

// GET /api/analytics - Get platform analytics
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to view analytics',
      });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - (periodDays * 2));
    const previousEndDate = new Date();
    previousEndDate.setDate(previousEndDate.getDate() - periodDays);

    // Current period stats
    const [
      totalUsers,
      totalAuctions,
      totalBids,
      totalRevenue,
      recentUsers,
      recentAuctions,
      recentBids,
      recentRevenue,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.product.count({ where: { auctionStatus: { in: ['SCHEDULED', 'LIVE', 'ENDED'] } } }),
      prisma.bid.count(),
      prisma.product.aggregate({
        _sum: { currentBid: true },
        where: { auctionStatus: 'ENDED' }
      }),
      
      // Recent counts (last period)
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.product.count({
        where: { 
          auctionStatus: { in: ['SCHEDULED', 'LIVE', 'ENDED'] },
          createdAt: { gte: startDate } 
        }
      }),
      prisma.bid.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.product.aggregate({
        _sum: { currentBid: true },
        where: { 
          auctionStatus: 'ENDED',
          createdAt: { gte: startDate }
        }
      }),
    ]);

    // Previous period stats for growth calculation
    const [
      previousUsers,
      previousAuctions,
      previousBids,
      previousRevenue,
    ] = await Promise.all([
      prisma.user.count({
        where: { 
          createdAt: { 
            gte: previousStartDate,
            lte: previousEndDate 
          } 
        }
      }),
      prisma.product.count({
        where: { 
          auctionStatus: { in: ['SCHEDULED', 'LIVE', 'ENDED'] },
          createdAt: { 
            gte: previousStartDate,
            lte: previousEndDate 
          } 
        }
      }),
      prisma.bid.count({
        where: { 
          createdAt: { 
            gte: previousStartDate,
            lte: previousEndDate 
          } 
        }
      }),
      prisma.product.aggregate({
        _sum: { currentBid: true },
        where: { 
          auctionStatus: 'ENDED',
          createdAt: { 
            gte: previousStartDate,
            lte: previousEndDate 
          } 
        }
      }),
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const userGrowth = calculateGrowth(recentUsers, previousUsers);
    const auctionGrowth = calculateGrowth(recentAuctions, previousAuctions);
    const bidGrowth = calculateGrowth(recentBids, previousBids);
    const revenueGrowthVal = calculateGrowth(
      Number(recentRevenue._sum.currentBid || 0), 
      Number(previousRevenue._sum.currentBid || 0)
    );

    // Top performing categories
    const topCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        products: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Recent activity
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        performedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const analyticsData = {
      totalRevenue: totalRevenue._sum.currentBid || 0,
      totalAuctions,
      totalUsers,
      totalBids,
      revenueGrowth: revenueGrowthVal,
      auctionGrowth,
      userGrowth,
      bidGrowth,
      topCategories: topCategories.map(cat => ({
        name: cat.name,
        productCount: cat._count.products
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        user: activity.performedBy ? `${activity.performedBy.firstName} ${activity.performedBy.lastName}` : 'System',
        createdAt: activity.createdAt,
      })),
      periodDays,
    };

    return successResponse({
      data: analyticsData,
      message: 'Analytics retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });