import { NotificationService } from './notification-service';
import { AuctionSettlementService } from './auction-settlement';
import { prisma } from './prisma';

export class AuctionScheduler {
  private static intervals: Map<string, NodeJS.Timeout> = new Map();
  private static isRunning = false;

  /**
   * Start the auction scheduler
   */
  static async start() {
    if (this.isRunning) {
      console.log('⏰ Auction scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('⏰ Starting auction scheduler');

    // Run scheduler every 5 minutes
    const interval = setInterval(() => {
      this.checkAuctions();
    }, 5 * 60 * 1000); // 5 minutes

    this.intervals.set('main', interval);

    // Run initial check
    await this.checkAuctions();
  }

  /**
   * Stop the auction scheduler
   */
  static stop() {
    console.log('⏰ Stopping auction scheduler');
    
    this.intervals.forEach((interval, key) => {
      clearInterval(interval);
      this.intervals.delete(key);
    });

    this.isRunning = false;
  }

  /**
   * Check auctions for notifications
   */
  private static async checkAuctions() {
    try {
      console.log('🔍 Checking auctions for notifications...');
      
      const now = new Date();
      
      // Get auctions starting soon (within the next 24 hours)
      const startingSoon = await prisma.product.findMany({
        where: {
          auctionStatus: 'SCHEDULED',
          startTime: {
            gte: now,
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Next 24 hours
          }
        },
        include: {
          userFavorites: true
        }
      });

      // Get auctions ending soon (within the next 2 hours)
      const endingSoon = await prisma.product.findMany({
        where: {
          auctionStatus: 'LIVE',
          endTime: {
            gte: now,
            lte: new Date(now.getTime() + 2 * 60 * 60 * 1000) // Next 2 hours
          }
        }
      });

      // Get auctions that should have ended but status hasn't been updated
      const shouldHaveEnded = await prisma.product.findMany({
        where: {
          auctionStatus: 'LIVE',
          endTime: {
            lt: now
          }
        }
      });

      // Process starting soon notifications
      for (const product of startingSoon) {
        await this.processStartingReminder(product);
      }

      // Process ending soon notifications  
      for (const product of endingSoon) {
        await this.processEndingReminder(product);
      }

      // Process auctions that should have ended
      for (const product of shouldHaveEnded) {
        await this.processAuctionEnd(product);
      }

      // Check for negative balances and send reminders
      await AuctionSettlementService.checkNegativeBalances();

      console.log(`📊 Processed ${startingSoon.length} starting, ${endingSoon.length} ending, ${shouldHaveEnded.length} ended auctions`);
    } catch (error) {
      console.error('❌ Error checking auctions:', error);
    }
  }

  /**
   * Process auction starting reminders
   */
  private static async processStartingReminder(product: any) {
    try {
      const now = new Date();
      const startTime = new Date(product.startTime);
      const hoursUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Send reminders at specific intervals: 24h, 6h, 1h, 15min
      const reminderHours = [24, 6, 1];
      const reminderMinutes = [15];

      let shouldSendReminder = false;
      let reminderType = '';

      // Check if we should send hourly reminders
      if (reminderHours.includes(hoursUntilStart)) {
        shouldSendReminder = true;
        reminderType = `${hoursUntilStart}h`;
      }

      // Check for minute reminders (when less than 1 hour)
      if (hoursUntilStart === 0) {
        const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
        if (reminderMinutes.includes(minutesUntilStart)) {
          shouldSendReminder = true;
          reminderType = `${minutesUntilStart}min`;
        }
      }

      if (shouldSendReminder) {
        // Check if we already sent this reminder
        const existingReminder = await prisma.auctionReminder.findFirst({
          where: {
            productId: product.id,
            reminderType: 'STARTING',
            reminderTime: reminderType,
            sentAt: {
              gte: new Date(now.getTime() - 10 * 60 * 1000) // Within last 10 minutes
            }
          }
        });

        if (!existingReminder) {
          await NotificationService.sendAuctionStartReminder(product.id);
          
          // Record that we sent this reminder
          await prisma.auctionReminder.create({
            data: {
              productId: product.id,
              reminderType: 'STARTING',
              reminderTime: reminderType,
              sentAt: now
            }
          });
        }
      }
    } catch (error) {
      console.error(`Error processing starting reminder for ${product.id}:`, error);
    }
  }

  /**
   * Process auction ending reminders
   */
  private static async processEndingReminder(product: any) {
    try {
      const now = new Date();
      const endTime = new Date(product.endTime);
      const minutesUntilEnd = Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60));

      // Send reminders at: 2h, 30min, 10min, 2min
      const reminderMinutes = [120, 30, 10, 2];

      if (reminderMinutes.includes(minutesUntilEnd)) {
        // Check if we already sent this reminder
        const existingReminder = await prisma.auctionReminder.findFirst({
          where: {
            productId: product.id,
            reminderType: 'ENDING',
            reminderTime: `${minutesUntilEnd}min`,
            sentAt: {
              gte: new Date(now.getTime() - 10 * 60 * 1000) // Within last 10 minutes
            }
          }
        });

        if (!existingReminder) {
          await NotificationService.sendAuctionEndingReminder(product.id);
          
          // Record that we sent this reminder
          await prisma.auctionReminder.create({
            data: {
              productId: product.id,
              reminderType: 'ENDING',
              reminderTime: `${minutesUntilEnd}min`,
              sentAt: now
            }
          });
        }
      }
    } catch (error) {
      console.error(`Error processing ending reminder for ${product.id}:`, error);
    }
  }

  /**
   * Process auctions that have ended
   */
  private static async processAuctionEnd(product: any) {
    try {
      console.log(`🏁 Processing auction end for ${product.id}`);

      // Use the new settlement service for proper balance handling
      const settlementResult = await AuctionSettlementService.processAuctionEnd(product.id);

      if (!settlementResult.success) {
        console.error(`❌ Settlement failed for auction ${product.id}:`, settlementResult.errors);
        return;
      }

      if (settlementResult.winnerId) {
        console.log(`✅ Auction ${product.id} settled - Winner: ${settlementResult.winnerId}, Price: $${settlementResult.finalPrice}`);
        
        // Log balance update summary
        settlementResult.balanceUpdates.forEach(update => {
          console.log(`💰 Balance update for ${update.userId}: ${update.type} $${update.amount} - Status: ${update.status}`);
        });
      } else {
        console.log(`📝 Auction ${product.id} ended with no bids`);
      }
    } catch (error) {
      console.error(`Error processing auction end for ${product.id}:`, error);
    }
  }

  /**
   * Schedule a specific auction
   */
  static async scheduleAuction(productId: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product || !product.startTime || !product.endTime) {
        return;
      }

      const now = new Date();
      const startTime = new Date(product.startTime);
      const endTime = new Date(product.endTime);

      // Schedule start notification if auction hasn't started
      if (startTime > now && product.auctionStatus === 'SCHEDULED') {
        const timeUntilStart = startTime.getTime() - now.getTime();
        
        setTimeout(async () => {
          await prisma.product.update({
            where: { id: productId },
            data: { auctionStatus: 'LIVE' }
          });
          
          console.log(`🟢 Auction ${productId} started`);
        }, timeUntilStart);
      }

      // Schedule end processing if auction is live or will be live
      if (endTime > now) {
        const timeUntilEnd = endTime.getTime() - now.getTime();
        
        setTimeout(async () => {
          await this.processAuctionEnd(product);
        }, timeUntilEnd);
      }
    } catch (error) {
      console.error(`Error scheduling auction ${productId}:`, error);
    }
  }

  /**
   * Get scheduler status
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      activeIntervals: this.intervals.size
    };
  }
}

// Auto-start scheduler when module loads (in production)
if (process.env.NODE_ENV === 'production') {
  AuctionScheduler.start().catch(console.error);
}

export default AuctionScheduler;