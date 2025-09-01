import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { NotificationService } from 'src/lib/notification-service';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType 
} from 'src/lib/api-response';

// Validation schema for profile updates
const updateProfileSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .optional()
    .nullable(),
  isAnonymousDisplay: z.boolean().optional(),
  avatarUrl: z.string().optional().nullable(),
});

// GET /api/users/profile
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    const userId = request.user.id;

    // Get user profile with additional data
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isAnonymousDisplay: true,
        anonymousDisplayName: true,
        anonymousAvatarUrl: true,
        userType: true,
        kycStatus: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        balanceReal: true,
        balanceVirtual: true,
        virtualMultiplier: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        // Include agent profile if user is an agent
        agent: {
          select: {
            id: true,
            businessName: true,
            displayName: true,
            bio: true,
            logoUrl: true,
            status: true,
            rating: true,
            reviewCount: true,
            totalSales: true,
            totalAuctions: true,
            successfulAuctions: true,
          }
        },
        // Include recent activity
        transactions: {
          select: {
            id: true,
            transactionType: true,
            amountReal: true,
            amountVirtual: true,
            status: true,
            createdAt: true,
            description: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        bids: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                title: true,
                auctionStatus: true,
                endTime: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }
      },
    });

    if (!userProfile) {
      return handleAPIError(new Error('User not found'));
    }

    // Get user statistics
    const stats = await Promise.all([
      // Count of active bids
      prisma.bid.count({
        where: {
          userId,
          status: 'ACTIVE'
        }
      }),
      // Count of won auctions (products won)
      prisma.product.count({
        where: {
          winnerId: userId,
          auctionStatus: 'ENDED'
        }
      }),
      // Count of watched auctions
      prisma.userFavorite.count({
        where: { userId }
      }),
      // Total spent (winning bids)
      prisma.product.aggregate({
        where: {
          winnerId: userId,
          auctionStatus: 'ENDED'
        },
        _sum: {
          finalPrice: true
        }
      })
    ]);

    const userStats = {
      activeBids: stats[0],
      auctionsWon: stats[1],
      watchedAuctions: stats[2],
      totalSpent: Number(stats[3]._sum.finalPrice || 0),
    };

    const profileData = {
      ...userProfile,
      balanceReal: Number(userProfile.balanceReal),
      balanceVirtual: Number(userProfile.balanceVirtual),
      virtualMultiplier: Number(userProfile.virtualMultiplier),
      stats: userStats,
      transactions: userProfile.transactions.map((t: any) => ({
        ...t,
        amountReal: Number(t.amountReal),
        amountVirtual: Number(t.amountVirtual),
      })),
      bids: userProfile.bids.map((b: any) => ({
        ...b,
        amount: Number(b.amount),
      }))
    };

    return successResponse({
      profile: profileData,
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// PUT /api/users/profile
export const PUT = withAuth(async (request) => {
  try {
    validateMethod(request, ['PUT']);
    validateContentType(request);

    const userId = request.user.id;
    const body = await request.json();

    // Validate request data
    const validatedData = updateProfileSchema.parse(body);

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isAnonymousDisplay: true,
        anonymousDisplayName: true,
        anonymousAvatarUrl: true,
        userType: true,
        kycStatus: true,
        emailVerified: true,
        phoneVerified: true,
        balanceReal: true,
        balanceVirtual: true,
        virtualMultiplier: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        targetId: userId,
        entityType: 'user',
        entityId: userId,
        action: 'profile_updated',
        newValues: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Send account change notification
    await NotificationService.sendAccountChangeNotification(
      userId,
      'PROFILE_UPDATED',
      { updatedFields: Object.keys(validatedData) }
    );

    const responseData = {
      ...updatedUser,
      balanceReal: Number(updatedUser.balanceReal),
      balanceVirtual: Number(updatedUser.balanceVirtual),
      virtualMultiplier: Number(updatedUser.virtualMultiplier),
    };

    return successResponse({
      profile: responseData,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Profile validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });