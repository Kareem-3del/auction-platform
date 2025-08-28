import type { IncomingMessage } from 'http';

import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { WebSocket, WebSocketServer } from 'ws';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  productId?: string;
  isAlive?: boolean;
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

class BiddingWebSocketServer {
  private wss: WebSocketServer;
  private productConnections: Map<string, Set<AuthenticatedWebSocket>>;
  private heartbeatInterval: NodeJS.Timeout;

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ 
      port,
      verifyClient: this.verifyClient.bind(this)
    });
    this.productConnections = new Map();
    
    this.wss.on('connection', this.handleConnection.bind(this));
    console.log(`🔴 WebSocket bidding server started on port ${port}`);

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
    }, 30000); // 30 seconds
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    // Add any origin verification logic here if needed
    return true;
  }

  private handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage) {
    console.log('🔌 New WebSocket connection');
    
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
      this.removeConnection(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      this.removeConnection(ws);
    });
  }

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
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  private async authenticateConnection(ws: AuthenticatedWebSocket, token: string) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, secret) as { sub: string };
      ws.userId = decoded.sub;

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: ws.userId },
        select: { id: true, isActive: true }
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid or inactive user');
      }

      ws.send(JSON.stringify({
        type: 'authenticated',
        userId: ws.userId,
        message: 'Successfully authenticated'
      }));

      console.log(`✅ WebSocket authenticated for user: ${ws.userId}`);
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Authentication failed'
      }));
      ws.close();
    }
  }

  private async joinAuction(ws: AuthenticatedWebSocket, productId: string) {
    if (!ws.userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Must authenticate first'
      }));
      return;
    }

    // Verify product exists and auction is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        auctionStatus: true,
        currentBid: true,
        bidCount: true,
        endTime: true
      }
    });

    if (!product) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Product not found'
      }));
      return;
    }

    // Add connection to product room
    if (!this.productConnections.has(productId)) {
      this.productConnections.set(productId, new Set());
    }
    
    this.productConnections.get(productId)!.add(ws);
    ws.productId = productId;

    // Send current auction state
    ws.send(JSON.stringify({
      type: 'auction_joined',
      productId,
      product: {
        id: product.id,
        title: product.title,
        auctionStatus: product.auctionStatus,
        currentBid: product.currentBid?.toNumber() || 0,
        bidCount: product.bidCount || 0,
        endTime: product.endTime?.toISOString()
      },
      message: `Joined auction for ${product.title}`
    }));

    console.log(`🎯 User ${ws.userId} joined auction ${productId}`);
  }

  private leaveAuction(ws: AuthenticatedWebSocket, productId: string) {
    const connections = this.productConnections.get(productId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.productConnections.delete(productId);
      }
    }
    
    ws.productId = undefined;
    ws.send(JSON.stringify({
      type: 'auction_left',
      productId,
      message: 'Left auction'
    }));

    console.log(`🎯 User ${ws.userId} left auction ${productId}`);
  }

  private removeConnection(ws: AuthenticatedWebSocket) {
    if (ws.productId) {
      this.leaveAuction(ws, ws.productId);
    }
  }

  // Public method to broadcast bid updates
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

    console.log(`📡 Broadcast bid update to ${sentCount} clients for product ${productId}`);
  }

  // Public method to broadcast auction status changes
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

    console.log(`📡 Broadcast status update to ${connections.size} clients for product ${productId}`);
  }

  public getConnectedUsers(productId: string): number {
    return this.productConnections.get(productId)?.size || 0;
  }

  public close() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
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