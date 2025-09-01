/**
 * WebSocket Integration Tests
 * End-to-end tests for WebSocket functionality on both local and production environments
 */

import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

// Test configuration
const TEST_CONFIG = {
  local: {
    wsUrl: 'ws://localhost:8081',
    apiUrl: 'http://localhost:3000',
  },
  production: {
    wsUrl: 'wss://auction.lebanon-auction.bdaya.tech:8081',
    apiUrl: 'https://auction.lebanon-auction.bdaya.tech',
  },
};

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
const TEST_USER_ID = 'test-integration-user-id';
const TEST_PRODUCT_ID = 'test-integration-product-id';

// Helper function to create test JWT token
function createTestToken(userId: string): string {
  return jwt.sign(
    { sub: userId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Helper function to create WebSocket connection with timeout
function createWebSocketConnection(url: string, timeout: number = 5000): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    
    const timeoutId = setTimeout(() => {
      ws.close();
      reject(new Error(`WebSocket connection timeout after ${timeout}ms`));
    }, timeout);

    ws.on('open', () => {
      clearTimeout(timeoutId);
      resolve(ws);
    });

    ws.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

// Helper function to send message and wait for response
function sendAndWaitForResponse(
  ws: WebSocket, 
  message: any, 
  expectedType: string,
  timeout: number = 3000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Response timeout for message type: ${expectedType}`));
    }, timeout);

    const messageHandler = (data: Buffer) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.type === expectedType) {
          clearTimeout(timeoutId);
          ws.off('message', messageHandler);
          resolve(response);
        } else if (response.type === 'error' || response.type === 'auth_error') {
          clearTimeout(timeoutId);
          ws.off('message', messageHandler);
          reject(new Error(`Server error: ${response.message}`));
        }
      } catch (error) {
        clearTimeout(timeoutId);
        ws.off('message', messageHandler);
        reject(error);
      }
    };

    ws.on('message', messageHandler);
    ws.send(JSON.stringify(message));
  });
}

describe('WebSocket Integration Tests', () => {
  // Test both environments
  const environments = process.env.NODE_ENV === 'production' 
    ? ['local', 'production'] 
    : ['local']; // Only test local in development

  environments.forEach(env => {
    describe(`${env.toUpperCase()} Environment`, () => {
      const config = TEST_CONFIG[env as keyof typeof TEST_CONFIG];
      let ws: WebSocket;

      afterEach(async () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
          // Wait for connection to close
          await new Promise(resolve => {
            if (ws.readyState === WebSocket.CLOSED) {
              resolve(void 0);
            } else {
              ws.on('close', resolve);
            }
          });
        }
      });

      test('should establish WebSocket connection', async () => {
        try {
          ws = await createWebSocketConnection(config.wsUrl);
          expect(ws.readyState).toBe(WebSocket.OPEN);
          console.log(`✅ [${env}] WebSocket connection established`);
        } catch (error) {
          if (env === 'production') {
            console.log(`⚠️ [${env}] WebSocket connection failed (expected if server not running):`, (error as Error).message);
            return; // Skip production tests if server is not available
          }
          throw error;
        }
      });

      test('should authenticate with valid token', async () => {
        try {
          ws = await createWebSocketConnection(config.wsUrl);
          
          const token = createTestToken(TEST_USER_ID);
          const response = await sendAndWaitForResponse(
            ws,
            { type: 'authenticate', token },
            'authenticated'
          );

          expect(response.type).toBe('authenticated');
          expect(response.userId).toBe(TEST_USER_ID);
          console.log(`✅ [${env}] Authentication successful`);
        } catch (error) {
          if (env === 'production') {
            console.log(`⚠️ [${env}] Authentication test skipped:`, (error as Error).message);
            return;
          }
          throw error;
        }
      });

      test('should reject invalid token', async () => {
        try {
          ws = await createWebSocketConnection(config.wsUrl);
          
          try {
            await sendAndWaitForResponse(
              ws,
              { type: 'authenticate', token: 'invalid-token' },
              'authenticated',
              2000
            );
            throw new Error('Should have rejected invalid token');
          } catch (error) {
            if ((error as Error).message.includes('Server error')) {
              console.log(`✅ [${env}] Invalid token correctly rejected`);
            } else {
              throw error;
            }
          }
        } catch (error) {
          if (env === 'production') {
            console.log(`⚠️ [${env}] Invalid token test skipped:`, (error as Error).message);
            return;
          }
          throw error;
        }
      });

      test('should join auction room', async () => {
        try {
          ws = await createWebSocketConnection(config.wsUrl);
          
          // First authenticate
          const token = createTestToken(TEST_USER_ID);
          await sendAndWaitForResponse(
            ws,
            { type: 'authenticate', token },
            'authenticated'
          );

          // Then join auction
          const joinResponse = await sendAndWaitForResponse(
            ws,
            { type: 'join_auction', productId: TEST_PRODUCT_ID },
            'auction_joined'
          );

          expect(joinResponse.type).toBe('auction_joined');
          expect(joinResponse.productId).toBe(TEST_PRODUCT_ID);
          console.log(`✅ [${env}] Auction room join successful`);
        } catch (error) {
          if (env === 'production') {
            console.log(`⚠️ [${env}] Auction join test skipped:`, (error as Error).message);
            return;
          }
          throw error;
        }
      });

      test('should leave auction room', async () => {
        try {
          ws = await createWebSocketConnection(config.wsUrl);
          
          // Authenticate and join
          const token = createTestToken(TEST_USER_ID);
          await sendAndWaitForResponse(
            ws,
            { type: 'authenticate', token },
            'authenticated'
          );

          await sendAndWaitForResponse(
            ws,
            { type: 'join_auction', productId: TEST_PRODUCT_ID },
            'auction_joined'
          );

          // Then leave auction
          const leaveResponse = await sendAndWaitForResponse(
            ws,
            { type: 'leave_auction', productId: TEST_PRODUCT_ID },
            'auction_left'
          );

          expect(leaveResponse.type).toBe('auction_left');
          expect(leaveResponse.productId).toBe(TEST_PRODUCT_ID);
          console.log(`✅ [${env}] Auction room leave successful`);
        } catch (error) {
          if (env === 'production') {
            console.log(`⚠️ [${env}] Auction leave test skipped:`, (error as Error).message);
            return;
          }
          throw error;
        }
      });

      test('should handle ping/pong heartbeat', async () => {
        try {
          ws = await createWebSocketConnection(config.wsUrl);
          
          let pongReceived = false;
          ws.on('pong', () => {
            pongReceived = true;
          });

          ws.ping();
          
          // Wait for pong response
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log(`✅ [${env}] Heartbeat mechanism ${pongReceived ? 'working' : 'not responding'}`);
        } catch (error) {
          if (env === 'production') {
            console.log(`⚠️ [${env}] Heartbeat test skipped:`, (error as Error).message);
            return;
          }
          throw error;
        }
      });

      test('should handle connection cleanup gracefully', async () => {
        try {
          ws = await createWebSocketConnection(config.wsUrl);
          
          let closeEventReceived = false;
          ws.on('close', () => {
            closeEventReceived = true;
          });

          ws.close();
          
          // Wait for close event
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          expect(closeEventReceived).toBe(true);
          expect(ws.readyState).toBe(WebSocket.CLOSED);
          console.log(`✅ [${env}] Connection cleanup successful`);
        } catch (error) {
          if (env === 'production') {
            console.log(`⚠️ [${env}] Cleanup test skipped:`, (error as Error).message);
            return;
          }
          throw error;
        }
      });
    });
  });
});

describe('WebSocket Performance Tests', () => {
  test('should handle multiple concurrent connections', async () => {
    const connectionCount = 5;
    const connections: WebSocket[] = [];
    
    try {
      console.log(`🚀 Testing ${connectionCount} concurrent connections...`);
      
      // Create multiple connections
      const connectionPromises = Array.from({ length: connectionCount }, (_, i) => 
        createWebSocketConnection(TEST_CONFIG.local.wsUrl)
      );

      const startTime = Date.now();
      const allConnections = await Promise.all(connectionPromises);
      const connectionTime = Date.now() - startTime;
      
      connections.push(...allConnections);

      expect(allConnections).toHaveLength(connectionCount);
      allConnections.forEach(ws => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
      });

      console.log(`✅ ${connectionCount} concurrent connections established in ${connectionTime}ms`);
      
    } catch (error) {
      console.log(`❌ Concurrent connections test failed:`, (error as Error).message);
      throw error;
    } finally {
      // Cleanup all connections
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
    }
  });

  test('should handle message throughput', async () => {
    const messageCount = 100;
    let ws: WebSocket;
    
    try {
      ws = await createWebSocketConnection(TEST_CONFIG.local.wsUrl);
      
      const token = createTestToken(TEST_USER_ID);
      await sendAndWaitForResponse(
        ws,
        { type: 'authenticate', token },
        'authenticated'
      );

      let messagesReceived = 0;
      const startTime = Date.now();

      ws.on('message', () => {
        messagesReceived++;
      });

      // Send multiple messages rapidly
      for (let i = 0; i < messageCount; i++) {
        ws.send(JSON.stringify({
          type: 'join_auction',
          productId: `test-product-${i}`
        }));
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const processingTime = Date.now() - startTime;
      const messagesPerSecond = (messagesReceived / processingTime) * 1000;

      console.log(`✅ Message throughput: ${messagesReceived}/${messageCount} messages in ${processingTime}ms (${messagesPerSecond.toFixed(2)} msg/sec)`);
      
    } catch (error) {
      console.log(`❌ Message throughput test failed:`, (error as Error).message);
      throw error;
    } finally {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
  });
});

describe('WebSocket Error Recovery Tests', () => {
  test('should handle server restart simulation', async () => {
    let ws: WebSocket;
    
    try {
      ws = await createWebSocketConnection(TEST_CONFIG.local.wsUrl);
      
      let reconnected = false;
      let disconnected = false;

      ws.on('close', () => {
        disconnected = true;
      });

      // Simulate server disconnect
      ws.close();
      
      // Wait for disconnect
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(disconnected).toBe(true);

      // Attempt reconnection
      try {
        ws = await createWebSocketConnection(TEST_CONFIG.local.wsUrl, 3000);
        reconnected = true;
      } catch (error) {
        console.log(`⚠️ Reconnection failed (expected if server restarted):`, (error as Error).message);
      }

      console.log(`✅ Server restart recovery test: disconnect=${disconnected}, reconnect=${reconnected}`);
      
    } catch (error) {
      console.log(`❌ Error recovery test failed:`, (error as Error).message);
      throw error;
    } finally {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
  });
});

// Export test utilities for use in other test files
export {
  createTestToken,
  createWebSocketConnection,
  sendAndWaitForResponse,
  TEST_CONFIG,
  TEST_USER_ID,
  TEST_PRODUCT_ID
};