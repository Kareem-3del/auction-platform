/**
 * Enhanced WebSocket Bidding Server with Security & Scaling
 * Includes rate limiting, message size limits, and Redis pub/sub for scaling
 */

import type { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { setActiveWebSocketConnections, recordWebSocketConnection } from '@/lib/metrics';
import { WebSocket, WebSocketServer } from 'ws';

// Rate limiting configuration
const MESSAGE_RATE_LIMIT = 30; // messages per minute
const CONNECTION_LIMIT_PER_USER = 5; // max connections per user
const MAX_MESSAGE_SIZE = 10 * 1024; // 10KB max message size

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  productId?: string;
  isAlive?: boolean;
  messageCount?: number;
  lastMessageReset?: number;
}

interface BidUpdate {
  type: 'bid_update';
  productId: string;
  bid: {
    id: string;
    amount: number;
    bidTime: string;
    userId: string;
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

export class BiddingWebSocketServer {
  private wss: WebSocketServer;
  private productConnections: Map<string, Set<AuthenticatedWebSocket>>;
  private userConnections: Map<string, Set<AuthenticatedWebSocket>>;
  private heartbeatInterval: NodeJS.Timeout;
  private redisSubscriber: typeof redis;

  constructor(port: number = 8081) {
    this.wss = new WebSocketServer({
      port,
      verifyClient: this.verifyClient.bind(this),
      maxPayload: MAX_MESSAGE_SIZE,
    });

    this.productConnections = new Map();
    this.userConnections = new Map();

    this.wss.on('connection', this.handleConnection.bind(this));

    logger.info('WebSocket bidding server started', { port });

    // Setup heartbeat to detect broken connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          this.removeConnection(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });

      // Update metrics
      setActiveWebSocketConnections(this.wss.clients.size);
    }, 30000); // 30 seconds

    // Setup Redis pub/sub for cross-instance communication
    this.setupRedisPubSub();
  }

  /**
   * Setup Redis pub/sub for scaling across multiple instances
   */
  private async setupRedisPubSub() {
    try {
      this.redisSubscriber = redis.duplicate();

      await this.redisSubscriber.subscribe('bid-updates', (message) => {
        try {
          const update: BidUpdate = JSON.parse(message);
          this.broadcastBidUpdate(update.productId, update);
        } catch (error) {
          logger.error('Failed to process Redis pub/sub message', error);
        }
      });

      await this.redisSubscriber.subscribe('auction-status', (message) => {
        try {
          const update: AuctionStatus = JSON.parse(message);
          this.broadcastAuctionStatus(update.productId, update);
        } catch (error) {
          logger.error('Failed to process auction status message', error);
        }
      });

      logger.info('Redis pub/sub setup completed for WebSocket scaling');
    } catch (error) {
      logger.error('Failed to setup Redis pub/sub', error);
    }
  }

  /**
   * Verify client origin and enforce security checks
   */
  private verifyClient(info: {
    origin: string;
    secure: boolean;
    req: IncomingMessage;
  }): boolean {
    // Check allowed origins in production
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://auction.lebanon-auction.bdaya.tech',
      ];

      if (info.origin && !allowedOrigins.includes(info.origin)) {
        logger.warn('WebSocket connection rejected - invalid origin', {
          origin: info.origin,
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage) {
    ws.isAlive = true;
    ws.messageCount = 0;
    ws.lastMessageReset = Date.now();

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data: Buffer) => {
      try {
        // Rate limiting check
        if (!this.checkRateLimit(ws)) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Rate limit exceeded. Please slow down.',
            })
          );
          return;
        }

