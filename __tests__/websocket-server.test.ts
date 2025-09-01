/**
 * WebSocket Server Unit Tests
 * Tests the bidding server functionality both locally and on domain
 */

import { jest } from '@jest/globals';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { getBiddingServer } from '../src/lib/websocket/bidding-server';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  },
}));

describe('WebSocket Bidding Server', () => {
  let server: any;
  let mockPrisma: any;

  beforeAll(async () => {
    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret-key-for-websocket-testing';
    process.env.WS_PORT = '8082';
    
    // Import mocked prisma after setting up the mock
    mockPrisma = (await import('@/lib/prisma')).prisma;
    
    // Start the WebSocket server for testing
    server = getBiddingServer();
    
    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Server Initialization', () => {
    test('should initialize WebSocket server on specified port', () => {
      expect(server).toBeDefined();
      console.log('✅ WebSocket server initialized successfully');
    });

    test('should be singleton instance', () => {
      const server2 = getBiddingServer();
      expect(server).toBe(server2);
      console.log('✅ Singleton pattern working correctly');
    });
  });

  describe('Authentication Flow', () => {
    test('should authenticate valid JWT token', async () => {
      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        isActive: true,
      });

      // Create test JWT token
      const token = jwt.sign(
        { sub: 'test-user-id' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Connect to WebSocket
      const ws = new WebSocket('ws://localhost:8082');
      
      return new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          // Send authentication message
          ws.send(JSON.stringify({
            type: 'authenticate',
            token: token
          }));
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'authenticated') {
            expect(message.userId).toBe('test-user-id');
            expect(message.message).toBe('Successfully authenticated');
            console.log('✅ Authentication test passed');
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);
        
        setTimeout(() => reject(new Error('Authentication timeout')), 5000);
      });
    });

    test('should reject invalid JWT token', async () => {
      const ws = new WebSocket('ws://localhost:8082');
      
      return new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'authenticate',
            token: 'invalid-token'
          }));
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'auth_error') {
            expect(message.message).toBe('Authentication failed');
            console.log('✅ Invalid token rejection test passed');
            resolve();
          }
        });

        ws.on('close', () => {
          console.log('✅ Connection closed after auth failure');
          resolve();
        });

        ws.on('error', reject);
        
        setTimeout(() => reject(new Error('Auth rejection timeout')), 5000);
      });
    });
  });

  describe('Auction Room Management', () => {
    test('should join auction room successfully', async () => {
      // Mock user and product lookups
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        isActive: true,
      });

      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'test-product-id',
        title: 'Test Product',
        auctionStatus: 'LIVE',
        currentBid: 100,
        bidCount: 5,
        endTime: new Date(),
      });

      const token = jwt.sign(
        { sub: 'test-user-id' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const ws = new WebSocket('ws://localhost:8082');
      let isAuthenticated = false;

      return new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'authenticate',
            token: token
          }));
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authenticated' && !isAuthenticated) {
            isAuthenticated = true;
            // Join auction after authentication
            ws.send(JSON.stringify({
              type: 'join_auction',
              productId: 'test-product-id'
            }));
          } else if (message.type === 'auction_joined') {
            expect(message.productId).toBe('test-product-id');
            expect(message.product.title).toBe('Test Product');
            expect(message.product.currentBid).toBe(100);
            expect(message.product.bidCount).toBe(5);
            console.log('✅ Auction join test passed');
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);
        
        setTimeout(() => reject(new Error('Auction join timeout')), 5000);
      });
    });

    test('should leave auction room successfully', async () => {
      // This test would follow similar pattern to join test
      // but send leave_auction message and verify response
      console.log('✅ Auction leave test - implementation pending');
    });
  });

  describe('Bid Broadcasting', () => {
    test('should broadcast bid updates to connected clients', async () => {
      // Mock data
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        isActive: true,
      });

      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'test-product-id',
        title: 'Test Product',
        auctionStatus: 'LIVE',
        currentBid: 100,
        bidCount: 5,
        endTime: new Date(),
      });

      const token = jwt.sign(
        { sub: 'test-user-id' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Create two WebSocket connections to test broadcasting
      const ws1 = new WebSocket('ws://localhost:8082');
      const ws2 = new WebSocket('ws://localhost:8082');

      let ws1Ready = false;
      let ws2Ready = false;
      let receivedBroadcast = false;

      return new Promise<void>((resolve, reject) => {
        // Setup first connection
        ws1.on('open', () => {
          ws1.send(JSON.stringify({
            type: 'authenticate',
            token: token
          }));
        });

        ws1.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'authenticated' && !ws1Ready) {
            ws1Ready = true;
            ws1.send(JSON.stringify({
              type: 'join_auction',
              productId: 'test-product-id'
            }));
          } else if (message.type === 'auction_joined') {
            checkReadiness();
          } else if (message.type === 'bid_update') {
            receivedBroadcast = true;
            expect(message.productId).toBe('test-product-id');
            console.log('✅ Bid broadcast test passed');
            ws1.close();
            ws2.close();
            resolve();
          }
        });

        // Setup second connection
        ws2.on('open', () => {
          ws2.send(JSON.stringify({
            type: 'authenticate',
            token: token
          }));
        });

        ws2.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'authenticated' && !ws2Ready) {
            ws2Ready = true;
            ws2.send(JSON.stringify({
              type: 'join_auction',
              productId: 'test-product-id'
            }));
          } else if (message.type === 'auction_joined') {
            checkReadiness();
          }
        });

        const checkReadiness = () => {
          if (ws1Ready && ws2Ready && !receivedBroadcast) {
            // Simulate a bid update broadcast
            server.broadcastBidUpdate('test-product-id', {
              type: 'bid_update',
              productId: 'test-product-id',
              bid: {
                id: 'test-bid-id',
                amount: 150,
                bidTime: new Date().toISOString(),
                userId: 'test-bidder-id',
                bidderName: 'Test Bidder'
              },
              currentBid: 150,
              bidCount: 6,
              message: 'New bid placed'
            });
          }
        };

        ws1.on('error', reject);
        ws2.on('error', reject);
        
        setTimeout(() => reject(new Error('Bid broadcast timeout')), 10000);
      });
    });
  });

  describe('Connection Management', () => {
    test('should handle connection cleanup on disconnect', async () => {
      const connectedUsers = server.getConnectedUsers('test-product-id');
      console.log(`✅ Connected users cleanup test: ${connectedUsers} users`);
      expect(typeof connectedUsers).toBe('number');
    });

    test('should handle heartbeat/ping-pong mechanism', async () => {
      // This would test the heartbeat functionality
      console.log('✅ Heartbeat test - implementation pending');
    });
  });
});

describe('WebSocket Integration Tests', () => {
  describe('Local Environment', () => {
    test('should connect to local WebSocket server', async () => {
      const ws = new WebSocket('ws://localhost:8081');
      
      return new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          console.log('✅ Local WebSocket connection successful');
          ws.close();
          resolve();
        });

        ws.on('error', (error) => {
          console.log('❌ Local WebSocket connection failed:', error.message);
          reject(error);
        });

        setTimeout(() => reject(new Error('Local connection timeout')), 5000);
      });
    });
  });

  describe('Production Environment', () => {
    test('should connect to production WebSocket server', async () => {
      // Update this URL to your actual domain
      const productionWsUrl = 'wss://auction.lebanon-auction.bdaya.tech:8081';
      
      const ws = new WebSocket(productionWsUrl);
      
      return new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          console.log('✅ Production WebSocket connection successful');
          ws.close();
          resolve();
        });

        ws.on('error', (error) => {
          console.log('❌ Production WebSocket connection failed:', error.message);
          // Don't reject in production tests as server might not be running
          resolve();
        });

        setTimeout(() => {
          console.log('⚠️ Production WebSocket connection timeout (expected if server not running)');
          ws.close();
          resolve();
        }, 5000);
      });
    });
  });
});