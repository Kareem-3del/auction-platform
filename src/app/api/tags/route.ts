import type { NextRequest } from 'next/server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType 
} from '@/lib/api-response';

import { slugify } from 'src/lib/utils';

// Validation schema for query parameters
const querySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'nameAsc', 'nameDesc', 'popular']).default('nameAsc'),
  includeInactive: z.string().transform(val => val === 'true').optional(),
}).partial();

// Validation schema for creating tags
const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Name too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#1976d2'),
  isActive: z.boolean().default(true),
});

// GET /api/tags - Get tags with search and filtering
export async function GET(request: NextRequest) {
  try {
    validateMethod(request, ['GET']);

    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));
    
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;
    const search = params.search;
    const sortBy = params.sortBy || 'nameAsc';
    const includeInactive = params.includeInactive;

    // Build where clause
    const whereClause: any = {};
    
    if (!includeInactive) {
      whereClause.isActive = true;
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by clause
    let orderBy: any = { name: 'asc' };
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'nameAsc':
        orderBy = { name: 'asc' };
        break;
      case 'nameDesc':
        orderBy = { name: 'desc' };
        break;
      case 'popular':
        // Order by product count (most used tags first)
        orderBy = { productTags: { _count: 'desc' } };
        break;
      default:
        orderBy = { name: 'asc' };
        break;
    }

    const [tags, totalCount] = await Promise.all([
      prisma.tag.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { productTags: true }
          }
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.tag.count({ where: whereClause }),
    ]);

    const tagsWithStats = tags.map((tag: any) => ({
      ...tag,
      productCount: tag._count?.productTags || 0,
      _count: undefined,
    }));

    return successResponse({
      data: tagsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      message: 'Tags retrieved successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Invalid query parameters',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}

// POST /api/tags - Create new tag (Admin/Agent only)
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to create tags',
      });
    }

    const body = await request.json();
    const validatedData = createTagSchema.parse(body);

    // Generate slug
    const slug = slugify(validatedData.name);

    // Check if slug already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          { slug }
        ]
      }
    });

    if (existingTag) {
      return handleAPIError({
        name: 'TagExistsError',
        message: 'A tag with this name already exists',
      });
    }

    const tag = await prisma.tag.create({
      data: {
        ...validatedData,
        slug,
      },
      include: {
        _count: {
          select: { productTags: true }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'tag',
        entityId: tag.id,
        action: 'tag_created',
        newValues: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      tag: {
        ...tag,
        productCount: tag._count.productTags,
        _count: undefined,
      },
      message: 'Tag created successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Tag validation failed',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });