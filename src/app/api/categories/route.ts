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

// Validation schema for creating categories
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).optional(),
});

// Validation schema for updating categories
const updateCategorySchema = createCategorySchema.partial();

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    validateMethod(request, ['GET']);

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const parentId = searchParams.get('parentId');
    const flat = searchParams.get('flat') === 'true';
    const featuredOnly = searchParams.get('featured') === 'true';

    const whereClause: any = {};
    
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    if (featuredOnly) {
      whereClause.isFeatured = true;
    }

    if (parentId) {
      whereClause.parentId = parentId;
    } else if (!flat) {
      whereClause.parentId = null; // Only root categories
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        isActive: true,
        isFeatured: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        children: flat ? false : {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            parentId: true,
            isActive: true,
            children: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                parentId: true,
                isActive: true,
              },
              orderBy: { name: 'asc' },
            },
            _count: {
              select: { products: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { 
            products: true,
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const categoriesWithCounts = categories.map((category: any) => ({
      ...category,
      productCount: category._count.products,
      childrenCount: category._count.children,
      _count: undefined,
    }));

    return successResponse(categoriesWithCounts);

  } catch (error) {
    return handleAPIError(error);
  }
}

// POST /api/categories - Create new category (Admin/Agent only)
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to create categories',
      });
    }

    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Generate slug from name
    const slug = slugify(validatedData.name);

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return handleAPIError({
        name: 'CategoryExistsError',
        message: 'A category with this name already exists',
      });
    }

    // Validate parent category if provided
    if (validatedData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentCategory) {
        return handleAPIError({
          name: 'ParentCategoryNotFoundError',
          message: 'Parent category not found',
        });
      }

      // Prevent creating categories more than 3 levels deep
      const parentLevel = await getCategoryLevel(validatedData.parentId);
      if (parentLevel >= 2) {
        return handleAPIError({
          name: 'MaxDepthExceededError',
          message: 'Categories cannot be nested more than 3 levels deep',
        });
      }
    }

    // Get next sort order
    const lastCategory = await prisma.category.findFirst({
      where: { parentId: validatedData.parentId || null },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = validatedData.sortOrder ?? (lastCategory?.sortOrder ?? 0) + 10;

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        slug,
        sortOrder,
      },
      include: {
        parent: true,
        _count: {
          select: { 
            products: true,
            children: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'category',
        entityId: category.id,
        action: 'category_created',
        newValues: {
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      ...category,
      productCount: category._count.products,
      childrenCount: category._count.children,
      _count: undefined,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Category validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });

// Helper function to get category nesting level
async function getCategoryLevel(categoryId: string, level: number = 0): Promise<number> {
  if (level > 10) return level; // Prevent infinite recursion

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { parentId: true },
  });

  if (!category || !category.parentId) {
    return level;
  }

  return getCategoryLevel(category.parentId, level + 1);
}