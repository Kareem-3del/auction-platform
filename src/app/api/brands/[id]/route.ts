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

// Validation schema for updating brands
const updateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/brands/[id] - Get single brand
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    validateMethod(request, ['GET']);

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: includeProducts ? {
          where: { 
            status: 'APPROVED'
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
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        } : false,
        _count: {
          select: { 
            products: true,
          },
        },
      },
    });

    if (!brand) {
      return handleAPIError({
        name: 'BrandNotFoundError',
        message: 'Brand not found',
      });
    }

    const brandData = {
      ...brand,
      productCount: brand._count.products,
      _count: undefined,
      products: brand.products?.map((product: any) => ({
        ...product,
        images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
        estimatedValueMin: Number(product.estimatedValueMin),
        estimatedValueMax: Number(product.estimatedValueMax),
      })),
    };

    return successResponse({
      brand: brandData,
      message: 'Brand retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT /api/brands/[id] - Update brand (Admin/Agent only)
export const PUT = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['PUT']);
    validateContentType(request);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to update brands',
      });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBrandSchema.parse(body);

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!existingBrand) {
      return handleAPIError({
        name: 'BrandNotFoundError',
        message: 'Brand not found',
      });
    }

    const updateData: any = { ...validatedData };

    // Update slug if name is being changed
    if (validatedData.name && validatedData.name !== existingBrand.name) {
      const newSlug = slugify(validatedData.name);
      
      // Check if new slug already exists (excluding current brand)
      const slugExists = await prisma.brand.findFirst({
        where: {
          slug: newSlug,
          id: { not: id },
        },
      });

      if (slugExists) {
        return handleAPIError({
          name: 'BrandExistsError',
          message: 'A brand with this name already exists',
        });
      }

      updateData.slug = newSlug;
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { 
            products: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'brand',
        entityId: id,
        action: 'brand_updated',
        oldValues: existingBrand,
        newValues: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      brand: {
        ...updatedBrand,
        productCount: updatedBrand._count.products,
        _count: undefined,
      },
      message: 'Brand updated successfully',
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

// DELETE /api/brands/[id] - Delete brand (Admin only)
export const DELETE = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['DELETE']);

    // Check user permissions - only admin can delete brands
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to delete brands',
      });
    }

    const { id } = await params;

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!brand) {
      return handleAPIError({
        name: 'BrandNotFoundError',
        message: 'Brand not found',
      });
    }

    // Check if brand has products
    if (brand._count.products > 0) {
      return handleAPIError({
        name: 'BrandHasProductsError',
        message: 'Cannot delete brand that has products associated with it',
      });
    }

    // Delete the brand
    await prisma.brand.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'brand',
        entityId: id,
        action: 'brand_deleted',
        oldValues: {
          name: brand.name,
          slug: brand.slug,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      message: 'Brand deleted successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });