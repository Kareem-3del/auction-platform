import { NextRequest } from 'next/server';

import { GET, PUT } from '../route';

// Mock the auth middleware
jest.mock('@/lib/middleware/auth', () => ({
  withAuth: jest.fn((handler) => async (request: any) => {
      // Mock authenticated request with user data
      request.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        userType: 'BUYER',
        kycStatus: 'PENDING',
      };
      return handler(request);
    }),
}));

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bid: {
      count: jest.fn(),
    },
    auction: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    userFavorite: {
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

// Mock the API response utilities
jest.mock('@/lib/api-response', () => ({
  successResponse: jest.fn((data) => ({
    json: async () => ({ success: true, data }),
    status: 200,
  })),
  handleAPIError: jest.fn((error) => ({
    json: async () => ({ success: false, error: { message: error.message } }),
    status: 400,
  })),
  validateMethod: jest.fn(),
  validateContentType: jest.fn(),
}));

describe('/api/users/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile with statistics', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { successResponse } = await import('@/lib/api-response');

      // Mock user profile data
      const mockUserProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        avatarUrl: null,
        isAnonymousDisplay: true,
        anonymousDisplayName: 'Anonymous Buyer',
        anonymousAvatarUrl: '/avatars/default.png',
        userType: 'BUYER',
        kycStatus: 'PENDING',
        isActive: true,
        emailVerified: true,
        phoneVerified: false,
        balanceReal: 100,
        balanceVirtual: 300,
        virtualMultiplier: 3,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        agent: null,
        transactions: [],
        bids: [],
      };

      // Mock database calls
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserProfile);
      (prisma.bid.count as jest.Mock).mockResolvedValue(5);
      (prisma.auction.count as jest.Mock).mockResolvedValue(2);
      (prisma.userFavorite.count as jest.Mock).mockResolvedValue(3);
      (prisma.auction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { finalPrice: 1500 }
      });

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'GET',
      });

      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(successResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({
            id: 'test-user-id',
            email: 'test@example.com',
            stats: expect.objectContaining({
              activeBids: 5,
              auctionsWon: 2,
              watchedAuctions: 3,
              totalSpent: 1500,
            }),
          }),
        })
      );
    });

    it('should return error when user not found', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { handleAPIError } = await import('@/lib/api-response');

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'GET',
      });

      const response = await GET(request);
      
      expect(response.status).toBe(400);
      expect(handleAPIError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
        })
      );
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { successResponse } = await import('@/lib/api-response');

      const updatedUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Smith',
        phone: '+1234567890',
        avatarUrl: null,
        isAnonymousDisplay: false,
        anonymousDisplayName: 'Anonymous Buyer',
        anonymousAvatarUrl: '/avatars/default.png',
        userType: 'BUYER',
        kycStatus: 'PENDING',
        emailVerified: true,
        phoneVerified: false,
        balanceReal: 100,
        balanceVirtual: 300,
        virtualMultiplier: 3,
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Smith',
          phone: '+1234567890',
          isAnonymousDisplay: false,
        }),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(200);
      expect(successResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({
            firstName: 'John',
            lastName: 'Smith',
            isAnonymousDisplay: false,
          }),
        })
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'test-user-id',
          entityType: 'user',
          action: 'profile_updated',
        }),
      });
    });

    it('should return validation error for invalid data', async () => {
      const { handleAPIError } = await import('@/lib/api-response');

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: '', // Invalid - too short
          lastName: 'Doe',
          phone: 'invalid-phone', // Invalid phone format
        }),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(400);
      expect(handleAPIError).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { handleAPIError } = await import('@/lib/api-response');

      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
        }),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(400);
      expect(handleAPIError).toHaveBeenCalled();
    });
  });
});