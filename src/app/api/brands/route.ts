import type { NextRequest } from 'next/server';

import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType 
} from 'src/lib/api-response';

import { slugify } from 'src/lib/utils';

// Validation schema for query parameters
const querySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'nameAsc', 'nameDesc']).default('nameAsc'),
  includeInactive: z.string().transform(val => val === 'true').optional(),
}).partial();

// Validation schema for creating brands
const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/brands - Get brands with search and filtering
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
      default:
        orderBy = { name: 'asc' };
        break;
    }

    const [brands, totalCount] = await Promise.all([
      prisma.brand.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.brand.count({ where: whereClause }),
    ]);

    const brandsWithStats = brands.map((brand: any) => ({
      ...brand,
      productCount: brand._count?.products || 0,
      _count: undefined,
    }));

    return successResponse({
      data: brandsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      message: 'Brands retrieved successfully',
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

// POST /api/brands - Create new brand (Admin/Agent only)
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to create brands',
      });
    }

    const body = await request.json();
    const validatedData = createBrandSchema.parse(body);

    // Generate slug
    const slug = slugify(validatedData.name);

    // Check if slug already exists
    const existingBrand = await prisma.brand.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          { slug }
        ]
      }
    });

    if (existingBrand) {
      return handleAPIError({
        name: 'BrandExistsError',
        message: 'A brand with this name already exists',
      });
    }

    const brand = await prisma.brand.create({
      data: {
        ...validatedData,
        slug,
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'brand',
        entityId: brand.id,
        action: 'brand_created',
        newValues: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      brand: {
        ...brand,
        productCount: brand._count.products,
        _count: undefined,
      },
      message: 'Brand created successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Brand validation failed',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });