#!/usr/bin/env node
/**
 * Standalone WebSocket Server for Auction Platform
 * This script starts the WebSocket server as a separate process
 */

const path = require('path');
const fs = require('fs');

// Set up environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Load environment variables from .env file if it exists
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

console.log('🔄 Starting WebSocket server...');
console.log(`📍 Environment: ${process.env.NODE_ENV}`);
console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
console.log(`🗃️ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

// Set up module alias for transpiled code
const moduleAlias = require.cache[require.resolve('module')];
const originalResolveFilename = moduleAlias.exports._resolveFilename;

moduleAlias.exports._resolveFilename = function (request, parent, isMain) {
  if (request.startsWith('@/')) {
    request = path.resolve(__dirname, '../src', request.slice(2));
  } else if (request.startsWith('src/')) {
    request = path.resolve(__dirname, '../src', request.slice(4));
  }
  return originalResolveFilename.call(this, request, parent, isMain);
};

try {
  // Import and start the WebSocket server
  const { getBiddingServer } = require('../src/lib/websocket/bidding-server');
  
  const port = parseInt(process.env.WS_PORT || '8081');
  console.log(`🚀 Initializing WebSocket server on port ${port}...`);
  
  const server = getBiddingServer();
  
  console.log('✅ WebSocket server started successfully!');
  console.log(`📡 WebSocket server running on ws://localhost:${port}`);
  console.log('🎯 Ready to accept auction connections');

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down WebSocket server...');
    server.close();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down WebSocket server...');
    server.close();
    process.exit(0);
  });

  // Keep the process alive
  process.on('exit', () => {
    console.log('👋 WebSocket server process exiting');
  });

} catch (error) {
  console.error('❌ Failed to start WebSocket server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}