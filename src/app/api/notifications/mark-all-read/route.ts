
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse 
} from '@/lib/api-response';

// POST /api/notifications/mark-all-read - Mark all notifications as read
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);

    // Mark all unread notifications as read for the current user
    const result = await prisma.notification.updateMany({
      where: {
        userId: request.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return successResponse({
      count: result.count,
      message: `Marked ${result.count} notifications as read`,
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });