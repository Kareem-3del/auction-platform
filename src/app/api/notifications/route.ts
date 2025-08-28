
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse,
  validateContentType 
} from '@/lib/api-response';

// Validation schema for creating notifications
const createNotificationSchema = z.object({
  userId: z.string(),
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
  notificationType: z.enum([
    'BID_PLACED',
    'BID_OUTBID',
    'AUCTION_STARTING',
    'AUCTION_ENDING',
    'AUCTION_WON',
    'AUCTION_LOST',
    'PAYMENT_RECEIVED',
    'PAYMENT_FAILED',
    'AGENT_APPROVED',
    'AGENT_REJECTED',
    'PRODUCT_APPROVED',
    'PRODUCT_REJECTED',
    'SYSTEM_ALERT',
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.any().optional(),
  deliveryMethod: z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH']).default('IN_APP'),
});

// GET /api/notifications - Get user's notifications
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: request.user.id,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    // Get notifications with pagination
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.notification.count({
        where: whereClause,
      }),
    ]);

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: request.user.id,
        isRead: false,
      },
    });

    return successResponse({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
      message: 'Notifications retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
});

// POST /api/notifications - Create notification (admin only)
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Only admins can create notifications directly
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions',
      });
    }

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive) {
      return handleAPIError({
        name: 'UserNotFoundError',
        message: 'Target user not found or inactive',
      });
    }

    const notification = await prisma.notification.create({
      data: {
        ...validatedData,
        data: validatedData.data ? JSON.stringify(validatedData.data) : undefined,
        sentAt: new Date(),
      },
    });

    return successResponse({
      notification,
      message: 'Notification created successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Notification validation failed',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });