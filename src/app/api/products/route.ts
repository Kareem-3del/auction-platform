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

// Validation schema for creating products
const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  location: z.string().min(1, 'Location is required'),
  images: z.array(z.string().url()).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
  estimatedValueMin: z.number().positive('Minimum value must be positive'),
  estimatedValueMax: z.number().positive('Maximum value must be positive'),
  reservePrice: z.number().positive('Reserve price must be positive').optional(),
  provenance: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  materials: z.string().optional(),
  authenticity: z.string().optional(),
}).refine(data => data.estimatedValueMax >= data.estimatedValueMin, {
  message: 'Maximum value must be greater than or equal to minimum value',
  path: ['estimatedValueMax'],
}).refine(data => !data.reservePrice || data.reservePrice <= data.estimatedValueMax, {
  message: 'Reserve price cannot exceed maximum estimated value',
  path: ['reservePrice'],
});

// Validation schema for search/filter parameters
const searchParamsSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  condition: z.string().optional(),
  minPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  maxPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  location: z.string().optional(),
  agentId: z.string().optional(),
  featured: z.string().transform(val => val === 'true').optional(),
  auctionOnly: z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
  sortBy: z.enum(['newest', 'oldest', 'priceAsc', 'priceDesc', 'titleAsc', 'titleDesc']).default('newest'),
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ALL']).default('APPROVED'),
}).partial();

// GET /api/products - Get products with search and filtering
export async function GET(request: NextRequest) {
  try {
    validateMethod(request, ['GET']);

    const { searchParams: urlParams } = new URL(request.url);
    const searchParams = searchParamsSchema.parse(Object.fromEntries(urlParams.entries()));

    const { page = 1, limit = 20, search, categoryId, condition, minPrice, maxPrice, location, agentId, featured, auctionOnly, sortBy, status } = searchParams;

    // Build where clause
    const whereClause: any = {};

    if (status !== 'ALL') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { provenance: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      // Include subcategories
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          children: {
            include: {
              children: true,
            },
          },
        },
      });

      if (category) {
        const categoryIds = [categoryId];
        
        // Add direct children
        category.children.forEach((child: any) => {
          categoryIds.push(child.id);
          // Add grandchildren
          child.children.forEach((grandchild: any) => {
            categoryIds.push(grandchild.id);
          });
        });

        whereClause.categoryId = { in: categoryIds };
      }
    }

    if (condition) {
      whereClause.condition = condition;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.estimatedValueMin = {};
      if (minPrice !== undefined) {
        whereClause.estimatedValueMin.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        whereClause.estimatedValueMax = { lte: maxPrice };
      }
    }

    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
    }

    if (agentId) {
      whereClause.agentId = agentId;
    }

    // Handle featured filtering - for featured, prioritize products with auctions or activity
    if (featured) {
      // For now, just return recent products - we can enhance this later
      whereClause.status = 'APPROVED';
    }

    // Handle auction filtering
    if (auctionOnly === true) {
      // Only products with auction functionality (have auctionStatus)
      whereClause.auctionStatus = {
        in: ['SCHEDULED', 'LIVE', 'ENDED']
      };
    } else if (auctionOnly === false) {
      // Only regular products without auction functionality
      whereClause.OR = [
        { auctionStatus: null },
        { auctionStatus: { notIn: ['SCHEDULED', 'LIVE', 'ENDED'] } }
      ];
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    
    if (featured) {
      // For featured items, prioritize by activity
      orderBy = [
        { viewCount: 'desc' },
        { favoriteCount: 'desc' },
        { createdAt: 'desc' }
      ];
    } else {
      switch (sortBy) {
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'priceAsc':
          orderBy = { estimatedValueMin: 'asc' };
          break;
        case 'priceDesc':
          orderBy = { estimatedValueMax: 'desc' };
          break;
        case 'titleAsc':
          orderBy = { title: 'asc' };
          break;
        case 'titleDesc':
          orderBy = { title: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }
    }

    // Get total count
    const totalCount = await prisma.product.count({ where: whereClause });

    // Get products
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        agent: {
          select: {
            id: true,
            displayName: true,
            businessName: true,
            logoUrl: true,
            rating: true,
            reviewCount: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
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
              },
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const productsData = products.map((product: any) => ({
      ...product,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      estimatedValueMin: Number(product.estimatedValueMin),
      estimatedValueMax: Number(product.estimatedValueMax),
      reservePrice: product.reservePrice ? Number(product.reservePrice) : null,
      // Convert auction fields to numbers for consistency
      startingBid: product.startingBid ? Number(product.startingBid) : null,
      currentBid: product.currentBid ? Number(product.currentBid) : 0,
      bidIncrement: product.bidIncrement ? Number(product.bidIncrement) : null,
      buyNowPrice: product.buyNowPrice ? Number(product.buyNowPrice) : null,
      // Transform tags from junction table format to simple array
      tags: product.productTags?.map((pt: any) => pt.tag) || [],
      productTags: undefined, // Remove junction table data
      _count: undefined,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return successResponse({
      data: productsData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        search,
        categoryId,
        condition,
        minPrice,
        maxPrice,
        location,
        agentId,
        sortBy,
        status,
      },
      message: 'Products retrieved successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Invalid search parameters',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}

// POST /api/products - Create new product (Agent only)
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Check user permissions - only agents can create products
    if (request.user.userType !== 'AGENT') {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Only agents can create products',
      });
    }

    // Get agent information
    const agent = await prisma.agent.findUnique({
      where: { userId: request.user.id },
      select: { id: true, status: true },
    });

    if (!agent || agent.status !== 'APPROVED') {
      return handleAPIError({
        name: 'AgentNotActiveError',
        message: 'Agent account is not active',
      });
    }

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Validate category exists and is active
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

    // Create the product
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        agentId: agent.id,
        images: JSON.stringify(validatedData.images),
        status: 'PENDING_APPROVAL', // All new products start as pending approval
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
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
        entityId: product.id,
        action: 'product_created',
        newValues: {
          title: product.title,
          categoryId: product.categoryId,
          estimatedValueMin: validatedData.estimatedValueMin,
          estimatedValueMax: validatedData.estimatedValueMax,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    const productData = {
      ...product,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      estimatedValueMin: Number(product.estimatedValueMin),
      estimatedValueMax: Number(product.estimatedValueMax),
      reservePrice: product.reservePrice ? Number(product.reservePrice) : null,
    };

    return successResponse({
      data: productData,
      message: 'Product created successfully and is pending approval',
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