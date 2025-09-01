const { WebSocket, WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');

// Initialize Prisma client
const prisma = new PrismaClient();

class BiddingWebSocketServer {
  constructor(port = 8081, useSSL = false) {
    // Create HTTP/HTTPS server for notification endpoint
    this.app = express();
    this.useSSL = useSSL;
    
    if (useSSL) {
      // Load SSL certificates
      try {
        const sslOptions = {
          key: fs.readFileSync('/etc/letsencrypt/live/auction.lebanon-auction.bdaya.tech/privkey.pem'),
          cert: fs.readFileSync('/etc/letsencrypt/live/auction.lebanon-auction.bdaya.tech/fullchain.pem')
        };
        this.server = https.createServer(sslOptions, this.app);
        console.log('🔒 SSL certificates loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load SSL certificates:', error.message);
        console.log('🔄 Falling back to HTTP server');
        this.server = http.createServer(this.app);
        this.useSSL = false;
      }
    } else {
      this.server = http.createServer(this.app);
    }
    
    this.wss = new WebSocketServer({ 
      server: this.server,
      verifyClient: this.verifyClient.bind(this)
    });
    this.productConnections = new Map();
    this.userConnections = new Map(); // Track user connections for notifications
    
    // Setup express middleware
    this.app.use(express.json());
    this.setupNotificationEndpoint();
    
    this.wss.on('connection', this.handleConnection.bind(this));
    
    this.server.listen(port, '0.0.0.0', () => {
      const protocol = this.useSSL ? 'wss' : 'ws';
      const httpProtocol = this.useSSL ? 'https' : 'http';
      console.log(`🔴 WebSocket bidding server started on port ${port} (${protocol})`);
      console.log(`📡 Notification endpoint available at ${httpProtocol}://0.0.0.0:${port}/notify`);
    });

    // Setup heartbeat to detect broken connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          this.removeConnection(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  setupNotificationEndpoint() {
    // Endpoint for sending real-time notifications
    this.app.post('/notify', (req, res) => {
      const { userId, notification } = req.body;
      
      if (!userId || !notification) {
        return res.status(400).json({ error: 'Missing userId or notification data' });
      }

      this.sendNotificationToUser(userId, notification);
      res.json({ success: true });
    });

    // Endpoint for broadcasting bid updates and auction status
    this.app.post('/broadcast', (req, res) => {
      const { action, data } = req.body;
      
      console.log('📡 Broadcast request received:', { action, productId: data?.productId, timestamp: new Date().toISOString() });
      
      if (!action || !data) {
        console.error('❌ Missing action or data in broadcast request');
        return res.status(400).json({ error: 'Missing action or data' });
      }

      try {
        if (action === 'bid_update') {
          const connections = this.productConnections.get(data.productId);
          console.log(`🎯 Broadcasting bid update to product ${data.productId} - ${connections ? connections.size : 0} connections`);
          
          this.broadcastBidUpdate(data.productId, data);
          res.json({ success: true, message: `Broadcast bid update to product ${data.productId}` });
        } else if (action === 'auction_status') {
          this.broadcastAuctionStatus(data.productId, data);
          res.json({ success: true, message: `Broadcast auction status to product ${data.productId}` });
        } else {
          res.status(400).json({ error: 'Unknown action type' });
        }
      } catch (error) {
        console.error('❌ Broadcast error:', error);
        res.status(500).json({ error: 'Broadcast failed' });
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        connections: this.wss.clients.size,
        userConnections: this.userConnections.size,
        productConnections: this.productConnections.size
      });
    });
  }

  sendNotificationToUser(userId, notification) {
    const userConnections = this.userConnections.get(userId);
    if (userConnections && userConnections.size > 0) {
      const message = JSON.stringify({
        type: 'notification',
        data: notification
      });

      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });

      console.log(`📬 Notification sent to user ${userId}:`, notification.title);
    }
  }

  verifyClient(info) {
    // Add any origin verification logic here if needed
    return true;
  }

  handleConnection(ws, request) {
    console.log('🔌 New WebSocket connection');
    
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (data) => {
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

  async handleMessage(ws, message) {
    switch (message.type) {
      case 'authenticate':
        await this.authenticateConnection(ws, message.token);
        break;
        
      case 'join_auction':
        await this.joinAuction(ws, message.productId, message.anonymous);
        break;
        
      case 'leave_auction':
        this.leaveAuction(ws, message.productId);
        break;
        
      case 'internal_broadcast':
        // Handle internal broadcast messages from the API
        await this.handleInternalBroadcast(message);
        break;
        
      case 'ping':
        // Respond to client heartbeat
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
        
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  async authenticateConnection(ws, token) {
    try {
      const secret = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here';
      console.log(`🔐 JWT_SECRET: ${secret ? 'Set (' + secret.substring(0, 10) + '...)' : 'Not set'}`);
      console.log(`🎫 Token received: ${token.substring(0, 50)}...`);
      
      const decoded = jwt.verify(token, secret);
      ws.userId = decoded.sub;

      // Check real database
      const user = await prisma.user.findUnique({
        where: { id: ws.userId },
        select: { id: true, isActive: true }
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid or inactive user');
      }

      // Track user connection for notifications
      this.addUserConnection(ws.userId, ws);

      ws.send(JSON.stringify({
        type: 'authenticated',
        userId: ws.userId,
        message: 'Successfully authenticated'
      }));

      console.log(`✅ WebSocket authenticated for user: ${ws.userId}`);
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Authentication failed'
      }));
      ws.close();
    }
  }

  async joinAuction(ws, productId, anonymous = false) {
    // Allow anonymous users to join for read-only access
    if (!ws.userId && !anonymous) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Must authenticate first or join anonymously'
      }));
      return;
    }

    // Check real database
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
    
    this.productConnections.get(productId).add(ws);
    ws.productId = productId;

    // Send current auction state
    ws.send(JSON.stringify({
      type: 'auction_joined',
      productId,
      product: {
        id: product.id,
        title: product.title,
        auctionStatus: product.auctionStatus,
        currentBid: product.currentBid ? parseFloat(product.currentBid.toString()) : 0,
        bidCount: product.bidCount || 0,
        endTime: product.endTime ? product.endTime.toISOString() : null
      },
      message: `Joined auction for ${product.title}`
    }));

    // Mark as anonymous if not authenticated
    if (!ws.userId) {
      ws.isAnonymous = true;
      ws.userId = 'anonymous-' + Math.random().toString(36).substr(2, 9);
    }

    console.log(`🎯 User ${ws.userId}${ws.isAnonymous ? ' (anonymous)' : ''} joined auction ${productId}`);
  }

  leaveAuction(ws, productId) {
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

  removeConnection(ws) {
    if (ws.productId) {
      this.leaveAuction(ws, ws.productId);
    }
    if (ws.userId) {
      this.removeUserConnection(ws.userId, ws);
    }
  }

  addUserConnection(userId, ws) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId).add(ws);
    console.log(`👤 User ${userId} connected for notifications`);
  }

  removeUserConnection(userId, ws) {
    if (this.userConnections.has(userId)) {
      this.userConnections.get(userId).delete(ws);
      if (this.userConnections.get(userId).size === 0) {
        this.userConnections.delete(userId);
      }
      console.log(`👤 User ${userId} disconnected from notifications`);
    }
  }

  // Public method to broadcast bid updates
  broadcastBidUpdate(productId, bidUpdate) {
    const connections = this.productConnections.get(productId);
    if (!connections || connections.size === 0) {
      console.log(`📡 No connections found for product ${productId} - skipping broadcast`);
      return;
    }

    const message = JSON.stringify(bidUpdate);
    let sentCount = 0;
    let deadConnections = [];

    console.log(`📡 Broadcasting to ${connections.size} connections for product ${productId}:`);
    console.log(`   Bid data:`, { 
      amount: bidUpdate.currentBid, 
      bidder: bidUpdate.bid?.bidderName,
      type: bidUpdate.type 
    });

    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
        console.log(`   ✅ Sent to connection ${ws.userId || 'anonymous'}`);
      } else {
        console.log(`   ❌ Dead connection found: ${ws.userId || 'anonymous'}`);
        deadConnections.push(ws);
      }
    });

    // Clean up dead connections
    deadConnections.forEach(ws => connections.delete(ws));

    console.log(`📡 Successfully broadcast bid update to ${sentCount} connections for product ${productId}`);
  }

  // Public method to broadcast auction status changes
  broadcastAuctionStatus(productId, statusUpdate) {
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

  getConnectedUsers(productId) {
    return this.productConnections.get(productId)?.size || 0;
  }

  async handleInternalBroadcast(message) {
    try {
      if (message.action === 'bid_update') {
        this.broadcastBidUpdate(message.data.productId, message.data);
      } else if (message.action === 'auction_status') {
        this.broadcastAuctionStatus(message.data.productId, message.data);
      }
    } catch (error) {
      console.error('❌ Error handling internal broadcast:', error);
    }
  }

  close() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
    prisma.$disconnect();
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const port = parseInt(process.env.WS_PORT || '8081');
  const useSSL = process.env.WS_SSL === 'true';
  
  console.log('🔄 Starting WebSocket server...');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 SSL Enabled: ${useSSL}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Using test default'}`);
  
  const server = new BiddingWebSocketServer(port, useSSL);
  
  console.log('✅ WebSocket server started successfully!');
  const protocol = useSSL ? 'wss' : 'ws';
  console.log(`📡 WebSocket server running on ${protocol}://localhost:${port}`);
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

  // Export for testing
  module.exports = { BiddingWebSocketServer };
}

module.exports = { BiddingWebSocketServer };