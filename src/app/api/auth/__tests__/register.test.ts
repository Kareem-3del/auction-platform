import { NextRequest } from 'next/server';

import { POST } from '../register/route';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  registerUser: jest.fn(),
}));

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $disconnect: jest.fn(),
  },
}));

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user with valid data', async () => {
    const { registerUser } = await import('@/lib/auth');
    
    // Mock successful registration
    (registerUser as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'BUYER',
        kycStatus: 'PENDING',
        isActive: true,
        emailVerified: false,
        balanceReal: 0,
        balanceVirtual: 0,
        isAnonymousDisplay: true,
        anonymousDisplayName: 'Anonymous Buyer',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        agreeToTerms: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe('test@example.com');
    expect(data.data.tokens).toBeDefined();
    expect(registerUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
      userType: 'BUYER',
      phone: undefined,
    });
  });

  it('should return validation error for invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        agreeToTerms: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_FAILED');
  });

  it('should return validation error for weak password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        agreeToTerms: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_FAILED');
  });

  it('should return validation error for missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        // Missing password, firstName, lastName
        agreeToTerms: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return error when user already exists', async () => {
    const { registerUser } = await import('@/lib/auth');
    
    // Mock user already exists error
    (registerUser as jest.Mock).mockRejectedValue(
      new Error('USER_ALREADY_EXISTS')
    );

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        agreeToTerms: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('USER_ALREADY_EXISTS');
  });

  it('should return method not allowed for non-POST requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'GET',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
  });
});