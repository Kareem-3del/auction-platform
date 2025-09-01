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

// Validation schema for updating products
const updateProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
  location: z.string().optional(),
  images: z.array(z.string().url()).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed').optional(),
  estimatedValueMin: z.number().positive('Minimum value must be positive').optional(),
  estimatedValueMax: z.number().positive('Maximum value must be positive').optional(),
  reservePrice: z.number().positive('Reserve price must be positive').optional(),
  provenance: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  materials: z.string().optional(),
  authenticity: z.string().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED']).optional(),
  rejectionReason: z.string().optional(),
  // Unified auction fields
  startingBid: z.number().positive('Starting bid must be positive').optional(),
  bidIncrement: z.number().positive('Bid increment must be positive').optional(),
  auctionType: z.enum(['LIVE', 'SEALED', 'RESERVE']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  timezone: z.string().optional(),
  autoExtend: z.boolean().optional(),
  extensionTriggerMinutes: z.number().positive('Extension trigger must be positive').optional(),
  extensionDurationMinutes: z.number().positive('Extension duration must be positive').optional(),
  maxExtensions: z.number().min(0, 'Max extensions cannot be negative').optional(),
  buyNowPrice: z.number().positive('Buy now price must be positive').optional(),
}).refine(data => {
  if (data.estimatedValueMin && data.estimatedValueMax) {
    return data.estimatedValueMax >= data.estimatedValueMin;
  }
  return true;
}, {
  message: 'Maximum value must be greater than or equal to minimum value',
  path: ['estimatedValueMax'],
}).refine(data => {
  if (data.reservePrice && data.estimatedValueMax) {
    return data.reservePrice <= data.estimatedValueMax;
  }
  return true;
}, {
  message: 'Reserve price cannot exceed maximum estimated value',
  path: ['reservePrice'],
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/products/[id] - Get single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    validateMethod(request, ['GET']);

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            parentId: true,
          },
        },
        agent: {
          select: {
            id: true,
            userId: true,
            displayName: true,
            businessName: true,
            bio: true,
            logoUrl: true,
            rating: true,
            reviewCount: true,
            totalSales: true,
            totalAuctions: true,
            successfulAuctions: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            websiteUrl: true,
          },
        },
        productTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return handleAPIError({
        name: 'ProductNotFoundError',
        message: 'Product not found',
      });
    }

    // Check visibility permissions
    const isOwner = request.headers.get('authorization') && await checkProductOwnership(id, request);
    const isAdmin = request.headers.get('authorization') && await checkAdminAccess(request);
    
    if (product.status !== 'APPROVED' && !isOwner && !isAdmin) {
      return handleAPIError({
        name: 'ProductNotFoundError',
        message: 'Product not found',
      });
    }

    const productData = {
      ...product,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      estimatedValueMin: Number(product.estimatedValueMin),
      estimatedValueMax: Number(product.estimatedValueMax),
      reservePrice: product.reservePrice ? Number(product.reservePrice) : null,
      // Convert auction fields to numbers for consistency (now part of product)
      startingBid: product.startingBid ? Number(product.startingBid) : null,
      currentBid: product.currentBid ? Number(product.currentBid) : 0,
      bidIncrement: product.bidIncrement ? Number(product.bidIncrement) : null,
      buyNowPrice: product.buyNowPrice ? Number(product.buyNowPrice) : null,
      // Transform tags from junction table format to simple array
      tags: product.productTags?.map((pt: any) => pt.tag) || [],
      productTags: undefined, // Remove junction table data
      _count: undefined,
    };

    // Get related products (same category, different product)
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: id },
        status: 'APPROVED',
      },
      include: {
        agent: {
          select: {
            id: true,
            displayName: true,
            logoUrl: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    const relatedProductsData = relatedProducts.map((p: any) => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      estimatedValueMin: Number(p.estimatedValueMin),
      estimatedValueMax: Number(p.estimatedValueMax),
      // Convert auction fields to numbers (now part of product)
      startingBid: p.startingBid ? Number(p.startingBid) : null,
      currentBid: p.currentBid ? Number(p.currentBid) : 0,
      bidIncrement: p.bidIncrement ? Number(p.bidIncrement) : null,
      buyNowPrice: p.buyNowPrice ? Number(p.buyNowPrice) : null,
    }));

    return successResponse({
      product: productData,
      relatedProducts: relatedProductsData,
      message: 'Product retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT /api/products/[id] - Update product
export const PUT = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['PUT']);
    validateContentType(request);

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Get existing product
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return handleAPIError({
        name: 'ProductNotFoundError',
        message: 'Product not found',
      });
    }

    // Check permissions
    const isOwner = existingProduct.agent.userId === request.user.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType);

    if (!isOwner && !isAdmin) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to update this product',
      });
    }

    // Admins can update status, agents cannot
    if (validatedData.status && !isAdmin) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Only administrators can change product status',
      });
    }

    // Check if product has active auction status (prevents certain updates)
    const hasActiveAuctions = existingProduct.auctionStatus === 'SCHEDULED' || existingProduct.auctionStatus === 'LIVE';

    if (hasActiveAuctions && (validatedData.estimatedValueMin || validatedData.estimatedValueMax || validatedData.reservePrice)) {
      return handleAPIError({
        name: 'ProductHasActiveAuctionsError',
        message: 'Cannot modify pricing while product has active auctions',
      });
    }

    // Validate category if being updated
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
        select: { id: true, isActive: true },
      });

      if (!category || !category.isActive) {
        return handleAPIError({
          name: 'CategoryNotFoundError',
          message: 'Category not found or inactive',
        });
      }
    }

    // Prepare update data - only include fields that are actually provided
    const updateData: any = {};
    
    // Only add fields that are defined (not undefined) from validatedData
    Object.keys(validatedData).forEach(key => {
      const value = validatedData[key as keyof typeof validatedData];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // Convert images array to JSON string if provided
    if (updateData.images) {
      updateData.images = JSON.stringify(updateData.images);
    }

    // If agent is updating an approved product, set it back to pending (except for minor updates)
    const majorFields = ['title', 'description', 'categoryId', 'condition', 'estimatedValueMin', 'estimatedValueMax', 'reservePrice'];
    const hasMajorChanges = majorFields.some(field => validatedData[field as keyof typeof validatedData] !== undefined);

    if (isOwner && !isAdmin && existingProduct.status === 'APPROVED' && hasMajorChanges) {
      updateData.status = 'PENDING';
      updateData.approvedAt = null;
      updateData.rejectionReason = null;
    }

    // Handle status changes for admins
    if (isAdmin && validatedData.status) {
      if (validatedData.status === 'APPROVED') {
        updateData.approvedAt = new Date();
        updateData.rejectionReason = null;
      } else if (validatedData.status === 'REJECTED') {
        updateData.approvedAt = null;
        // rejectionReason should be provided
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        agent: {
          select: {
            id: true,
            displayName: true,
            businessName: true,
            logoUrl: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'product',
        entityId: id,
        action: 'product_updated',
        oldValues: existingProduct,
        newValues: updateData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    const productData = {
      ...updatedProduct,
      images: typeof updatedProduct.images === 'string' ? JSON.parse(updatedProduct.images) : updatedProduct.images,
      estimatedValueMin: Number(updatedProduct.estimatedValueMin),
      estimatedValueMax: Number(updatedProduct.estimatedValueMax),
      reservePrice: updatedProduct.reservePrice ? Number(updatedProduct.reservePrice) : null,
    };

    return successResponse({
      product: productData,
      message: 'Product updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Product validation failed',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });

// DELETE /api/products/[id] - Delete product
export const DELETE = withAuth(async (request, { params }: RouteParams) => {
  try {
    validateMethod(request, ['DELETE']);

    const { id } = await params;

    // Get existing product
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return handleAPIError({
        name: 'ProductNotFoundError',
        message: 'Product not found',
      });
    }

    // Check permissions
    const isOwner = existingProduct.agent.userId === request.user.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType);

    if (!isOwner && !isAdmin) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to delete this product',
      });
    }

    // Check if product has active auction status
    if (existingProduct.auctionStatus === 'SCHEDULED' || existingProduct.auctionStatus === 'LIVE') {
      return handleAPIError({
        name: 'ProductHasActiveAuctionsError',
        message: 'Cannot delete product with active auctions',
      });
    }

    // Soft delete - just mark as inactive
    await prisma.product.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: 'Deleted by user',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        targetId: request.user.id,
        entityType: 'product',
        entityId: id,
        action: 'product_deleted',
        oldValues: {
          title: existingProduct.title,
          status: existingProduct.status,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      message: 'Product deleted successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// Helper functions
async function checkProductOwnership(productId: string, request: NextRequest): Promise<boolean> {
  try {
    // Extract user from token (simplified - in reality you'd verify the JWT)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return false;

    // This is a simplified check - the withAuth middleware would handle the actual JWT verification
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        agent: {
          select: { userId: true },
        },
      },
    });

    // In practice, you'd get the user ID from the verified JWT
    // For now, return false as this is just for type checking
    return false;
  } catch {
    return false;
  }
}

async function checkAdminAccess(request: NextRequest): Promise<boolean> {
  try {
    // Similar to above - in practice this would verify JWT and check user role
    return false;
  } catch {
    return false;
  }
}