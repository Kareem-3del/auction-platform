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

// Validation schema for updating categories
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/categories/[id] - Get single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    validateMethod(request, ['GET']);

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const includeChildren = searchParams.get('includeChildren') === 'true';

    const category = await prisma.category.findUnique({
      where: { id },
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
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: includeChildren ? {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            parentId: true,
            isActive: true,
            _count: {
              select: { products: true },
            },
          },
          orderBy: { name: 'asc' },
        } : false,
        products: includeProducts ? {
          where: { 
            status: 'APPROVED',
          },
          select: {
            id: true,
            title: true,
            description: true,
            condition: true,
            estimatedValueMin: true,
            estimatedValueMax: true,
            images: true,
            status: true,
            createdAt: true,
            agent: {
              select: {
                id: true,
                displayName: true,
                logoUrl: true,
                rating: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        } : false,
        _count: {
          select: { 
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return handleAPIError({
        name: 'CategoryNotFoundError',
        message: 'Category not found',
      });
    }

    const categoryData = {
      ...category,
      productCount: category._count.products,
      childrenCount: category._count.children,
      _count: undefined,
      products: category.products?.map((product: any) => ({
        ...product,
        images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
        estimatedValueMin: Number(product.estimatedValueMin),
        estimatedValueMax: Number(product.estimatedValueMax),
        reservePrice: Number(product.reservePrice),
        auctionCount: product._count?.auctions || 0,
        _count: undefined,
        auctions: product.auctions?.map((auction: any) => ({
          ...auction,
          currentBid: Number(auction.currentBid),
        })),
      })),
      children: category.children?.map((child: any) => ({
        ...child,
        productCount: child._count?.products || 0,
        _count: undefined,
      })),
    };

    return successResponse({
      category: categoryData,
      message: 'Category retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT /api/categories/[id] - Update category (Admin/Agent only)
export const PUT = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['PUT']);
    validateContentType(request);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to update categories',
      });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return handleAPIError({
        name: 'CategoryNotFoundError',
        message: 'Category not found',
      });
    }

    const updateData: any = { ...validatedData };

    // Update slug if name is being changed
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const newSlug = slugify(validatedData.name);
      
      // Check if new slug already exists (excluding current category)
      const slugExists = await prisma.category.findFirst({
        where: {
          slug: newSlug,
          id: { not: id },
        },
      });

      if (slugExists) {
        return handleAPIError({
          name: 'CategoryExistsError',
          message: 'A category with this name already exists',
        });
      }

      updateData.slug = newSlug;
    }

    // Validate parent category if being changed
    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId === id) {
        return handleAPIError({
          name: 'InvalidParentError',
          message: 'Category cannot be its own parent',
        });
      }

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

        // Check if this would create a circular reference
        if (await wouldCreateCircularReference(id, validatedData.parentId)) {
          return handleAPIError({
            name: 'CircularReferenceError',
            message: 'This change would create a circular reference',
          });
        }

        // Check depth limit
        const parentLevel = await getCategoryLevel(validatedData.parentId);
        if (parentLevel >= 2) {
          return handleAPIError({
            name: 'MaxDepthExceededError',
            message: 'Categories cannot be nested more than 3 levels deep',
          });
        }
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
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
        entityId: id,
        action: 'category_updated',
        oldValues: existingCategory,
        newValues: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      category: {
        ...updatedCategory,
        productCount: updatedCategory._count.products,
        childrenCount: updatedCategory._count.children,
        _count: undefined,
      },
      message: 'Category updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Category validation failed',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });

// DELETE /api/categories/[id] - Delete category (Admin only)
export const DELETE = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['DELETE']);

    // Check user permissions - only admin can delete categories
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to delete categories',
      });
    }

    const { id } = await params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return handleAPIError({
        name: 'CategoryNotFoundError',
        message: 'Category not found',
      });
    }

    // Check if category has products or children
    if (category._count.products > 0) {
      return handleAPIError({
        name: 'CategoryHasProductsError',
        message: 'Cannot delete category that contains products',
      });
    }

    if (category._count.children > 0) {
      return handleAPIError({
        name: 'CategoryHasChildrenError',
        message: 'Cannot delete category that has subcategories',
      });
    }

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'category',
        entityId: id,
        action: 'category_deleted',
        oldValues: {
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      message: 'Category deleted successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// Helper function to check for circular references
async function wouldCreateCircularReference(categoryId: string, newParentId: string): Promise<boolean> {
  let currentId: string | null = newParentId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    if (currentId === categoryId) {
      return true;
    }

    visited.add(currentId);

    const parent: { parentId: string | null } | null = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    currentId = parent?.parentId || null;
  }

  return false;
}

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