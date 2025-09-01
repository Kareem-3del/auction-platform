import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Email service configuration
const createTransporter = () => {
  // Use different configurations based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else if (process.env.SENDGRID_API_KEY) {
      // SendGrid configuration
      return nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    }
  }
  
  // Development/fallback configuration
  return nodemailer.createTransporter({
    host: 'localhost',
    port: 1025, // MailHog port
    secure: false,
    ignoreTLS: true,
    auth: false,
  });
};

/**
 * Send email using configured transporter
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'Lebanon Auction <noreply@lebanon-auction.bdaya.tech>',
      to,
      subject,
      text,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${subject}`);
    console.log('Email result:', result.messageId);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    
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
export async function sendVerificationEmail({ to, name, token }: { 
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
  
  return sendEmail({ to, subject, text, html });
}