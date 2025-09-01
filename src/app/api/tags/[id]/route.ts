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

// Validation schema for updating tags
const updateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Name too long').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/tags/[id] - Get single tag
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    validateMethod(request, ['GET']);

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        productTags: includeProducts ? {
          include: {
            product: {
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
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            }
          },
          where: {
            product: {
              status: 'APPROVED',
            }
          },
          take: 20,
        } : false,
        _count: {
          select: { 
            productTags: true,
          },
        },
      },
    });

    if (!tag) {
      return handleAPIError({
        name: 'TagNotFoundError',
        message: 'Tag not found',
      });
    }

    const tagData = {
      ...tag,
      productCount: tag._count.productTags,
      _count: undefined,
      products: tag.productTags?.map((pt: any) => ({
        ...pt.product,
        images: typeof pt.product.images === 'string' ? JSON.parse(pt.product.images) : pt.product.images,
        estimatedValueMin: Number(pt.product.estimatedValueMin),
        estimatedValueMax: Number(pt.product.estimatedValueMax),
      })),
      productTags: undefined,
    };

    return successResponse({
      tag: tagData,
      message: 'Tag retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT /api/tags/[id] - Update tag (Admin/Agent only)
export const PUT = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['PUT']);
    validateContentType(request);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to update tags',
      });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTagSchema.parse(body);

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      return handleAPIError({
        name: 'TagNotFoundError',
        message: 'Tag not found',
      });
    }

    const updateData: any = { ...validatedData };

    // Update slug if name is being changed
    if (validatedData.name && validatedData.name !== existingTag.name) {
      const newSlug = slugify(validatedData.name);
      
      // Check if new slug already exists (excluding current tag)
      const slugExists = await prisma.tag.findFirst({
        where: {
          slug: newSlug,
          id: { not: id },
        },
      });

      if (slugExists) {
        return handleAPIError({
          name: 'TagExistsError',
          message: 'A tag with this name already exists',
        });
      }

      updateData.slug = newSlug;
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { 
            productTags: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'tag',
        entityId: id,
        action: 'tag_updated',
        oldValues: existingTag,
        newValues: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      tag: {
        ...updatedTag,
        productCount: updatedTag._count.productTags,
        _count: undefined,
      },
      message: 'Tag updated successfully',
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

// DELETE /api/tags/[id] - Delete tag (Admin only)
export const DELETE = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['DELETE']);

    // Check user permissions - only admin can delete tags
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to delete tags',
      });
    }

    const { id } = await params;

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productTags: true,
          },
        },
      },
    });

    if (!tag) {
      return handleAPIError({
        name: 'TagNotFoundError',
        message: 'Tag not found',
      });
    }

    // Check if tag has products
    if (tag._count.productTags > 0) {
      return handleAPIError({
        name: 'TagHasProductsError',
        message: 'Cannot delete tag that is assigned to products',
      });
    }

    // Delete the tag
    await prisma.tag.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'tag',
        entityId: id,
        action: 'tag_deleted',
        oldValues: {
          name: tag.name,
          slug: tag.slug,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      message: 'Tag deleted successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });