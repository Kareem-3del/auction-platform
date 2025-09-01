
import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse 
} from 'src/lib/api-response';

// GET /api/bids - Get all bids (Admin only)
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to view bids',
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const auctionStatus = searchParams.get('auctionStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (auctionStatus && auctionStatus !== 'all') {
      whereClause.auction = {
        status: auctionStatus
      };
    }

    const [bids, totalCount] = await Promise.all([
      prisma.bid.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            }
          },
          product: {
            select: {
              id: true,
              title: true,
              auctionStatus: true,
              endTime: true,
              currentBid: true,
              images: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.bid.count({ 
        where: whereClause
      }),
    ]);

    const bidsWithDetails = bids
      .filter(bid => bid.product) // Filter out bids for products that don't exist
      .map((bid: any) => ({
        id: bid.id,
        amount: bid.amount,
        bidTime: bid.createdAt,
        status: bid.status,
        isWinning: bid.product.currentBid === bid.amount,
        userId: bid.userId,
        userEmail: bid.user?.email || 'Unknown',
        userName: bid.user ? `${bid.user.firstName} ${bid.user.lastName}` : 'Unknown User',
        productId: bid.product.id,
        productTitle: bid.product.title,
        auctionEndTime: bid.product.endTime,
        auctionStatus: bid.product.auctionStatus,
        productImages: bid.product.images || [],
      }));

    return successResponse({
      data: bidsWithDetails,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      message: 'Bids retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });