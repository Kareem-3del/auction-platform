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
  categories: z.string().optional(), // Comma-separated category names
  condition: z.string().optional(),
  conditions: z.string().optional(), // Comma-separated conditions
  minPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  maxPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  location: z.string().optional(),
  locations: z.string().optional(), // Comma-separated locations
  agentId: z.string().optional(),
  featured: z.string().transform(val => val === 'true').optional(),
  auctionOnly: z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
  auctionStatus: z.string().optional(), // Comma-separated auction statuses
  includeEnded: z.string().transform(val => val === 'true').optional(), // Include ended auctions in results
  sortBy: z.enum(['relevance', 'newest', 'oldest', 'price_low', 'price_high', 'priceAsc', 'priceDesc', 'titleAsc', 'titleDesc', 'ending_soon']).default('newest'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ALL']).default('APPROVED'),
}).partial();

// GET /api/products - Get products with search and filtering
export async function GET(request: NextRequest) {
  try {
    validateMethod(request, ['GET']);

    const { searchParams: urlParams } = new URL(request.url);
    const searchParams = searchParamsSchema.parse(Object.fromEntries(urlParams.entries()));

    const { 
      page = 1, 
      limit = 20, 
      search, 
      categoryId, 
      categories, 
      condition, 
      conditions, 
      minPrice, 
      maxPrice, 
      location, 
      locations, 
      agentId, 
      featured, 
      auctionOnly, 
      auctionStatus,
      includeEnded,
      sortBy, 
      sortOrder,
      status 
    } = searchParams;

    // Build where clause
    const whereClause: any = {};

    if (status !== 'ALL') {
      whereClause.status = status;
      
      // For public display (APPROVED), exclude sold items and ended auctions unless explicitly requested
      if (status === 'APPROVED' && !includeEnded) {
        whereClause.NOT = [
          { status: 'SOLD' },
          { auctionStatus: 'ENDED' },
          { auctionStatus: 'CANCELLED' }
        ];
      } else if (status === 'APPROVED' && includeEnded) {
        // Only exclude sold and cancelled items, but keep ended auctions
        whereClause.NOT = [
          { status: 'SOLD' },
          { auctionStatus: 'CANCELLED' }
        ];
      }
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { provenance: { contains: search, mode: 'insensitive' } },
        { materials: { contains: search, mode: 'insensitive' } },
        { authenticity: { contains: search, mode: 'insensitive' } },
        {
          category: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          brand: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
      ];
    }

    // Handle category filtering (by ID or names)
    if (categoryId || categories) {
      if (categoryId) {
        // Single category by ID - include subcategories
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
      } else if (categories) {
        // Multiple categories by name
        const categoryNames = categories.split(',').map(name => name.trim());
        whereClause.category = {
          name: { in: categoryNames, mode: 'insensitive' }
        };
      }
    }

    // Handle condition filtering (single or multiple)
    if (condition || conditions) {
      if (condition) {
        whereClause.condition = condition;
      } else if (conditions) {
        const conditionValues = conditions.split(',').map(cond => cond.trim().toUpperCase());
        whereClause.condition = { in: conditionValues };
      }
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

    // Handle location filtering (single or multiple)
    if (location || locations) {
      if (location) {
        whereClause.location = { contains: location, mode: 'insensitive' };
      } else if (locations) {
        const locationValues = locations.split(',').map(loc => loc.trim());
        whereClause.OR = whereClause.OR ? [...whereClause.OR] : [];
        locationValues.forEach(loc => {
          whereClause.OR.push({
            location: { contains: loc, mode: 'insensitive' }
          });
        });
      }
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
      
      // Add auction status filtering if specified
      if (auctionStatus) {
        const statusValues = auctionStatus.split(',').map(status => status.trim().toUpperCase());
        whereClause.auctionStatus = { in: statusValues };
      }
    } else if (auctionOnly === false) {
      // Only regular products without auction functionality
      whereClause.OR = [
        { auctionStatus: null },
        { auctionStatus: { notIn: ['SCHEDULED', 'LIVE', 'ENDED'] } }
      ];
    } else if (auctionStatus) {
      // Filter by auction status even if not explicitly auction-only
      const statusValues = auctionStatus.split(',').map(status => status.trim().toUpperCase());
      whereClause.auctionStatus = { in: statusValues };
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    
    if (featured) {
      // For featured items, prioritize by activity
      orderBy = [
        { viewCount: 'desc' },
        { bidCount: 'desc' },
        { createdAt: 'desc' }
      ];
    } else {
      const direction = sortOrder || 'desc';
      switch (sortBy) {
        case 'relevance':
          // For relevance, prioritize by creation date and activity
          orderBy = [
            { viewCount: 'desc' },
            { bidCount: 'desc' },
            { createdAt: 'desc' }
          ];
          break;
        case 'newest':
        case 'oldest':
          orderBy = { createdAt: sortBy === 'newest' ? 'desc' : 'asc' };
          break;
        case 'price_low':
        case 'priceAsc':
          orderBy = { estimatedValueMin: 'asc' };
          break;
        case 'price_high':
        case 'priceDesc':
          orderBy = { estimatedValueMax: 'desc' };
          break;
        case 'titleAsc':
          orderBy = { title: 'asc' };
          break;
        case 'titleDesc':
          orderBy = { title: 'desc' };
          break;
        case 'ending_soon':
          // For auction items ending soon
          orderBy = [
            { endTime: 'asc' },
            { createdAt: 'desc' }
          ];
          break;
        default:
          orderBy = { createdAt: direction };
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

    return successResponse(productsData, {
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
        categories,
        condition,
        conditions,
        minPrice,
        maxPrice,
        location,
        locations,
        agentId,
        featured,
        auctionOnly,
        auctionStatus,
        includeEnded,
        sortBy,
        sortOrder,
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

    return successResponse(productData);

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