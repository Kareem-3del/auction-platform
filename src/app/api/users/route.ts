
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType 
} from 'src/lib/api-response';

// GET /api/users - Get all users (Admin only)
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to view users',
      });
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const userType = searchParams.get('userType');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    
    if (userType && userType !== 'all') {
      whereClause.userType = userType;
    }
    
    if (isActive !== null && isActive !== 'all') {
      whereClause.isActive = isActive === 'true';
    }

    const includeClause: any = {};
    
    if (includeStats) {
      includeClause._count = {
        select: {
          bids: true,
          transactions: true,
          favorites: true,
          wonProducts: true,
          highestBidProducts: true,
        },
      };
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const usersWithStats = users.map((user: any) => ({
      ...user,
      bidCount: user._count?.bids || 0,
      transactionCount: user._count?.transactions || 0,
      favoriteCount: user._count?.favorites || 0,
      wonProductCount: user._count?.wonProducts || 0,
      highestBidProductCount: user._count?.highestBidProducts || 0,
      _count: undefined,
    }));

    return successResponse({
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      message: 'Users retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// POST /api/users - Create new user (Admin only)
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to create users',
      });
    }

    const body = await request.json();
    
    const createUserSchema = z.object({
      email: z.string().email('Invalid email format'),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      phone: z.string().optional(),
      userType: z.enum(['BUYER', 'AGENT', 'ADMIN']),
      isActive: z.boolean().default(true),
    });

    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return handleAPIError({
        name: 'UserExistsError',
        message: 'A user with this email already exists',
      });
    }

    const user = await prisma.user.create({
      data: {
        ...validatedData,
        passwordHash: 'temp', // This should be hashed properly in a real app
        emailVerified: false,
        kycStatus: 'PENDING',
        balanceReal: 0,
        balanceVirtual: 1000, // Starting virtual balance
        anonymousDisplayName: 'Anonymous User',
        anonymousAvatarUrl: '',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userType: true,
        kycStatus: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: user.id,
        entityType: 'user',
        entityId: user.id,
        action: 'user_created',
        newValues: {
          email: user.email,
          userType: user.userType,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      data: user,
      message: 'User created successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'User validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });