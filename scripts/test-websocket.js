#!/usr/bin/env node
/**
 * Manual WebSocket Testing Script
 * Run this script to test WebSocket functionality manually
 * 
 * Usage:
 *   node scripts/test-websocket.js local
 *   node scripts/test-websocket.js production
 *   node scripts/test-websocket.js both
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Configuration
const CONFIG = {
  local: {
    wsUrl: 'ws://localhost:8081',
    name: 'LOCAL'
  },
  production: {
    wsUrl: 'wss://auction.lebanon-auction.bdaya.tech/ws/', 
    name: 'PRODUCTION'
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here';
const TEST_USER_ID = 'test-manual-user-id';
const TEST_PRODUCT_ID = 'test-manual-product-id';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createTestToken(userId) {
  return jwt.sign(
    { sub: userId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function testWebSocketConnection(config) {
  log(`\n🔄 Testing ${config.name} WebSocket Connection...`, 'blue');
  log(`📡 Connecting to: ${config.wsUrl}`, 'blue');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(config.wsUrl);
    let testResults = {
      environment: config.name,
      connection: false,
      authentication: false,
      auctionJoin: false,
      auctionLeave: false,
      errors: []
    };

    // Connection timeout
    const connectionTimeout = setTimeout(() => {
      ws.close();
      testResults.errors.push('Connection timeout');
      reject(testResults);
    }, 10000);

    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      testResults.connection = true;
      log(`✅ Connected to ${config.name} WebSocket server`, 'green');

      // Test authentication
      const token = createTestToken(TEST_USER_ID);
      log(`🔐 Testing authentication...`, 'yellow');
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: token
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        log(`📨 Received: ${message.type} - ${message.message || 'No message'}`, 'blue');

        switch (message.type) {
          case 'authenticated':
            testResults.authentication = true;
            log(`✅ Authentication successful`, 'green');
            
            // Test joining auction
            log(`🎯 Testing auction join...`, 'yellow');
            ws.send(JSON.stringify({
              type: 'join_auction',
              productId: TEST_PRODUCT_ID
            }));
            break;

          case 'auction_joined':
            testResults.auctionJoin = true;
            log(`✅ Auction join successful`, 'green');
            log(`🎪 Auction details:`, 'blue');
            log(`   - Product ID: ${message.productId}`, 'blue');
            log(`   - Current Bid: $${message.product?.currentBid || 0}`, 'blue');
            log(`   - Bid Count: ${message.product?.bidCount || 0}`, 'blue');
            log(`   - Status: ${message.product?.auctionStatus || 'Unknown'}`, 'blue');

            // Test leaving auction
            log(`👋 Testing auction leave...`, 'yellow');
            ws.send(JSON.stringify({
              type: 'leave_auction',
              productId: TEST_PRODUCT_ID
            }));
            break;

          case 'auction_left':
            testResults.auctionLeave = true;
            log(`✅ Auction leave successful`, 'green');
            
            // Close connection after all tests
            setTimeout(() => {
              ws.close();
            }, 1000);
            break;

          case 'error':
          case 'auth_error':
            testResults.errors.push(message.message);
            log(`❌ Server error: ${message.message}`, 'red');
            ws.close();
            break;

          default:
            log(`ℹ️ Unknown message type: ${message.type}`, 'yellow');
        }
      } catch (error) {
        testResults.errors.push(`Failed to parse message: ${error.message}`);
        log(`❌ Failed to parse message: ${error.message}`, 'red');
      }
    });

    ws.on('close', (code, reason) => {
      log(`🔌 Connection closed: ${code} - ${reason || 'No reason'}`, 'yellow');
      resolve(testResults);
    });

    ws.on('error', (error) => {
      clearTimeout(connectionTimeout);
      testResults.errors.push(error.message);
      log(`❌ WebSocket error: ${error.message}`, 'red');
      reject(testResults);
    });

    // Test heartbeat
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        log(`💓 Testing heartbeat...`, 'yellow');
        ws.ping();
      }
    }, 2000);

    ws.on('pong', () => {
      log(`✅ Heartbeat response received`, 'green');
    });
  });
}

function printTestSummary(results) {
  log(`\n📊 TEST SUMMARY FOR ${results.environment}`, 'blue');
  log(`===========================================`, 'blue');
  
  const tests = [
    { name: 'Connection', passed: results.connection },
    { name: 'Authentication', passed: results.authentication },
    { name: 'Auction Join', passed: results.auctionJoin },
    { name: 'Auction Leave', passed: results.auctionLeave }
  ];

  tests.forEach(test => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    const color = test.passed ? 'green' : 'red';
    log(`${test.name.padEnd(20)}: ${status}`, color);
  });

  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;
  
  log(`\nResults: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');

  if (results.errors.length > 0) {
    log(`\n❌ Errors encountered:`, 'red');
    results.errors.forEach((error, index) => {
      log(`   ${index + 1}. ${error}`, 'red');
    });
  }
}

async function main() {
  const testEnvironment = process.argv[2] || 'local';
  
  log(`🚀 WebSocket Manual Testing Tool`, 'blue');
  log(`================================`, 'blue');
  
  if (!['local', 'production', 'both'].includes(testEnvironment)) {
    log(`❌ Invalid environment: ${testEnvironment}`, 'red');
    log(`Usage: node scripts/test-websocket.js [local|production|both]`, 'yellow');
    process.exit(1);
  }

  const environments = testEnvironment === 'both' 
    ? ['local', 'production'] 
    : [testEnvironment];

  const allResults = [];

  for (const env of environments) {
    try {
      const results = await testWebSocketConnection(CONFIG[env]);
      allResults.push(results);
      printTestSummary(results);
    } catch (error) {
      allResults.push(error);
      printTestSummary(error);
    }
    
    if (environments.length > 1) {
      log(`\n⏳ Waiting 2 seconds before next test...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Final summary
  if (allResults.length > 1) {
    log(`\n🎯 OVERALL SUMMARY`, 'blue');
    log(`==================`, 'blue');
    
    allResults.forEach(result => {
      const tests = [result.connection, result.authentication, result.auctionJoin, result.auctionLeave];
      const passed = tests.filter(Boolean).length;
      const total = tests.length;
      const status = passed === total ? '✅' : passed > 0 ? '⚠️' : '❌';
      
      log(`${result.environment.padEnd(12)}: ${status} ${passed}/${total} tests passed`, 
          passed === total ? 'green' : passed > 0 ? 'yellow' : 'red');
    });
  }

  log(`\n🏁 Testing completed!`, 'blue');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled promise rejection: ${reason}`, 'red');
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  log(`\n🛑 Testing interrupted by user`, 'yellow');
  process.exit(0);
});

if (require.main === module) {
  main().catch(error => {
    log(`❌ Test execution failed: ${error.message}`, 'red');
    process.exit(1);
  });
}