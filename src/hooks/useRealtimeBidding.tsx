'use client';

import { getClientEnv } from '@/lib/env';
import { useRef, useState, useEffect, useCallback } from 'react';

import { useAuth } from './useAuth';

interface BidUpdate {
  type: 'bid_update';
  productId: string;
  bid: {
    id: string;
    amount: number;
    bidTime: string;
    userId: string;
    isAnonymous: boolean;
    bidderName: string;
  };
  currentBid: number;
  bidCount: number;
  message: string;
}

interface AuctionStatus {
  type: 'auction_status';
  productId: string;
  status: 'LIVE' | 'ENDED' | 'SCHEDULED';
  endTime?: string;
  message: string;
}

interface AuctionJoined {
  type: 'auction_joined';
  productId: string;
  product: {
    id: string;
    title: string;
    auctionStatus: string;
    currentBid: number;
    bidCount: number;
    endTime?: string;
  };
  message: string;
}

type WebSocketMessage = BidUpdate | AuctionStatus | AuctionJoined | {
  type: 'authenticated' | 'auction_left' | 'error' | 'auth_error';
  message: string;
  userId?: string;
};

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
  const reconnectDelay = 5000; // 5 seconds
  const [isReconnectionStopped, setIsReconnectionStopped] = useState(false);

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

        default:
          console.log('🤷 Unknown message type:', message);
      }
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error);
      onError?.('Failed to parse server message');
    }
  }, [productId, onBidUpdate, onAuctionStatusChange, onError]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isReconnectionStopped) {
      return; // Already connected or reconnection stopped
    }

    try {
      const { WS_URL } = getClientEnv();
      const wsUrl = WS_URL;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        // Authenticate immediately after connection
        if (tokens?.accessToken) {
          ws.send(JSON.stringify({
            type: 'authenticate',
            token: tokens.accessToken
          }));
        } else {
          setConnectionError('No authentication token available');
        }
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsAuthenticated(false);
        
        // Manual reconnection only - no automatic reconnection to prevent infinite loops
        setConnectionError('Connection lost. Click "Reconnect" to retry.');
        console.log('🔌 Connection lost, manual reconnection required');
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish connection');
    }
  }, [tokens?.accessToken]); // Simplified dependencies

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsAuthenticated(false);
  }, []);

  const joinAuction = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isAuthenticated) {
      wsRef.current.send(JSON.stringify({
        type: 'join_auction',
        productId
      }));
    }
  }, [productId, isAuthenticated]);

  const leaveAuction = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave_auction',
        productId
      }));
    }
  }, [productId]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setIsReconnectionStopped(false);
    setConnectionError(null);
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  // Connect on mount and when tokens change (simplified)
  useEffect(() => {
    if (tokens?.accessToken && !isReconnectionStopped) {
      console.log('🔄 Effect triggered - checking connection...');
      // Only connect if not already connected or connecting
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        console.log('🔄 Starting new connection...');
        connect();
      }
    }

    // No cleanup disconnect to prevent connection loop
    return () => {
      console.log('🔄 Effect cleanup - skipping disconnect to prevent loops');
    };
  }, [tokens?.accessToken, isReconnectionStopped]); // Removed connect/disconnect from deps

  // Auto-join auction when authenticated
  useEffect(() => {
    if (isAuthenticated && productId) {
      joinAuction();
    }
  }, [isAuthenticated, productId, joinAuction]);

  // Cleanup on unmount
  useEffect(() => () => {
      disconnect();
    }, [disconnect]);

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