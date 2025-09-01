import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { verifyAccessToken } from 'src/lib/auth';
import { apiResponse } from 'src/lib/api-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return apiResponse.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // Get notification
    const notification = await prisma.notification.findUnique({
      where: { id: params.id }
    });

    if (!notification) {
      return apiResponse.notFound('Notification not found');
    }

    // Check if user owns this notification
    if (notification.userId !== payload.sub) {
      return apiResponse.forbidden('Access denied to this notification');
    }

    // Mark notification as read
    const updatedNotification = await prisma.notification.update({
      where: { id: params.id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return apiResponse.success({
      message: 'Notification marked as read',
      notification: updatedNotification
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    return apiResponse.internalError('Failed to update notification');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return apiResponse.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // Get notification
    const notification = await prisma.notification.findUnique({
      where: { id: params.id }
    });

    if (!notification) {
      return apiResponse.notFound('Notification not found');
    }

    // Check if user owns this notification
    if (notification.userId !== payload.sub) {
      return apiResponse.forbidden('Access denied to this notification');
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id: params.id }
    });

    return apiResponse.success({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    return apiResponse.internalError('Failed to delete notification');
  }
}