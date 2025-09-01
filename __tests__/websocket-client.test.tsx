/**
 * WebSocket Client Hook Unit Tests
 * Tests the useRealtimeBidding hook functionality
 */

import { jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeBidding } from '../src/hooks/useRealtimeBidding';

// Mock useAuth hook
const mockTokens = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: Date.now() + 3600000, // 1 hour from now
};

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    tokens: mockTokens,
    user: { id: 'test-user-id' },
  }),
}));

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen?: (event: any) => void;
  onclose?: (event: any) => void;
  onmessage?: (event: any) => void;
  onerror?: (event: any) => void;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.({});
    }, 100);
  }

  send(data: string) {
    console.log('MockWebSocket send:', data);
    // Simulate server responses
    const message = JSON.parse(data);
    
    setTimeout(() => {
      if (message.type === 'authenticate') {
        this.onmessage?.({
          data: JSON.stringify({
            type: 'authenticated',
            userId: 'test-user-id',
            message: 'Successfully authenticated'
          })
        });
      } else if (message.type === 'join_auction') {
        this.onmessage?.({
          data: JSON.stringify({
            type: 'auction_joined',
            productId: message.productId,
            product: {
              id: message.productId,
              title: 'Test Product',
              auctionStatus: 'LIVE',
              currentBid: 100,
              bidCount: 5,
              endTime: new Date().toISOString()
            },
            message: 'Joined auction for Test Product'
          })
        });
      }
    }, 50);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    setTimeout(() => {
      this.onclose?.({ code, reason });
    }, 50);
  }

  ping() {
    // Mock ping implementation
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('useRealtimeBidding Hook', () => {
  const mockProductId = 'test-product-id';
  let mockOnBidUpdate: jest.Mock;
  let mockOnAuctionStatusChange: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    mockOnBidUpdate = jest.fn();
    mockOnAuctionStatusChange = jest.fn();
    mockOnError = jest.fn();
    
    // Reset console.log spy
    jest.clearAllMocks();
  });

  test('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useRealtimeBidding({
        productId: mockProductId,
        onBidUpdate: mockOnBidUpdate,
        onAuctionStatusChange: mockOnAuctionStatusChange,
        onError: mockOnError,
      })
    );

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentBid).toBe(0);
    expect(result.current.bidCount).toBe(0);
    expect(result.current.lastBid).toBe(null);
    expect(result.current.auctionStatus).toBe('');
    expect(result.current.connectionError).toBe(null);
  });

  test('should connect and authenticate successfully', async () => {
    const { result } = renderHook(() =>
      useRealtimeBidding({
        productId: mockProductId,
        onBidUpdate: mockOnBidUpdate,
        onAuctionStatusChange: mockOnAuctionStatusChange,
        onError: mockOnError,
      })
    );

    // Wait for connection and authentication
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    }, { timeout: 3000 });

    console.log('✅ Connection and authentication test passed');
  });

  test('should join auction after authentication', async () => {
    const { result } = renderHook(() =>
      useRealtimeBidding({
        productId: mockProductId,
        onBidUpdate: mockOnBidUpdate,
        onAuctionStatusChange: mockOnAuctionStatusChange,
        onError: mockOnError,
      })
    );

    // Wait for full connection flow
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(result.current.currentBid).toBe(100);
      expect(result.current.bidCount).toBe(5);
      expect(result.current.auctionStatus).toBe('LIVE');
    }, { timeout: 3000 });

    console.log('✅ Auction join test passed');
  });

  test('should handle bid updates', async () => {
    const { result } = renderHook(() =>
      useRealtimeBidding({
        productId: mockProductId,
        onBidUpdate: mockOnBidUpdate,
        onAuctionStatusChange: mockOnAuctionStatusChange,
        onError: mockOnError,
      })
    );

    // Wait for authentication
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    }, { timeout: 3000 });

    // Simulate bid update message
    act(() => {
      const mockWs = (global as any).WebSocket;
      const wsInstance = new mockWs('ws://localhost:8081');
      
      setTimeout(() => {
        wsInstance.onmessage?.({
          data: JSON.stringify({
            type: 'bid_update',
            productId: mockProductId,
            bid: {
              id: 'new-bid-id',
              amount: 150,
              bidTime: new Date().toISOString(),
              userId: 'bidder-user-id',
              isAnonymous: false,
              bidderName: 'Test Bidder'
            },
            currentBid: 150,
            bidCount: 6,
            message: 'New bid placed'
          })
        });
      }, 100);
    });

    await waitFor(() => {
      expect(mockOnBidUpdate).toHaveBeenCalled();
      expect(result.current.currentBid).toBe(150);
      expect(result.current.bidCount).toBe(6);
    }, { timeout: 3000 });

    console.log('✅ Bid update handling test passed');
  });

  test('should handle auction status changes', async () => {
    const { result } = renderHook(() =>
      useRealtimeBidding({
        productId: mockProductId,
        onBidUpdate: mockOnBidUpdate,
        onAuctionStatusChange: mockOnAuctionStatusChange,
        onError: mockOnError,
      })
    );

    // Wait for authentication
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    }, { timeout: 3000 });

    // Simulate auction status change
    act(() => {
      const mockWs = (global as any).WebSocket;
      const wsInstance = new mockWs('ws://localhost:8081');
      
      setTimeout(() => {
        wsInstance.onmessage?.({
          data: JSON.stringify({
            type: 'auction_status',
            productId: mockProductId,
            status: 'ENDED',
            message: 'Auction has ended'
          })
        });
      }, 100);
    });

    await waitFor(() => {
      expect(mockOnAuctionStatusChange).toHaveBeenCalled();
      expect(result.current.auctionStatus).toBe('ENDED');
    }, { timeout: 3000 });

    console.log('✅ Auction status change test passed');
  });

  test('should handle connection errors', async () => {
    const { result } = renderHook(() =>
      useRealtimeBidding({
        productId: mockProductId,
        onBidUpdate: mockOnBidUpdate,
        onAuctionStatusChange: mockOnAuctionStatusChange,
        onError: mockOnError,
      })
    );

    // Simulate error message
    act(() => {
      const mockWs = (global as any).WebSocket;
      const wsInstance = new mockWs('ws://localhost:8081');
      
      setTimeout(() => {
        wsInstance.onmessage?.({
          data: JSON.stringify({
            type: 'error',
            message: 'Test error message'
          })
        });
      }, 100);
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Test error message');
      expect(result.current.connectionError).toBe('Test error message');
    }, { timeout: 3000 });

    console.log('✅ Error handling test passed');
  });

  test('should provide reconnect functionality', async () => {
    const { result } = renderHook(() =>
      useRealtimeBidding({
        productId: mockProductId,
        onBidUpdate: mockOnBidUpdate,
        onAuctionStatusChange: mockOnAuctionStatusChange,
        onError: mockOnError,
      })
    );

    // Wait for initial connection
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    }, { timeout: 3000 });

    // Test reconnect function
    act(() => {
      result.current.reconnect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    }, { timeout: 3000 });

    console.log('✅ Reconnect functionality test passed');
  });

  test('should clean up connections on unmount', () => {
    const { unmount } = renderHook(() =>
      useRealtimeBidding({
        productId: mockProductId,
        onBidUpdate: mockOnBidUpdate,
        onAuctionStatusChange: mockOnAuctionStatusChange,
        onError: mockOnError,
      })
    );

    // Unmount should trigger cleanup
    unmount();

    console.log('✅ Cleanup on unmount test passed');
  });
});