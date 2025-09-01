// Production WebSocket client for broadcasting bid updates
import WebSocket from 'ws';

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

class ProductionWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;

  constructor(private wsUrl: string = process.env.NODE_ENV === 'production' ? 'ws://localhost:8081' : 'ws://localhost:8081') {
    this.connect();
  }

  private connect() {
    if (this.isReconnecting) return;
    
    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.on('open', () => {
        console.log('📡 Production WebSocket client connected to server');
        this.isReconnecting = false;
      });

      this.ws.on('error', (error) => {
        console.error('❌ Production WebSocket client error:', error);
        this.scheduleReconnect();
      });

      this.ws.on('close', () => {
        console.log('🔌 Production WebSocket client disconnected');
        this.scheduleReconnect();
      });
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.reconnectTimeout = setTimeout(() => {
      console.log('🔄 Attempting to reconnect WebSocket client...');
      this.connect();
    }, 5000);
  }

  public broadcastBidUpdate(bidUpdate: BidUpdate) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        // Send a special internal broadcast message
        this.ws.send(JSON.stringify({
          type: 'internal_broadcast',
          action: 'bid_update',
          data: bidUpdate
        }));
        console.log(`📡 Sent bid update broadcast for product ${bidUpdate.productId}`);
      } catch (error) {
        console.error('❌ Failed to broadcast bid update:', error);
      }
    } else {
      console.warn('⚠️ WebSocket not connected, cannot broadcast bid update');
    }
  }

  public broadcastAuctionStatus(statusUpdate: AuctionStatus) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'internal_broadcast',
          action: 'auction_status',
          data: statusUpdate
        }));
        console.log(`📡 Sent status update broadcast for product ${statusUpdate.productId}`);
      } catch (error) {
        console.error('❌ Failed to broadcast auction status:', error);
      }
    } else {
      console.warn('⚠️ WebSocket not connected, cannot broadcast auction status');
    }
  }

  public close() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close();
  }
}

// Create singleton instance for production
let productionClient: ProductionWebSocketClient | null = null;

export function getProductionWebSocketClient(): ProductionWebSocketClient {
  if (!productionClient) {
    productionClient = new ProductionWebSocketClient();
  }
  return productionClient;
}

export type { BidUpdate, AuctionStatus };