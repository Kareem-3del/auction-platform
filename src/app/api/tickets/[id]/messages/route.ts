import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { verifyAccessToken } from 'src/lib/auth';
import { apiResponse } from 'src/lib/api-response';

const addMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
});

export async function POST(
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
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { 
        id: true, 
        userType: true, 
        isActive: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user || !user.isActive) {
      return apiResponse.unauthorized('User not found or inactive');
    }

    // Get ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!ticket) {
      return apiResponse.notFound('Ticket not found');
    }

    // Check access permissions
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.userType);
    const isOwner = ticket.userId === user.id;
    const isAssigned = ticket.assignedTo === user.id;

    if (!isAdmin && !isOwner && !isAssigned) {
      return apiResponse.forbidden('Access denied to this ticket');
    }

    // Parse and validate request body
    const body = await request.json();
    const { message, isInternal } = addMessageSchema.parse(body);

    // Non-admin users cannot create internal messages
    const messageIsInternal = isAdmin ? isInternal : false;

    // Create message
    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId: params.id,
        userId: user.id,
        message,
        isInternal: messageIsInternal
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            userType: true
          }
        }
      }
    });

    // Update ticket status if needed
    let ticketUpdate: any = {
      updatedAt: new Date()
    };

    // If customer responds to a waiting ticket, move to open
    if (ticket.status === 'WAITING_CUSTOMER' && isOwner) {
      ticketUpdate.status = 'OPEN';
    }

    // If admin responds to an open ticket, move to in progress
    if (ticket.status === 'OPEN' && isAdmin && !messageIsInternal) {
      ticketUpdate.status = 'IN_PROGRESS';
      if (!ticket.assignedTo) {
        ticketUpdate.assignedTo = user.id;
        ticketUpdate.assignedAt = new Date();
      }
    }

    // Update ticket
    await prisma.supportTicket.update({
      where: { id: params.id },
      data: ticketUpdate
    });

    // Create notifications
    if (!messageIsInternal) {
      // Notify ticket owner if message is from admin
      if (isAdmin && !isOwner) {
        await prisma.notification.create({
          data: {
            userId: ticket.userId,
            notificationType: 'SYSTEM_ALERT',
            title: 'New Support Message',
            message: `New message on your support ticket: ${ticket.subject}`,
            deliveryMethod: 'IN_APP',
            data: {
              ticketId: ticket.id,
              messageId: newMessage.id,
              senderName: `${user.firstName} ${user.lastName}`,
              senderEmail: user.email
            }
          }
        });
      }

      // Notify admins if message is from customer
      if (!isAdmin) {
        const admins = await prisma.user.findMany({
          where: {
            userType: {
              in: ['ADMIN', 'SUPER_ADMIN']
            },
            isActive: true
          },
          select: { id: true }
        });

        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map(admin => ({
              userId: admin.id,
              notificationType: 'SYSTEM_ALERT',
              title: 'Customer Response',
              message: `${user.firstName} ${user.lastName} replied to ticket: ${ticket.subject}`,
              deliveryMethod: 'IN_APP',
              data: {
                ticketId: ticket.id,
                messageId: newMessage.id,
                customerEmail: user.email
              }
            }))
          });
        }
      }

      // Notify assigned admin if different from sender
      if (ticket.assignedTo && ticket.assignedTo !== user.id) {
        await prisma.notification.create({
          data: {
            userId: ticket.assignedTo,
            notificationType: 'SYSTEM_ALERT',
            title: 'New Message on Assigned Ticket',
            message: `New message on ticket "${ticket.subject}" assigned to you`,
            deliveryMethod: 'IN_APP',
            data: {
              ticketId: ticket.id,
              messageId: newMessage.id,
              senderName: `${user.firstName} ${user.lastName}`,
              senderEmail: user.email
            }
          }
        });
      }
    }

    return apiResponse.success({
      message: 'Message added successfully',
      messageData: {
        id: newMessage.id,
        message: newMessage.message,
        isInternal: newMessage.isInternal,
        user: newMessage.user,
        createdAt: newMessage.createdAt
      }
    });

  } catch (error) {
    console.error('Add message error:', error);
    
    if (error instanceof z.ZodError) {
      return apiResponse.badRequest('Invalid request data', error.errors);
    }

    return apiResponse.internalError('Failed to add message');
  }
}