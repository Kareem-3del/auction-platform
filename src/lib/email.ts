interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface VerificationEmailOptions {
  to: string;
  name: string;
  token: string;
}

interface PasswordResetEmailOptions {
  to: string;
  name: string;
  token: string;
}

interface WelcomeEmailOptions {
  to: string;
  name: string;
}

// Email service configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@auction.com',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:8083'),
};

// Mock email sending for development
// In production, replace this with actual email service (SendGrid, AWS SES, etc.)
async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`HTML: ${options.html}`);
    
    // In development, just log the email
    return Promise.resolve();
  }

  // Production email sending logic would go here
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: options.to,
    from: EMAIL_CONFIG.from,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };
  
  await sgMail.send(msg);
  */
  
  throw new Error('Email service not configured for production');
}

export async function sendVerificationEmail(options: VerificationEmailOptions): Promise<void> {
  const verificationUrl = `${EMAIL_CONFIG.baseUrl}/auth/verify-email?token=${options.token}&email=${encodeURIComponent(options.to)}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Auction Platform</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎯 Auction Platform</h1>
        <h2>Verify Your Email Address</h2>
      </div>
      
      <div class="content">
        <p>Hi ${options.name},</p>
        
        <p>Thank you for joining our auction platform! To complete your registration and start bidding on exciting items, please verify your email address.</p>
        
        <p style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </p>
        
        <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
          ${verificationUrl}
        </p>
        
        <div class="warning">
          <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
        </div>
        
        <p>Once your email is verified, you'll be able to:</p>
        <ul>
          <li>✅ Participate in live auctions</li>
          <li>✅ Place bids on items</li>
          <li>✅ Manage your profile and settings</li>
          <li>✅ Receive important auction notifications</li>
        </ul>
        
        <p>If you have any questions, our support team is here to help.</p>
        
        <p>Welcome to the auction community!</p>
        <p><strong>The Auction Platform Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${options.to}</p>
        <p>© 2024 Auction Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${options.name},
    
    Thank you for joining our auction platform! To complete your registration, please verify your email address by clicking the link below:
    
    ${verificationUrl}
    
    This link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
    
    Welcome to the auction community!
    The Auction Platform Team
  `;

  await sendEmail({
    to: options.to,
    subject: 'Verify Your Email Address - Auction Platform',
    html,
    text,
  });
}

export async function sendPasswordResetEmail(options: PasswordResetEmailOptions): Promise<void> {
  const resetUrl = `${EMAIL_CONFIG.baseUrl}/auth/reset-password?token=${options.token}&email=${encodeURIComponent(options.to)}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Auction Platform</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #fd7e14 0%, #e63946 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #e63946;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
        .warning {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Auction Platform</h1>
        <h2>Reset Your Password</h2>
      </div>
      
      <div class="content">
        <p>Hi ${options.name},</p>
        
        <p>We received a request to reset the password for your auction platform account. If you made this request, click the button below to reset your password:</p>
        
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        
        <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
          ${resetUrl}
        </p>
        
        <div class="warning">
          <strong>🚨 Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        </div>
        
        <p>For your security:</p>
        <ul>
          <li>🔒 Never share this reset link with anyone</li>
          <li>🔒 Choose a strong, unique password</li>
          <li>🔒 Consider enabling two-factor authentication</li>
        </ul>
        
        <p>If you continue to have problems, please contact our support team.</p>
        
        <p>Best regards,</p>
        <p><strong>The Auction Platform Security Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${options.to}</p>
        <p>© 2024 Auction Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${options.name},
    
    We received a request to reset the password for your auction platform account. If you made this request, use the link below to reset your password:
    
    ${resetUrl}
    
    This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
    
    Best regards,
    The Auction Platform Security Team
  `;

  await sendEmail({
    to: options.to,
    subject: 'Reset Your Password - Auction Platform',
    html,
    text,
  });
}

export async function sendWelcomeEmail(options: WelcomeEmailOptions): Promise<void> {
  const loginUrl = `${EMAIL_CONFIG.baseUrl}/auth/login`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Auction Platform</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #28a745;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .feature-list {
          background: white;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎯 Welcome to Auction Platform!</h1>
        <h2>Your account is ready!</h2>
      </div>
      
      <div class="content">
        <p>Hi ${options.name},</p>
        
        <p>🎉 Congratulations! Your email has been verified and your auction account is now active. You're ready to start your bidding journey!</p>
        
        <p style="text-align: center;">
          <a href="${loginUrl}" class="button">Start Bidding Now</a>
        </p>
        
        <div class="feature-list">
          <h3>🚀 What you can do now:</h3>
          <ul>
            <li>🔍 <strong>Browse Auctions:</strong> Discover amazing items from trusted sellers</li>
            <li>🏆 <strong>Place Bids:</strong> Compete for items you love with our real-time bidding</li>
            <li>❤️ <strong>Create Watchlists:</strong> Keep track of items you're interested in</li>
            <li>💰 <strong>Manage Your Wallet:</strong> Add funds and track your spending</li>
            <li>🔔 <strong>Get Notifications:</strong> Stay updated on auction activity</li>
            <li>🎭 <strong>Anonymous Bidding:</strong> Bid privately if you prefer</li>
          </ul>
        </div>
        
        <div class="feature-list">
          <h3>💡 Pro Tips for Success:</h3>
          <ul>
            <li>Set a budget before you start bidding</li>
            <li>Watch items for a few days to understand pricing patterns</li>
            <li>Read item descriptions and condition reports carefully</li>
            <li>Check seller ratings and reviews</li>
            <li>Bid in the final minutes for the best chance of winning</li>
          </ul>
        </div>
        
        <p>Need help getting started? Our support team is available 24/7 to assist you with any questions.</p>
        
        <p>Happy bidding!</p>
        <p><strong>The Auction Platform Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${options.to}</p>
        <p>© 2024 Auction Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${options.name},
    
    Welcome to Auction Platform! Your email has been verified and your account is now active.
    
    You can now:
    - Browse and bid on auctions
    - Create watchlists
    - Manage your wallet
    - Get notifications
    
    Start bidding now: ${loginUrl}
    
    Happy bidding!
    The Auction Platform Team
  `;

  await sendEmail({
    to: options.to,
    subject: '🎉 Welcome to Auction Platform - Your Account is Ready!',
    html,
    text,
  });
}

// Utility function to send notification emails
export async function sendNotificationEmail(to: string, subject: string, message: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔔 Auction Platform</h1>
        <h2>${subject}</h2>
      </div>
      <div class="content">
        ${message}
      </div>
      <div class="footer">
        <p>© 2024 Auction Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to,
    subject,
    html,
    text: message.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  });
}