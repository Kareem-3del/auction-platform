import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getCurrentUser } from 'src/lib/auth';
import { AuctionSettlementService } from 'src/lib/auction-settlement';
import { prisma } from 'src/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  ErrorCodes 
} from 'src/lib/api-response';

// POST /api/admin/settlement - Manually trigger auction settlement
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = token ? await getCurrentUser(token) : null;
    
    if (!user || user.role !== 'ADMIN') {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Admin access required', 401);
    }

    const { productId, action } = await request.json();

    if (!productId || !action) {
      return errorResponse(ErrorCodes.VALIDATION_FAILED, 'Product ID and action are required', 400);
    }

    if (action === 'settle') {
      // Manually trigger settlement for a specific auction
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { bids: true }
      });

      if (!product) {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Product not found', 404);
      }

      if (product.auctionStatus !== 'LIVE') {
        return errorResponse(ErrorCodes.INVALID_REQUEST, 'Auction must be live to settle', 400);
      }

      // Force end the auction and settle
      const settlementResult = await AuctionSettlementService.processAuctionEnd(productId);

      return successResponse({
        message: 'Auction settlement completed',
        settlement: settlementResult
      });

    } else if (action === 'check_negative') {
      // Check and send negative balance warnings
      await AuctionSettlementService.checkNegativeBalances();

      return successResponse({
        message: 'Negative balance check completed'
      });

    } else {
      return errorResponse(ErrorCodes.VALIDATION_FAILED, 'Invalid action. Use "settle" or "check_negative"', 400);
    }

  } catch (error) {
    console.error('Settlement API error:', error);
    return errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Settlement operation failed', 500);
  }
}

// GET /api/admin/settlement - Get settlement history
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = token ? await getCurrentUser(token) : null;
    
    if (!user || user.role !== 'ADMIN') {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Admin access required', 401);
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    if (productId) {
      // Get settlement history for specific product
      const history = await AuctionSettlementService.getSettlementHistory(productId);
      return successResponse(history);
    } else {
      // Get all recent settlements
      const skip = (page - 1) * limit;

      const [settlements, total] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            OR: [
              { type: 'AUCTION_WIN' },
              { type: 'BID_REFUND' }
            ]
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
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.transaction.count({
          where: {
            OR: [
              { type: 'AUCTION_WIN' },
              { type: 'BID_REFUND' }
            ]
          }
        })
      ]);

      // Get users with negative balances
      const negativeBalanceUsers = await prisma.user.findMany({
        where: {
          balanceReal: { lt: 0 }
        },
        select: {
          id: true,
          displayName: true,
          email: true,
          balanceReal: true
        }
      });

      return successResponse({
        settlements: settlements.map(tx => ({
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
        })),
        negativeBalanceUsers: negativeBalanceUsers.map(user => ({
          ...user,
          balanceReal: Number(user.balanceReal)
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + settlements.length < total
        }
      });
    }

  } catch (error) {
    console.error('Get settlement history error:', error);
    return errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to get settlement history', 500);
  }
}