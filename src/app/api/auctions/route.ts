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

// Validation schema for creating auctions
const createAuctionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  location: z.string().min(1, 'Location is required'),
  images: z.array(z.string()).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
  
  // Specifications
  provenance: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  materials: z.string().optional(),
  authenticity: z.string().optional(),
  
  // Pricing
  estimatedValueMin: z.number().positive('Minimum value must be positive'),
  estimatedValueMax: z.number().positive('Maximum value must be positive'),
  startingBid: z.number().positive('Starting bid must be positive'),
  reservePrice: z.number().positive('Reserve price must be positive').optional(),
  bidIncrement: z.number().positive('Bid increment must be positive'),
  buyNowPrice: z.number().positive('Buy now price must be positive').optional(),
  
  // Auction settings
  auctionType: z.enum(['LIVE', 'TIMED', 'SILENT']),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  timezone: z.string().default('UTC'),
  autoExtend: z.boolean().default(true),
  extensionTriggerMinutes: z.number().positive('Extension trigger must be positive'),
  extensionDurationMinutes: z.number().positive('Extension duration must be positive'),
  maxExtensions: z.number().positive('Max extensions must be positive'),
  
  // Display settings
  showBidderNames: z.boolean().default(true),
  showBidCount: z.boolean().default(true),
  showWatcherCount: z.boolean().default(true),
  
  // Shipping
  pickupAvailable: z.boolean().default(false),
  pickupAddress: z.string().optional(),
}).refine(data => data.estimatedValueMax >= data.estimatedValueMin, {
  message: 'Maximum value must be greater than or equal to minimum value',
  path: ['estimatedValueMax'],
}).refine(data => !data.reservePrice || data.reservePrice >= data.estimatedValueMin, {
  message: 'Reserve price must be at least the minimum estimated value',
  path: ['reservePrice'],
}).refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine(data => new Date(data.startTime) > new Date(), {
  message: 'Start time must be in the future',
  path: ['startTime'],
});

export async function GET(request: NextRequest) {
  return handleAPIError({
    name: 'DeprecatedEndpointError',
    message: 'Auction endpoints have been deprecated. Use /api/products instead.',
  });
}

// POST /api/auctions - Create new auction
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Check user permissions - agents, buyers, and admins can create auctions
    if (!['AGENT', 'BUYER', 'ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Only authorized users can create auctions',
      });
    }

    // Get agent information if user is an agent
    let agentId = null;
    if (request.user.userType === 'AGENT') {
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
      
      agentId = agent.id;
    }

    const body = await request.json();
    const validatedData = createAuctionSchema.parse(body);

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

    // Prepare specifications with additional fields
    const specifications = {
      provenance: validatedData.provenance,
      dimensions: validatedData.dimensions,
      weight: validatedData.weight,
      materials: validatedData.materials,
      authenticity: validatedData.authenticity,
    };

    // Create the product with auction functionality
    const product = await prisma.product.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        condition: validatedData.condition,
        location: validatedData.location,
        images: JSON.stringify(validatedData.images),
        estimatedValueMin: validatedData.estimatedValueMin,
        estimatedValueMax: validatedData.estimatedValueMax,
        reservePrice: validatedData.reservePrice,
        specifications: specifications,
        agentId: agentId, // Will be null for buyer users
        status: 'PENDING_APPROVAL', // All new auctions start as pending approval
        
        // Auction-specific fields
        startingBid: validatedData.startingBid,
        bidIncrement: validatedData.bidIncrement,
        buyNowPrice: validatedData.buyNowPrice,
        auctionType: validatedData.auctionType,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        timezone: validatedData.timezone,
        autoExtend: validatedData.autoExtend,
        extensionTriggerMinutes: validatedData.extensionTriggerMinutes,
        extensionDurationMinutes: validatedData.extensionDurationMinutes,
        maxExtensions: validatedData.maxExtensions,
        showBidderNames: validatedData.showBidderNames,
        showBidCount: validatedData.showBidCount,
        showWatcherCount: validatedData.showWatcherCount,
        pickupAvailable: validatedData.pickupAvailable,
        pickupAddress: validatedData.pickupAddress,
        auctionStatus: 'SCHEDULED', // Set initial auction status
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
        action: 'auction_created',
        newValues: {
          title: product.title,
          categoryId: product.categoryId,
          estimatedValueMin: validatedData.estimatedValueMin,
          estimatedValueMax: validatedData.estimatedValueMax,
          startingBid: validatedData.startingBid,
          auctionType: validatedData.auctionType,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
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
      startingBid: product.startingBid ? Number(product.startingBid) : null,
      bidIncrement: product.bidIncrement ? Number(product.bidIncrement) : null,
      buyNowPrice: product.buyNowPrice ? Number(product.buyNowPrice) : null,
    };

    return successResponse(productData);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Auction validation failed',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    console.error('Detailed auction creation error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause,
      toString: error?.toString()
    });
    return handleAPIError(error);
  }
}, { required: true });