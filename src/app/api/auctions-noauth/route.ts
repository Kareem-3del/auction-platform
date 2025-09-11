import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType 
} from 'src/lib/api-response';

const createAuctionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  location: z.string().min(1, 'Location is required'),
  images: z.array(z.string()).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
  
  estimatedValueMin: z.number().positive('Minimum value must be positive'),
  estimatedValueMax: z.number().positive('Maximum value must be positive'),
  startingBid: z.number().positive('Starting bid must be positive'),
  reservePrice: z.number().positive('Reserve price must be positive').optional(),
  bidIncrement: z.number().positive('Bid increment must be positive'),
  buyNowPrice: z.number().positive('Buy now price must be positive').optional(),
  
  auctionType: z.enum(['LIVE', 'TIMED', 'SILENT']),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  timezone: z.string().default('UTC'),
  autoExtend: z.boolean().default(true),
  extensionTriggerMinutes: z.number().positive('Extension trigger must be positive'),
  extensionDurationMinutes: z.number().positive('Extension duration must be positive'),
  maxExtensions: z.number().positive('Max extensions must be positive'),
  
  showBidderNames: z.boolean().default(true),
  showBidCount: z.boolean().default(true),
  showWatcherCount: z.boolean().default(true),
  
  pickupAvailable: z.boolean().default(false),
  pickupAddress: z.string().optional(),
});

// Test POST endpoint without authentication
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST AUCTION NOAUTH - Starting');
    validateMethod(request, ['POST']);
    validateContentType(request);

    const body = await request.json();
    console.log('🧪 TEST AUCTION NOAUTH - Body received:', Object.keys(body));
    
    const validatedData = createAuctionSchema.parse(body);
    console.log('🧪 TEST AUCTION NOAUTH - Data validated successfully');

    // For testing, we'll use a hardcoded user ID (admin user)
    const testUserId = 'test-user-id';

    // Validate category exists
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

    console.log('🧪 TEST AUCTION NOAUTH - Category validated');

    const specifications = {
      provenance: body.provenance,
      dimensions: body.dimensions,
      weight: body.weight,
      materials: body.materials,
      authenticity: body.authenticity,
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
        status: 'APPROVED', // Auto-approve for test
        
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
        auctionStatus: 'SCHEDULED',
      },
    });

    console.log('🧪 TEST AUCTION NOAUTH - Product created:', product.id);

    return successResponse({
      ...product,
      message: 'Test auction created successfully (no auth)',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('🧪 TEST AUCTION NOAUTH - Error:', error);
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

    return handleAPIError(error);
  }
}