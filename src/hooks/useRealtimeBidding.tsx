'use client';

import { getClientEnv } from 'src/lib/env';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { 
  WebSocketMessage, 
  BidUpdate, 
  AuctionStatusUpdate,
  ConnectionStatus
} from 'src/types/common';

interface UseRealtimeBiddingOptions {
  productId: string;
  onBidUpdate?: (update: BidUpdate) => void;
  onAuctionStatusChange?: (status: AuctionStatus) => void;
  onError?: (error: string) => void;
}

interface UseRealtimeBiddingReturn {
  isConnected: boolean;
  isAuthenticated: boolean;
  currentBid: number;
  bidCount: number;
  lastBid: BidUpdate['bid'] | null;
  auctionStatus: string;
  connectionError: string | null;
  joinAuction: () => void;
  leaveAuction: () => void;
  reconnect: () => void;
}

export function useRealtimeBidding({
  productId,
  onBidUpdate,
  onAuctionStatusChange,
  onError,
}: UseRealtimeBiddingOptions): UseRealtimeBiddingReturn {
  const { tokens } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const reconnectDelay = 2000; // 2 seconds, faster reconnection
  const [isReconnectionStopped, setIsReconnectionStopped] = useState(false);
  const isConnectingRef = useRef(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout>();

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentBid, setCurrentBid] = useState(0);
  const [bidCount, setBidCount] = useState(0);
  const [lastBid, setLastBid] = useState<BidUpdate['bid'] | null>(null);
  const [auctionStatus, setAuctionStatus] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('📨 WebSocket message:', message);

      switch (message.type) {
        case 'authenticated':
          setIsAuthenticated(true);
          setConnectionError(null);
          console.log('✅ WebSocket authenticated');
          break;

        case 'auction_joined': {
          const joinedMessage = message as AuctionJoined;
          setCurrentBid(joinedMessage.product.currentBid);
          setBidCount(joinedMessage.product.bidCount);
          setAuctionStatus(joinedMessage.product.auctionStatus);
          console.log('🎯 Joined auction:', joinedMessage.productId);
          break;
        }

        case 'bid_update': {
          const bidUpdate = message as BidUpdate;
          if (bidUpdate.productId === productId) {
            setCurrentBid(bidUpdate.currentBid);
            setBidCount(bidUpdate.bidCount);
            setLastBid(bidUpdate.bid);
            onBidUpdate?.(bidUpdate);
            console.log('💰 Bid update:', bidUpdate.bid.amount);
          }
          break;
        }

        case 'auction_status': {
          const statusUpdate = message as AuctionStatus;
          if (statusUpdate.productId === productId) {
            setAuctionStatus(statusUpdate.status);
            onAuctionStatusChange?.(statusUpdate);
            console.log('🎪 Auction status:', statusUpdate.status);
          }
          break;
        }

        case 'error':
        case 'auth_error': {
          const errorMessage = message.message || 'WebSocket error';
          setConnectionError(errorMessage);
          onError?.(errorMessage);
          console.error('❌ WebSocket error:', errorMessage);
          break;
        }

        case 'auction_left':
          console.log('👋 Left auction');
          break;

        case 'pong':
          console.log('🧡 Received heartbeat pong');
          if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
          }
          break;

        default:
          console.log('🤷 Unknown message type:', message);
      }
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error);
      onError?.('Failed to parse server message');
    }
  }, [productId, onBidUpdate, onAuctionStatusChange, onError]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('🧡 Sending heartbeat message');
        // Browser WebSocket doesn't have ping(), so send a custom heartbeat message
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
        
        // Set timeout for pong response
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }
        
        heartbeatTimeoutRef.current = setTimeout(() => {
          console.log('💔 Heartbeat timeout - connection appears dead');
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.close(1000, 'Heartbeat timeout');
          }
        }, 5000); // 5 second timeout for pong
      }
    }, 30000); // Send ping every 30 seconds
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined as any;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = undefined as any;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (isReconnectionStopped || reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('🔌 Max reconnection attempts reached or stopped');
      setConnectionError('Connection failed. Click "Reconnect" to retry manually.');
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1), 30000); // Exponential backoff, max 30s
    
    console.log(`🔌 Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isReconnectionStopped) {
        connect();
      }
    }, delay);
  }, [isReconnectionStopped, maxReconnectAttempts]);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || (wsRef.current?.readyState === WebSocket.OPEN) || isReconnectionStopped) {
      return;
    }

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    isConnectingRef.current = true;

    try {
      const { WS_URL } = getClientEnv();
      
      if (!WS_URL) {
        console.error('❌ WS_URL not configured');
        setConnectionError('WebSocket URL not configured');
        return;
      }
      
      console.log(`🔌 Attempting WebSocket connection to: ${WS_URL}`);
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('🔌 Connection timeout, closing socket');
          ws.close();
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        isConnectingRef.current = false;
        console.log('🔌 WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0; // Reset attempts on successful connection

        // Start heartbeat to keep connection alive
        startHeartbeat();

        // Authenticate if we have a token, otherwise continue anonymously
        if (tokens?.accessToken) {
          ws.send(JSON.stringify({
            type: 'authenticate',
            token: tokens.accessToken
          }));
        } else {
          // For anonymous users, set as authenticated for read-only access
          console.log('📡 Connecting as anonymous user for read-only access');
          setIsAuthenticated(true);
        }
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        isConnectingRef.current = false;
        stopHeartbeat(); // Stop heartbeat when connection closes
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsAuthenticated(false);
        
        // Only attempt auto-reconnection if it wasn't a manual close
        if (event.code !== 1000 && !isReconnectionStopped) {
          console.log('🔌 Connection lost, attempting auto-reconnection...');
          setConnectionError('Connection lost, reconnecting...');
          scheduleReconnect();
        } else if (event.code === 1000) {
          console.log('🔌 Connection closed manually');
          setConnectionError('Connection closed');
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        isConnectingRef.current = false;
        stopHeartbeat(); // Stop heartbeat on error
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
        setIsAuthenticated(false);
        
        if (!isReconnectionStopped) {
          setConnectionError('Connection error, retrying...');
          scheduleReconnect();
        }
      };

      // Browser WebSocket doesn't support 'pong' events
      // Heartbeat responses are handled via message events above

    } catch (error) {
      isConnectingRef.current = false;
      console.error('❌ Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish connection');
      
      if (!isReconnectionStopped) {
        scheduleReconnect();
      }
    }
  }, [tokens?.accessToken, scheduleReconnect, handleMessage, isReconnectionStopped, startHeartbeat, stopHeartbeat]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    stopHeartbeat(); // Stop heartbeat when disconnecting
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsAuthenticated(false);
  }, [stopHeartbeat]);

  const joinAuction = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isAuthenticated) {
      wsRef.current.send(JSON.stringify({
        type: 'join_auction',
        productId,
        anonymous: !tokens?.accessToken // Mark as anonymous if no token
      }));
    }
  }, [productId, isAuthenticated, tokens?.accessToken]);

  const leaveAuction = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave_auction',
        productId
      }));
    }
  }, [productId]);

  const reconnect = useCallback(() => {
    console.log('🔌 Manual reconnect triggered');
    setIsReconnectionStopped(false);
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    
    // Clean disconnect first
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    stopHeartbeat(); // Stop heartbeat during manual reconnection
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual reconnection');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsAuthenticated(false);
    isConnectingRef.current = false;
    
    // Wait a moment then reconnect
    setTimeout(() => {
      connect();
    }, 500);
  }, [connect, stopHeartbeat]);

  // Connect on mount and when productId changes (tokens are optional for anonymous access)
  useEffect(() => {
    if (productId && !isReconnectionStopped) {
      console.log('🔄 Effect triggered - checking connection...', {
        hasToken: !!tokens?.accessToken,
        productId,
        currentState: wsRef.current?.readyState,
        isConnecting: isConnectingRef.current
      });
      
      // Only connect if not already connected or connecting
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        console.log('🔄 Starting new connection...');
        connect();
      }
    }

    return () => {
      // Clean up on unmount only
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [productId, connect, isReconnectionStopped]);

  // Auto-join auction when authenticated
  useEffect(() => {
    if (isAuthenticated && productId) {
      joinAuction();
    }
  }, [isAuthenticated, productId, joinAuction]);

  // Cleanup on unmount
  useEffect(() => () => {
    console.log('🔄 Component unmounting, cleaning up WebSocket...');
    setIsReconnectionStopped(true);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    stopHeartbeat(); // Stop heartbeat on unmount
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
  }, [stopHeartbeat]);

  return {
    isConnected,
    isAuthenticated,
    currentBid,
    bidCount,
    lastBid,
    auctionStatus,
    connectionError,
    joinAuction,
    leaveAuction,
    reconnect,
  };
}