        // Message size check (additional safety)
        if (data.length > MAX_MESSAGE_SIZE) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Message too large',
            })
          );
          return;
        }

        const message = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        logger.error('WebSocket message error', error);
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
          })
        );
      }
    });

    ws.on('close', () => {
      logger.ws('Connection closed', { userId: ws.userId });
      this.removeConnection(ws);
      recordWebSocketConnection(false);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error', error, { userId: ws.userId });
      this.removeConnection(ws);
    });

    recordWebSocketConnection(true);
  }

  /**
   * Check rate limit for WebSocket messages
   */
  private checkRateLimit(ws: AuthenticatedWebSocket): boolean {
    const now = Date.now();
    const resetInterval = 60000; // 1 minute

    // Reset counter if minute has passed
    if (now - (ws.lastMessageReset || 0) > resetInterval) {
      ws.messageCount = 0;
      ws.lastMessageReset = now;
    }

    ws.messageCount = (ws.messageCount || 0) + 1;

    return ws.messageCount <= MESSAGE_RATE_LIMIT;
  }

  /**
   * Handle WebSocket message
   */
  private async handleMessage(ws: AuthenticatedWebSocket, message: any) {
    switch (message.type) {
      case 'authenticate':
        await this.authenticateConnection(ws, message.token);
        break;

      case 'join_auction':
        await this.joinAuction(ws, message.productId);
        break;

      case 'leave_auction':
        this.leaveAuction(ws, message.productId);
        break;

      default:
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
          })
        );
    }
  }

  /**
   * Authenticate WebSocket connection
   */
  private async authenticateConnection(ws: AuthenticatedWebSocket, token: string) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, secret) as { sub: string };
      const userId = decoded.sub;

      // Check connection limit per user
      const userConnCount = this.userConnections.get(userId)?.size || 0;
      if (userConnCount >= CONNECTION_LIMIT_PER_USER) {
        throw new Error('Connection limit exceeded for user');
      }

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid or inactive user');
      }

      ws.userId = userId;

      // Track user connections
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(ws);

      ws.send(
        JSON.stringify({
          type: 'authenticated',
          userId,
          message: 'Successfully authenticated',
        })
      );

      logger.ws('Connection authenticated', { userId });
    } catch (error) {
      logger.error('WebSocket authentication failed', error);
      ws.send(
        JSON.stringify({
          type: 'auth_error',
          message: 'Authentication failed',
        })
      );
      ws.close();
    }
  }

  /**
   * Join auction room
   */
  private async joinAuction(ws: AuthenticatedWebSocket, productId: string) {
    if (!ws.userId) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Must authenticate first',
        })
      );
      return;
    }

    try {
      // Verify product exists and auction is active
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          title: true,
          auctionStatus: true,
          currentBid: true,
          bidCount: true,
          endTime: true,
        },
      });

      if (!product) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Product not found',
          })
        );
        return;
      }

      // Add connection to product room
      if (!this.productConnections.has(productId)) {
        this.productConnections.set(productId, new Set());
      }

      this.productConnections.get(productId)!.add(ws);
      ws.productId = productId;

      // Send current auction state
      ws.send(
        JSON.stringify({
          type: 'auction_joined',
          productId,
          product: {
            id: product.id,
            title: product.title,
            auctionStatus: product.auctionStatus,
            currentBid: product.currentBid?.toNumber() || 0,
            bidCount: product.bidCount || 0,
            endTime: product.endTime?.toISOString(),
          },
          message: `Joined auction for ${product.title}`,
        })
      );

      logger.ws('User joined auction', { userId: ws.userId, productId });
    } catch (error) {
      logger.error('Failed to join auction', error, {
        userId: ws.userId,
        productId,
      });
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Failed to join auction',
        })
      );
    }
  }

  /**
   * Leave auction room
   */
  private leaveAuction(ws: AuthenticatedWebSocket, productId: string) {
    const connections = this.productConnections.get(productId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.productConnections.delete(productId);
      }
    }

    ws.productId = undefined;
    ws.send(
      JSON.stringify({
        type: 'auction_left',
        productId,
        message: 'Left auction',
      })
    );

    logger.ws('User left auction', { userId: ws.userId, productId });
  }

  /**
   * Remove connection and cleanup
   */
  private removeConnection(ws: AuthenticatedWebSocket) {
    if (ws.productId) {
      this.leaveAuction(ws, ws.productId);
    }

    if (ws.userId) {
      const userConns = this.userConnections.get(ws.userId);
      if (userConns) {
        userConns.delete(ws);
        if (userConns.size === 0) {
          this.userConnections.delete(ws.userId);
        }
      }
    }
  }

  /**
   * Broadcast bid update to all clients in auction room
   */
  public broadcastBidUpdate(productId: string, bidUpdate: BidUpdate) {
    const connections = this.productConnections.get(productId);
    if (!connections) return;

    const message = JSON.stringify(bidUpdate);
    let sentCount = 0;

    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      } else {
        connections.delete(ws);
      }
    });

    logger.ws('Broadcast bid update', {
      productId,
      clientCount: sentCount,
    });
  }

  /**
   * Broadcast auction status changes
   */
  public broadcastAuctionStatus(productId: string, statusUpdate: AuctionStatus) {
    const connections = this.productConnections.get(productId);
    if (!connections) return;

    const message = JSON.stringify(statusUpdate);
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      } else {
        connections.delete(ws);
      }
    });

    logger.ws('Broadcast status update', {
      productId,
      status: statusUpdate.status,
      clientCount: connections.size,
    });
  }

  /**
   * Publish bid update to Redis for cross-instance broadcast
   */
  public async publishBidUpdate(bidUpdate: BidUpdate): Promise<void> {
    try {
      await redis.publish('bid-updates', JSON.stringify(bidUpdate));
    } catch (error) {
      logger.error('Failed to publish bid update to Redis', error);
    }
  }

  /**
   * Get connected users count for product
   */
  public getConnectedUsers(productId: string): number {
    return this.productConnections.get(productId)?.size || 0;
  }

  /**
   * Close server
   */
  public close() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
    logger.info('WebSocket server closed');
  }
}

// Create singleton instance
let biddingServer: BiddingWebSocketServer | null = null;

export function getBiddingServer(): BiddingWebSocketServer {
  if (!biddingServer) {
    const port = parseInt(process.env.WS_PORT || '8081');
    biddingServer = new BiddingWebSocketServer(port);
  }
  return biddingServer;
}

export type { BidUpdate, AuctionStatus, AuthenticatedWebSocket };
