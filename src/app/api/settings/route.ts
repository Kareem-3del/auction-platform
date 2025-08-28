
import { z } from 'zod';
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse,
  validateContentType 
} from '@/lib/api-response';

const settingsSchema = z.object({
  general: z.object({
    siteName: z.string().min(1, 'Site name is required'),
    siteDescription: z.string().optional(),
    supportEmail: z.string().email('Invalid email format'),
    maintenanceMode: z.boolean(),
    registrationEnabled: z.boolean(),
  }).optional(),
  auction: z.object({
    defaultAuctionDuration: z.number().int().min(1).max(365),
    minBidIncrement: z.number().min(0.01),
    maxBidIncrement: z.number().min(1),
    extendAuctionTime: z.number().int().min(1).max(60),
    enableAutoBid: z.boolean(),
  }).optional(),
  payment: z.object({
    enablePaypal: z.boolean(),
    enableStripe: z.boolean(),
    enableCrypto: z.boolean(),
    paymentFeePercentage: z.number().min(0).max(10),
    minimumWithdrawal: z.number().min(1),
  }).optional(),
  email: z.object({
    smtpHost: z.string().min(1, 'SMTP host is required'),
    smtpPort: z.number().int().min(1).max(65535),
    smtpUser: z.string().min(1, 'SMTP user is required'),
    smtpPassword: z.string().min(1, 'SMTP password is required'),
    fromEmail: z.string().email('Invalid from email'),
    fromName: z.string().min(1, 'From name is required'),
    enableEmailNotifications: z.boolean(),
  }).optional(),
});

// GET /api/settings - Get system settings
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to view settings',
      });
    }

    // Mock settings data - in production this would come from settings table
    const settings = {
      general: {
        siteName: 'Lebanese Auction Platform',
        siteDescription: 'Premier auction platform for Lebanon',
        supportEmail: 'support@lebauction.com',
        maintenanceMode: false,
        registrationEnabled: true,
      },
      auction: {
        defaultAuctionDuration: 7,
        minBidIncrement: 1,
        maxBidIncrement: 1000,
        extendAuctionTime: 5,
        enableAutoBid: true,
      },
      payment: {
        enablePaypal: true,
        enableStripe: true,
        enableCrypto: false,
        paymentFeePercentage: 2.5,
        minimumWithdrawal: 10,
      },
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: 'noreply@lebauction.com',
        smtpPassword: '********',
        fromEmail: 'noreply@lebauction.com',
        fromName: 'Lebanese Auction Platform',
        enableEmailNotifications: true,
      },
    };

    return successResponse({
      data: settings,
      message: 'Settings retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// PUT /api/settings - Update system settings
export const PUT = withAuth(async (request) => {
  try {
    validateMethod(request, ['PUT']);
    validateContentType(request);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to update settings',
      });
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    // Mock settings update - in production this would update the settings table
    const updatedSettings = {
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: request.user.id,
    };

    // Create audit log
    // await prisma.auditLog.create({
    //   data: {
    //     userId: request.user.id,
    //     entityType: 'settings',
    //     entityId: 'system',
    //     action: 'settings_updated',
    //     newValues: validatedData,
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent') || 'unknown',
    //   },
    // });

    return successResponse({
      data: updatedSettings,
      message: 'Settings updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Settings validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });