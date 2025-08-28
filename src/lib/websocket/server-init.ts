// Server-only WebSocket initialization
import { initializeWebSocket } from './init';

// Initialize WebSocket server on import (server-side only)
if (typeof window === 'undefined') {
  initializeWebSocket();
}