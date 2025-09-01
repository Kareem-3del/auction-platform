// WebSocket server initialization for development
// This should be moved to a separate process in production

import { getBiddingServer } from './bidding-server';

let isInitialized = false;

export function initializeWebSocket() {
  if (isInitialized) {
    console.log('WebSocket server already initialized');
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    // Only start WebSocket server in development mode
    // In production, this should be a separate service
    try {
      getBiddingServer();
      isInitialized = true;
      console.log('✅ WebSocket server initialized for development');
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket server:', error);
    }
  } else {
    // In production, we connect to the external WebSocket server
    // but don't start our own server
    console.log('⚠️ WebSocket server not started in production mode - using external service on port 8081');
    isInitialized = true; // Mark as initialized to allow connections
  }
}

// Auto-initialize when this module is imported
if (typeof window === 'undefined') {
  // Only initialize on server side
  initializeWebSocket();
}