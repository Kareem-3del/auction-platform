/**
 * Email Service - Production-Ready with Queue Support
 * Uses email queue for reliable delivery with retry logic
 */

import { sendEmail as queueEmail, sendPriorityEmail } from './email-queue';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  priority?: boolean;
}

/**
 * Send email using queue system
 */
export async function sendEmail({ to, subject, text, html, priority = false }: EmailOptions): Promise<boolean> {
  try {
    if (priority) {
      await sendPriorityEmail({ to, subject, text, html });
    } else {
      await queueEmail({ to, subject, text, html });
    }

    logger.email('Email queued successfully', to, { subject });
    return true;
  } catch (error) {
    logger.error('Failed to queue email', error, { to, subject });

    // Don't throw error in production - log and continue
    if (process.env.NODE_ENV === 'production') {
      return false;
    }

    throw error;
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://auction.lebanon-auction.bdaya.tech';
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(to)}`;

  const subject = 'Verify Your Email Address - Lebanon Auction';
  const text = `
Hello ${name},

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with Lebanon Auction, please ignore this email.

Best regards,
Lebanon Auction Team
  `.trim();

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #CE0E2D; margin: 0;">Lebanon Auction</h1>
          </div>

          <h2>Verify Your Email Address</h2>

          <p>Hello ${name},</p>

          <p>Thank you for joining Lebanon Auction! Please verify your email address to complete your registration.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #CE0E2D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>

          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; word-break: break-all;">
            ${verificationUrl}
          </p>

          <p><small>This link will expire in 24 hours for security reasons.</small></p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

          <p><small>If you didn't create an account with Lebanon Auction, please ignore this email.</small></p>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Lebanon Auction Team
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, text, html, priority: true });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://auction.lebanon-auction.bdaya.tech';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  const subject = 'Reset Your Password - Lebanon Auction';
  const text = `
Hello ${name},

We received a request to reset your password. Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
Lebanon Auction Team
  `.trim();

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #CE0E2D; margin: 0;">Lebanon Auction</h1>
          </div>

          <h2>Reset Your Password</h2>

          <p>Hello ${name},</p>

          <p>We received a request to reset your password. Click the button below to create a new password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #CE0E2D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; word-break: break-all;">
            ${resetUrl}
          </p>

          <p><small>This link will expire in 1 hour for security reasons.</small></p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

          <p><small>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</small></p>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Lebanon Auction Team
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, text, html, priority: true });
}

/**
 * Send bid notification email
 */
export async function sendBidNotification({
  to,
  name,
  productTitle,
  bidAmount,
  productUrl,
}: {
  to: string;
  name: string;
  productTitle: string;
  bidAmount: number;
  productUrl: string;
}): Promise<boolean> {
  const subject = `You've been outbid on ${productTitle} - Lebanon Auction`;
  const text = `
Hello ${name},

Someone has placed a higher bid on "${productTitle}".

Current bid: $${bidAmount.toFixed(2)}

Don't miss out! Visit the auction page to place your next bid:
${productUrl}

Best regards,
Lebanon Auction Team
  `.trim();

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #CE0E2D; margin: 0;">Lebanon Auction</h1>
          </div>

          <h2>You've Been Outbid!</h2>

          <p>Hello ${name},</p>

          <p>Someone has placed a higher bid on <strong>"${productTitle}"</strong>.</p>

          <p style="font-size: 24px; text-align: center; color: #CE0E2D; margin: 20px 0;">
            Current Bid: $${bidAmount.toFixed(2)}
          </p>

          <p>Don't miss out on this item!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${productUrl}"
               style="background-color: #CE0E2D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Auction
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Lebanon Auction Team
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, text, html });
}

/**
 * Send auction won notification
 */
export async function sendAuctionWonNotification({
  to,
  name,
  productTitle,
  winningBid,
  productUrl,
}: {
  to: string;
  name: string;
  productTitle: string;
  winningBid: number;
  productUrl: string;
}): Promise<boolean> {
  const subject = `Congratulations! You won "${productTitle}" - Lebanon Auction`;
  const text = `
Hello ${name},

Congratulations! You have won the auction for "${productTitle}".

Your winning bid: $${winningBid.toFixed(2)}

View your purchase:
${productUrl}

Our team will contact you shortly with payment and delivery details.

Best regards,
Lebanon Auction Team
  `.trim();

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #CE0E2D; margin: 0;">Lebanon Auction</h1>
          </div>

          <h2 style="color: #28a745;">Congratulations! 🎉</h2>

          <p>Hello ${name},</p>

          <p>You have won the auction for <strong>"${productTitle}"</strong>!</p>

          <p style="font-size: 24px; text-align: center; color: #28a745; margin: 20px 0;">
            Winning Bid: $${winningBid.toFixed(2)}
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${productUrl}"
               style="background-color: #CE0E2D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Your Purchase
            </a>
          </div>

          <p>Our team will contact you shortly with payment and delivery details.</p>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Lebanon Auction Team
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, text, html, priority: true });
}
