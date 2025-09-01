import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { verifyAccessToken } from 'src/lib/auth';
import { apiResponse } from 'src/lib/api-response';

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
});

const addMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
});

export async function GET(
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
        isActive: true 
      }
    });

    if (!user || !user.isActive) {
      return apiResponse.unauthorized('User not found or inactive');
    }

    // Get ticket with messages
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        assignee: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        resolver: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        messages: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
                userType: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        attachments: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
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

    // Filter internal messages for non-admin users
    const filteredMessages = isAdmin ? ticket.messages : 
      ticket.messages.filter(msg => !msg.isInternal);

    return apiResponse.success({
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        subjectAr: ticket.subjectAr,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        user: ticket.user,
        assignee: ticket.assignee,
        resolver: ticket.resolver,
        resolution: ticket.resolution,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        assignedAt: ticket.assignedAt,
        resolvedAt: ticket.resolvedAt,
        messages: filteredMessages.map(msg => ({
          id: msg.id,
          message: msg.message,
          isInternal: msg.isInternal,
          user: msg.user,
          createdAt: msg.createdAt
        })),
        attachments: ticket.attachments.map(att => ({
          id: att.id,
          filename: att.filename,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
          user: att.user,
          createdAt: att.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get ticket details error:', error);
    return apiResponse.internalError('Failed to get ticket details');
  }
}

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

    // Only admins can update ticket status/assignment
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.userType)) {
      return apiResponse.forbidden('Insufficient permissions');
    }

    // Parse and validate request body
    const body = await request.json();
    const updateData = updateTicketSchema.parse(body);

    // Get current ticket
    const currentTicket = await prisma.supportTicket.findUnique({
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

    if (!currentTicket) {
      return apiResponse.notFound('Ticket not found');
    }

    // Prepare update data
    const updatePayload: any = { ...updateData };

    // Handle status changes
    if (updateData.status && updateData.status !== currentTicket.status) {
      if (updateData.status === 'RESOLVED') {
        updatePayload.resolvedAt = new Date();
        updatePayload.resolvedBy = user.id;
      }
      
      if (updateData.status === 'IN_PROGRESS' && !currentTicket.assignedTo) {
        updatePayload.assignedTo = user.id;
        updatePayload.assignedAt = new Date();
      }
    }

    // Handle assignment changes
    if (updateData.assignedTo && updateData.assignedTo !== currentTicket.assignedTo) {
      updatePayload.assignedAt = new Date();
    }

    // Update ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updatePayload,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        assignee: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create notification for ticket owner about status change
    if (updateData.status && updateData.status !== currentTicket.status) {
      await prisma.notification.create({
        data: {
          userId: currentTicket.userId,
          notificationType: 'SYSTEM_ALERT',
          title: 'Ticket Status Updated',
          message: `Your support ticket "${currentTicket.subject}" status has been updated to ${updateData.status.replace('_', ' ').toLowerCase()}`,
          deliveryMethod: 'IN_APP',
          data: {
            ticketId: currentTicket.id,
            oldStatus: currentTicket.status,
            newStatus: updateData.status,
            updatedBy: user.email
          }
        }
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        targetId: currentTicket.userId,
        entityType: 'support_ticket',
        entityId: params.id,
        action: 'ticket_updated',
        oldValues: {
          status: currentTicket.status,
          priority: currentTicket.priority,
          assignedTo: currentTicket.assignedTo
        },
        newValues: updateData,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      }
    });

    return apiResponse.success({
      message: 'Ticket updated successfully',
      ticket: {
        id: updatedTicket.id,
        subject: updatedTicket.subject,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        category: updatedTicket.category,
        user: updatedTicket.user,
        assignee: updatedTicket.assignee,
        resolution: updatedTicket.resolution,
        updatedAt: updatedTicket.updatedAt,
        resolvedAt: updatedTicket.resolvedAt
      }
    });

  } catch (error) {
    console.error('Update ticket error:', error);
    
    if (error instanceof z.ZodError) {
      return apiResponse.badRequest('Invalid request data', error.errors);
    }

    return apiResponse.internalError('Failed to update ticket');
  }
}