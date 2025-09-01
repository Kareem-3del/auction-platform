import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { verifyAccessToken } from 'src/lib/auth';
import { apiResponse } from 'src/lib/api-response';

const notificationPreferencesSchema = z.object({
  emailBidPlaced: z.boolean().default(true),
  emailBidOutbid: z.boolean().default(true),
  emailAuctionEnding: z.boolean().default(true),
  emailAuctionWon: z.boolean().default(true),
  emailPayments: z.boolean().default(true),
  pushBidPlaced: z.boolean().default(true),
  pushBidOutbid: z.boolean().default(true),
  pushAuctionEnding: z.boolean().default(true),
  pushAuctionWon: z.boolean().default(true),
  pushPayments: z.boolean().default(true),
  smsAuctionWon: z.boolean().default(false),
  smsPayments: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return apiResponse.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // Get user notification preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: payload.sub }
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: payload.sub,
          emailBidPlaced: true,
          emailBidOutbid: true,
          emailAuctionEnding: true,
          emailAuctionWon: true,
          emailPayments: true,
          pushBidPlaced: true,
          pushBidOutbid: true,
          pushAuctionEnding: true,
          pushAuctionWon: true,
          pushPayments: true,
          smsAuctionWon: false,
          smsPayments: false
        }
      });
    }

    return apiResponse.success({
      preferences: {
        emailBidPlaced: preferences.emailBidPlaced,
        emailBidOutbid: preferences.emailBidOutbid,
        emailAuctionEnding: preferences.emailAuctionEnding,
        emailAuctionWon: preferences.emailAuctionWon,
        emailPayments: preferences.emailPayments,
        pushBidPlaced: preferences.pushBidPlaced,
        pushBidOutbid: preferences.pushBidOutbid,
        pushAuctionEnding: preferences.pushAuctionEnding,
        pushAuctionWon: preferences.pushAuctionWon,
        pushPayments: preferences.pushPayments,
        smsAuctionWon: preferences.smsAuctionWon,
        smsPayments: preferences.smsPayments,
        updatedAt: preferences.updatedAt
      }
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    return apiResponse.internalError('Failed to get notification preferences');
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return apiResponse.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // Parse and validate request body
    const body = await request.json();
    const preferencesData = notificationPreferencesSchema.parse(body);

    // Update or create notification preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: payload.sub },
      update: {
        ...preferencesData,
        updatedAt: new Date()
      },
      create: {
        userId: payload.sub,
        ...preferencesData
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: payload.sub,
        targetId: payload.sub,
        entityType: 'notification_preferences',
        entityId: preferences.id,
        action: 'preferences_updated',
        newValues: preferencesData,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      }
    });

    return apiResponse.success({
      message: 'Notification preferences updated successfully',
      preferences: {
        emailBidPlaced: preferences.emailBidPlaced,
        emailBidOutbid: preferences.emailBidOutbid,
        emailAuctionEnding: preferences.emailAuctionEnding,
        emailAuctionWon: preferences.emailAuctionWon,
        emailPayments: preferences.emailPayments,
        pushBidPlaced: preferences.pushBidPlaced,
        pushBidOutbid: preferences.pushBidOutbid,
        pushAuctionEnding: preferences.pushAuctionEnding,
        pushAuctionWon: preferences.pushAuctionWon,
        pushPayments: preferences.pushPayments,
        smsAuctionWon: preferences.smsAuctionWon,
        smsPayments: preferences.smsPayments,
        updatedAt: preferences.updatedAt
      }
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    
    if (error instanceof z.ZodError) {
      return apiResponse.badRequest('Invalid request data', error.errors);
    }

    return apiResponse.internalError('Failed to update notification preferences');
  }
}