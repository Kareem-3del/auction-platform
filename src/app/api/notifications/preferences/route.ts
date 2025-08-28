
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse,
  validateContentType 
} from '@/lib/api-response';

// Validation schema for notification preferences
const preferencesSchema = z.object({
  notificationSoundEnabled: z.boolean().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),
});

// GET /api/notifications/preferences - Get user's notification preferences
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        notificationSoundEnabled: true,
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,
      },
    });

    if (!user) {
      return handleAPIError({
        name: 'UserNotFoundError',
        message: 'User not found',
      });
    }

    return successResponse({
      preferences: user,
      message: 'Notification preferences retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// PUT /api/notifications/preferences - Update user's notification preferences  
export const PUT = withAuth(async (request) => {
  try {
    validateMethod(request, ['PUT']);
    validateContentType(request);

    const body = await request.json();
    const validatedData = preferencesSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: request.user.id },
      data: validatedData,
      select: {
        notificationSoundEnabled: true,
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,
      },
    });

    return successResponse({
      preferences: user,
      message: 'Notification preferences updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Preferences validation failed',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });