import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType 
} from 'src/lib/api-response';

// GET /api/users/[id] - Get user by ID (Admin only)
export const GET = withAuth(async (request, { params }) => {
  try {
    validateMethod(request, ['GET']);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to view user details',
      });
    }

    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bids: true,
            transactions: true,
            favorites: true,
            wonProducts: true,
            highestBidProducts: true,
          },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            product: {
              select: {
                id: true,
                title: true,
                mainImageUrl: true,
              }
            }
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        favorites: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            product: {
              select: {
                id: true,
                title: true,
                mainImageUrl: true,
                currentBid: true,
                auctionStatus: true,
              }
            }
          }
        },
        wonProducts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            mainImageUrl: true,
            currentBid: true,
            auctionStatus: true,
          }
        }
      },
    });

    if (!user) {
      return handleAPIError({
        name: 'NotFoundError',
        message: 'User not found',
      });
    }

    const userWithStats = {
      ...user,
      bidCount: user._count?.bids || 0,
      transactionCount: user._count?.transactions || 0,
      favoriteCount: user._count?.favorites || 0,
      wonProductCount: user._count?.wonProducts || 0,
      highestBidProductCount: user._count?.highestBidProducts || 0,
      _count: undefined,
    };

    return successResponse(userWithStats);

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// PUT /api/users/[id] - Update user (Admin only)
export const PUT = withAuth(async (request, { params }) => {
  try {
    validateMethod(request, ['PUT']);
    validateContentType(request);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to update users',
      });
    }

    const { id } = params;
    const body = await request.json();
    
    const updateUserSchema = z.object({
      email: z.string().email('Invalid email format').optional(),
      firstName: z.string().min(1, 'First name is required').optional(),
      lastName: z.string().min(1, 'Last name is required').optional(),
      phone: z.string().optional(),
      userType: z.enum(['BUYER', 'AGENT', 'ADMIN', 'SUPER_ADMIN']).optional(),
      isActive: z.boolean().optional(),
      kycStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      balanceReal: z.number().min(0, 'Balance cannot be negative').optional(),
      balanceVirtual: z.number().min(0, 'Virtual balance cannot be negative').optional(),
      anonymousDisplayName: z.string().optional(),
      anonymousAvatarUrl: z.string().url('Invalid avatar URL').or(z.literal('')).optional(),
    });

    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return handleAPIError({
        name: 'NotFoundError',
        message: 'User not found',
      });
    }

    // If email is being updated, check for conflicts
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailConflict) {
        return handleAPIError({
          name: 'UserExistsError',
          message: 'A user with this email already exists',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userType: true,
        kycStatus: true,
        isActive: true,
        emailVerified: true,
        balanceReal: true,
        balanceVirtual: true,
        anonymousDisplayName: true,
        anonymousAvatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: id,
        entityType: 'user',
        entityId: id,
        action: 'user_updated',
        oldValues: {
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          userType: existingUser.userType,
          isActive: existingUser.isActive,
        },
        newValues: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse(updatedUser);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'User validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });

// DELETE /api/users/[id] - Soft delete user (Admin only)
export const DELETE = withAuth(async (request, { params }) => {
  try {
    validateMethod(request, ['DELETE']);

    // Check user permissions (only SUPER_ADMIN can delete users)
    if (request.user.userType !== 'SUPER_ADMIN') {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Only super administrators can delete users',
      });
    }

    const { id } = params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return handleAPIError({
        name: 'NotFoundError',
        message: 'User not found',
      });
    }

    // Prevent self-deletion
    if (id === request.user.id) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'You cannot delete your own account',
      });
    }

    // Soft delete by deactivating the user
    const deletedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${existingUser.email}`, // Prevent email conflicts
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: id,
        entityType: 'user',
        entityId: id,
        action: 'user_deleted',
        oldValues: {
          isActive: existingUser.isActive,
          email: existingUser.email,
        },
        newValues: {
          isActive: false,
          email: deletedUser.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse(deletedUser);

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });