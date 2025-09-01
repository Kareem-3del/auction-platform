import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { verifyAccessToken } from 'src/lib/auth';
import { apiResponse } from 'src/lib/api-response';

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  subjectAr: z.string().optional(),
  description: z.string().min(1).max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  category: z.enum(['GENERAL', 'TECHNICAL', 'BILLING', 'ACCOUNT', 'BIDDING', 'PAYMENT', 'FEATURE_REQUEST']).default('GENERAL'),
});

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
});

export async function POST(request: NextRequest) {
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
        email: true,
        firstName: true,
        lastName: true,
        isActive: true 
      }
    });

    if (!user || !user.isActive) {
      return apiResponse.unauthorized('User not found or inactive');
    }

    // Parse and validate request body
    const body = await request.json();
    const ticketData = createTicketSchema.parse(body);

    // Create support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        ...ticketData
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create initial message
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        userId: user.id,
        message: ticketData.description,
        isInternal: false
      }
    });

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: {
        userType: {
          in: ['ADMIN', 'SUPER_ADMIN']
        },
        isActive: true
      },
      select: { id: true }
    });

    // Notify all admins
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          notificationType: 'SYSTEM_ALERT',
          title: 'New Support Ticket',
          message: `New ${ticketData.priority.toLowerCase()} priority ticket: ${ticketData.subject}`,
          deliveryMethod: 'IN_APP',
          data: {
            ticketId: ticket.id,
            priority: ticketData.priority,
            category: ticketData.category,
            userEmail: user.email
          }
        }))
      });
    }

    return apiResponse.success({
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        subjectAr: ticket.subjectAr,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
        user: ticket.user
      }
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    
    if (error instanceof z.ZodError) {
      return apiResponse.badRequest('Invalid request data', error.errors);
    }

    return apiResponse.internalError('Failed to create support ticket');
  }
}

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const category = url.searchParams.get('category');

    // Build where clause based on user role
    let where: any = {};

    // Non-admin users can only see their own tickets
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.userType)) {
      where.userId = user.id;
    }

    // Add filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    // Get tickets with pagination
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
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
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.supportTicket.count({ where })
    ]);

    return apiResponse.success({
      tickets: tickets.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        subjectAr: ticket.subjectAr,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        user: ticket.user,
        assignee: ticket.assignee,
        messageCount: ticket._count.messages,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    return apiResponse.internalError('Failed to get support tickets');
  }
}