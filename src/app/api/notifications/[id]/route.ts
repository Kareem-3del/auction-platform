
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse 
} from '@/lib/api-response';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PATCH /api/notifications/[id] - Mark notification as read
export const PATCH = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['PATCH']);

    const { id } = await params;

    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (!existingNotification) {
      return handleAPIError({
        name: 'NotificationNotFoundError',
        message: 'Notification not found',
      });
    }

    // Mark as read
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return successResponse({
      notification,
      message: 'Notification marked as read',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// DELETE /api/notifications/[id] - Delete notification
export const DELETE = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['DELETE']);

    const { id } = await params;

    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (!existingNotification) {
      return handleAPIError({
        name: 'NotificationNotFoundError',
        message: 'Notification not found',
      });
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id },
    });

    return successResponse({
      message: 'Notification deleted successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });