import { prisma } from './prisma';
import { sendEmail } from './email';
import { NotificationType, DeliveryMethod } from '@prisma/client';

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  data?: Record<string, any>;
  deliveryMethod?: DeliveryMethod;
}

export class NotificationService {
  /**
   * Create and send a notification
   */
  static async createNotification({
    userId,
    type,
    title,
    message,
    relatedId,
    relatedType,
    data = {},
    deliveryMethod = 'APP'
  }: NotificationData): Promise<void> {
    try {
      // Get user and their preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          notificationPreferences: true
        }
      });

      if (!user) {
        console.error('User not found for notification:', userId);
        return;
      }

      // Create the notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          notificationType: type,
          title,
          message,
          relatedId,
          relatedType,
          data: data as any,
          deliveryMethod,
          sentAt: new Date()
        }
      });

      // Check user preferences and send via different channels
      const preferences = user.notificationPreferences;
      
      // Send email notification if enabled
      if (this.shouldSendEmail(type, preferences)) {
        await this.sendEmailNotification(user, notification, data);
      }

      // Send real-time notification via WebSocket
      await this.sendRealtimeNotification(userId, {
        id: notification.id,
        type,
        title,
        message,
        data,
        createdAt: notification.createdAt,
        isRead: false
      });

      console.log(`Notification sent to user ${userId}:`, title);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * Send auction start reminder
   */
  static async sendAuctionStartReminder(productId: string): Promise<void> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          userFavorites: {
            include: {
              user: true
            }
          },
          category: true
        }
      });

      if (!product || !product.startTime) return;

      const timeUntilStart = new Date(product.startTime).getTime() - new Date().getTime();
      const hoursUntilStart = Math.floor(timeUntilStart / (1000 * 60 * 60));

      // Send to all users who favorited this product
      for (const favorite of product.userFavorites) {
        await this.createNotification({
          userId: favorite.userId,
          type: 'AUCTION_STARTING',
          title: 'Auction Starting Soon!',
          message: `The auction for "${product.title}" starts in ${hoursUntilStart} hours.`,
          relatedId: productId,
          relatedType: 'PRODUCT',
          data: {
            productId: product.id,
            productTitle: product.title,
            category: product.category.name,
            startTime: product.startTime,
            hoursUntilStart
          }
        });
      }
    } catch (error) {
      console.error('Error sending auction start reminder:', error);
    }
  }

  /**
   * Send auction ending reminder
   */
  static async sendAuctionEndingReminder(productId: string): Promise<void> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          bids: {
            include: {
              user: true
            },
            distinct: ['userId'],
            orderBy: {
              createdAt: 'desc'
            }
          },
          userFavorites: {
            include: {
              user: true
            }
          }
        }
      });

      if (!product || !product.endTime) return;

      const timeUntilEnd = new Date(product.endTime).getTime() - new Date().getTime();
      const minutesUntilEnd = Math.floor(timeUntilEnd / (1000 * 60));

      // Get unique users who have bid or favorited
      const interestedUsers = new Set([
        ...product.bids.map(bid => bid.user),
        ...product.userFavorites.map(fav => fav.user)
      ]);

      for (const user of interestedUsers) {
        await this.createNotification({
          userId: user.id,
          type: 'AUCTION_ENDING',
          title: 'Auction Ending Soon!',
          message: `The auction for "${product.title}" ends in ${minutesUntilEnd} minutes.`,
          relatedId: productId,
          relatedType: 'PRODUCT',
          data: {
            productId: product.id,
            productTitle: product.title,
            endTime: product.endTime,
            minutesUntilEnd,
            currentBid: product.currentBid
          }
        });
      }
    } catch (error) {
      console.error('Error sending auction ending reminder:', error);
    }
  }

  /**
   * Send bid placed notification
   */
  static async sendBidPlacedNotification(bidId: string): Promise<void> {
    try {
      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: {
          user: true,
          product: {
            include: {
              bids: {
                where: {
                  userId: { not: undefined }
                },
                include: { user: true },
                distinct: ['userId'],
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      });

      if (!bid) return;

      // Notify the bidder
      await this.createNotification({
        userId: bid.userId,
        type: 'BID_PLACED',
        title: 'Bid Placed Successfully',
        message: `Your bid of $${bid.amount} on "${bid.product.title}" has been placed.`,
        relatedId: bid.productId,
        relatedType: 'PRODUCT',
        data: {
          bidAmount: bid.amount,
          productTitle: bid.product.title,
          productId: bid.product.id
        }
      });

      // Notify previous bidders that they've been outbid
      const previousBidders = bid.product.bids
        .filter(b => b.userId !== bid.userId && b.amount < bid.amount)
        .slice(0, 5); // Limit to last 5 bidders

      for (const previousBid of previousBidders) {
        await this.createNotification({
          userId: previousBid.userId,
          type: 'BID_OUTBID',
          title: 'You\'ve Been Outbid!',
          message: `Your bid on "${bid.product.title}" has been outbid. Current bid: $${bid.amount}`,
          relatedId: bid.productId,
          relatedType: 'PRODUCT',
          data: {
            newBidAmount: bid.amount,
            yourBidAmount: previousBid.amount,
            productTitle: bid.product.title,
            productId: bid.product.id
          }
        });
      }
    } catch (error) {
      console.error('Error sending bid placed notification:', error);
    }
  }

  /**
   * Send auction won notification
   */
  static async sendAuctionWonNotification(productId: string): Promise<void> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          winner: true
        }
      });

      if (!product || !product.winner) return;

      await this.createNotification({
        userId: product.winner.id,
        type: 'AUCTION_WON',
        title: 'Congratulations! You Won!',
        message: `You won the auction for "${product.title}" with a bid of $${product.finalPrice}!`,
        relatedId: productId,
        relatedType: 'PRODUCT',
        data: {
          productTitle: product.title,
          winningBid: product.finalPrice,
          productId: product.id
        }
      });
    } catch (error) {
      console.error('Error sending auction won notification:', error);
    }
  }

  /**
   * Send account change notifications
   */
  static async sendAccountChangeNotification(
    userId: string, 
    changeType: string, 
    details: Record<string, any>
  ): Promise<void> {
    try {
      let title = '';
      let message = '';

      switch (changeType) {
        case 'PASSWORD_CHANGED':
          title = 'Password Changed';
          message = 'Your account password has been successfully changed.';
          break;
        case 'EMAIL_CHANGED':
          title = 'Email Address Updated';
          message = `Your email address has been changed to ${details.newEmail}.`;
          break;
        case 'PROFILE_UPDATED':
          title = 'Profile Updated';
          message = 'Your profile information has been successfully updated.';
          break;
        case 'KYC_STATUS_CHANGED':
          title = 'KYC Status Updated';
          message = `Your KYC verification status has been updated to ${details.status}.`;
          break;
        case 'ACCOUNT_SUSPENDED':
          title = 'Account Suspended';
          message = 'Your account has been suspended. Please contact support for assistance.';
          break;
        case 'ACCOUNT_REACTIVATED':
          title = 'Account Reactivated';
          message = 'Your account has been successfully reactivated.';
          break;
        case 'BALANCE_UPDATED':
          title = 'Balance Updated';
          message = `Your account balance has been updated. New balance: $${details.newBalance}`;
          break;
        case 'NEGATIVE_BALANCE_WARNING':
          title = '⚠️ Negative Balance Warning';
          message = `Your account balance is negative: -$${Math.abs(details.negativeAmount).toFixed(2)}. Please add funds immediately.`;
          break;
        case 'PAYMENT_DUE':
          title = '💳 Payment Due';
          message = `You have a payment due of $${details.amount} for "${details.productTitle}". Please settle this amount.`;
          break;
        default:
          title = 'Account Updated';
          message = 'Your account information has been updated.';
      }

      await this.createNotification({
        userId,
        type: 'ACCOUNT_UPDATE',
        title,
        message,
        data: {
          changeType,
          ...details,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error sending account change notification:', error);
    }
  }

  /**
   * Send payment notifications
   */
  static async sendPaymentNotification(
    userId: string,
    paymentType: 'RECEIVED' | 'FAILED' | 'REFUNDED',
    amount: number,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      let title = '';
      let message = '';
      let type: NotificationType = 'PAYMENT_RECEIVED';

      switch (paymentType) {
        case 'RECEIVED':
          title = 'Payment Received';
          message = `Payment of $${amount} has been successfully processed.`;
          type = 'PAYMENT_RECEIVED';
          break;
        case 'FAILED':
          title = 'Payment Failed';
          message = `Payment of $${amount} could not be processed. Please try again.`;
          type = 'PAYMENT_FAILED';
          break;
        case 'REFUNDED':
          title = 'Payment Refunded';
          message = `Refund of $${amount} has been processed to your account.`;
          type = 'PAYMENT_RECEIVED';
          break;
      }

      await this.createNotification({
        userId,
        type,
        title,
        message,
        data: {
          amount,
          paymentType,
          ...details
        }
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }

  /**
   * Check if email should be sent based on user preferences
   */
  private static shouldSendEmail(
    type: NotificationType,
    preferences: any
  ): boolean {
    if (!preferences) return true; // Default to sending if no preferences set

    switch (type) {
      case 'BID_PLACED':
        return preferences.emailBidPlaced;
      case 'BID_OUTBID':
        return preferences.emailBidOutbid;
      case 'AUCTION_ENDING':
        return preferences.emailAuctionEnding;
      case 'AUCTION_WON':
        return preferences.emailAuctionWon;
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_FAILED':
        return preferences.emailPayments;
      default:
        return true;
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    user: any,
    notification: any,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const emailTemplate = this.getEmailTemplate(notification.notificationType, data);
      
      await sendEmail({
        to: user.email,
        subject: notification.title,
        html: emailTemplate.html,
        text: emailTemplate.text
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  /**
   * Send real-time notification via WebSocket
   */
  private static async sendRealtimeNotification(
    userId: string,
    notification: any
  ): Promise<void> {
    try {
      // Send notification to WebSocket server
      const wsServerUrl = process.env.WS_SERVER_URL || 'http://localhost:8081';
      const response = await fetch(`${wsServerUrl}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          notification
        })
      });

      if (!response.ok) {
        console.error('Failed to send real-time notification');
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  /**
   * Get email template for notification type
   */
  private static getEmailTemplate(type: NotificationType, data: Record<string, any>) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://auction.lebanon-auction.bdaya.tech';
    
    switch (type) {
      case 'BID_PLACED':
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #CE0E2D;">Bid Placed Successfully!</h2>
              <p>Your bid of <strong>$${data.bidAmount}</strong> on "<strong>${data.productTitle}</strong>" has been placed successfully.</p>
              <p><a href="${baseUrl}/products/${data.productId}" style="background: #CE0E2D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Auction</a></p>
              <p>Good luck with your bid!</p>
              <hr>
              <p style="color: #666; font-size: 12px;">Lebanon Auction - Premier Online Auction House</p>
            </div>
          `,
          text: `Bid Placed Successfully!\n\nYour bid of $${data.bidAmount} on "${data.productTitle}" has been placed successfully.\n\nView auction: ${baseUrl}/products/${data.productId}\n\nGood luck with your bid!`
        };
      
      case 'BID_OUTBID':
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #CE0E2D;">You've Been Outbid!</h2>
              <p>Your bid of <strong>$${data.yourBidAmount}</strong> on "<strong>${data.productTitle}</strong>" has been outbid.</p>
              <p>Current highest bid: <strong>$${data.newBidAmount}</strong></p>
              <p><a href="${baseUrl}/products/${data.productId}" style="background: #CE0E2D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Place New Bid</a></p>
              <hr>
              <p style="color: #666; font-size: 12px;">Lebanon Auction - Premier Online Auction House</p>
            </div>
          `,
          text: `You've Been Outbid!\n\nYour bid of $${data.yourBidAmount} on "${data.productTitle}" has been outbid.\n\nCurrent highest bid: $${data.newBidAmount}\n\nPlace new bid: ${baseUrl}/products/${data.productId}`
        };
      
      case 'AUCTION_ENDING':
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #CE0E2D;">Auction Ending Soon!</h2>
              <p>The auction for "<strong>${data.productTitle}</strong>" is ending in ${data.minutesUntilEnd} minutes.</p>
              <p>Current bid: <strong>$${data.currentBid}</strong></p>
              <p><a href="${baseUrl}/products/${data.productId}" style="background: #CE0E2D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Auction</a></p>
              <p>Don't miss out on this opportunity!</p>
              <hr>
              <p style="color: #666; font-size: 12px;">Lebanon Auction - Premier Online Auction House</p>
            </div>
          `,
          text: `Auction Ending Soon!\n\nThe auction for "${data.productTitle}" is ending in ${data.minutesUntilEnd} minutes.\n\nCurrent bid: $${data.currentBid}\n\nJoin auction: ${baseUrl}/products/${data.productId}`
        };
      
      case 'AUCTION_WON':
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">Congratulations! You Won!</h2>
              <p>You won the auction for "<strong>${data.productTitle}</strong>" with a winning bid of <strong>$${data.winningBid || data.finalPrice}</strong>!</p>
              ${data.newBalance >= 0 ? 
                `<p style="color: #4CAF50;">✅ Payment of $${data.winningBid || data.finalPrice} has been successfully deducted from your account.</p>
                 <p>New balance: <strong>$${data.newBalance}</strong></p>` :
                `<p style="color: #f44336;">⚠️ Your account balance is insufficient. Amount due: <strong>$${Math.abs(data.newBalance)}</strong></p>
                 <p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                   <strong>Action Required:</strong> Please add funds to your account to cover the negative balance.
                 </p>`
              }
              <p><a href="${baseUrl}/products/${data.productId}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>
              <p>We will contact you soon regarding delivery arrangements.</p>
              <hr>
              <p style="color: #666; font-size: 12px;">Lebanon Auction - Premier Online Auction House</p>
            </div>
          `,
          text: `Congratulations! You Won!\n\nYou won the auction for "${data.productTitle}" with a winning bid of $${data.winningBid || data.finalPrice}!\n\n${data.newBalance >= 0 ? 
            `Payment has been deducted. New balance: $${data.newBalance}` : 
            `WARNING: Insufficient balance. Amount due: $${Math.abs(data.newBalance)}`}\n\nView details: ${baseUrl}/products/${data.productId}`
        };

      case 'BID_REFUNDED':
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">💰 Bid Refunded</h2>
              <p>Your bid of <strong>$${data.bidAmount}</strong> for "<strong>${data.productTitle}</strong>" has been refunded to your account.</p>
              <p>New balance: <strong>$${data.newRealBalance}</strong></p>
              <p><a href="${baseUrl}/wallet" style="background: #CE0E2D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Wallet</a></p>
              <p>Thank you for participating in our auction!</p>
              <hr>
              <p style="color: #666; font-size: 12px;">Lebanon Auction - Premier Online Auction House</p>
            </div>
          `,
          text: `Bid Refunded\n\nYour bid of $${data.bidAmount} for "${data.productTitle}" has been refunded.\n\nNew balance: $${data.newRealBalance}\n\nView wallet: ${baseUrl}/wallet`
        };

      case 'PAYMENT_REQUIRED':
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f44336;">🔴 Payment Required - Urgent</h2>
              <div style="background: #ffebee; padding: 20px; border-radius: 5px; border-left: 4px solid #f44336; margin: 20px 0;">
                <p><strong>Your account has a negative balance of -$${data.negativeAmount}</strong></p>
                ${data.productTitle ? `<p>This is due to winning the auction for "${data.productTitle}"</p>` : ''}
              </div>
              <p><strong>Action Required:</strong> Please add funds to your account immediately to cover this amount.</p>
              <p><a href="${baseUrl}/wallet" style="background: #f44336; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Add Funds Now</a></p>
              <p style="color: #666;">If you don't add funds within 48 hours, your account may be suspended.</p>
              <hr>
              <p style="color: #666; font-size: 12px;">Lebanon Auction - Premier Online Auction House</p>
            </div>
          `,
          text: `PAYMENT REQUIRED - URGENT\n\nYour account has a negative balance of -$${data.negativeAmount}${data.productTitle ? ` due to winning "${data.productTitle}"` : ''}.\n\nPlease add funds immediately: ${baseUrl}/wallet`
        };
      
      default:
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #CE0E2D;">Lebanon Auction Notification</h2>
              <p>${data.message || 'You have a new notification from Lebanon Auction.'}</p>
              <p><a href="${baseUrl}" style="background: #CE0E2D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit Lebanon Auction</a></p>
              <hr>
              <p style="color: #666; font-size: 12px;">Lebanon Auction - Premier Online Auction House</p>
            </div>
          `,
          text: `Lebanon Auction Notification\n\n${data.message || 'You have a new notification from Lebanon Auction.'}\n\nVisit: ${baseUrl}`
        };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false
  ) {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = { userId };
      if (unreadOnly) {
        where.isRead = false;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({ where })
      ]);

      return {
        notifications,
        total,
        hasMore: skip + notifications.length < total
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { notifications: [], total: 0, hasMore: false };
    }
  }
}