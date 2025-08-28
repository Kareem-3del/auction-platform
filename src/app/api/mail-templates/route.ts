
import { z } from 'zod';
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse,
  validateContentType 
} from '@/lib/api-response';

const mailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  type: z.enum(['welcome', 'notification', 'reminder', 'marketing']),
  htmlContent: z.string().min(1, 'HTML content is required'),
  textContent: z.string().min(1, 'Text content is required'),
  isActive: z.boolean().default(true),
});

// GET /api/mail-templates - Get mail templates
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to view mail templates',
      });
    }

    // Mock mail templates - in production this would come from mail_templates table
    const templates = [
      {
        id: 'template-001',
        name: 'Welcome Email',
        subject: 'Welcome to Lebanese Auction Platform',
        description: 'Email sent to new users upon registration',
        type: 'welcome',
        isActive: true,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2196F3;">Welcome to Lebanese Auction Platform!</h1>
            <p>Dear {{firstName}},</p>
            <p>Thank you for joining our auction platform. We're excited to have you as part of our community.</p>
            <p>You can start browsing auctions and placing bids right away!</p>
            <a href="{{dashboardUrl}}" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Visit Dashboard
            </a>
            <p>Best regards,<br>The Lebanese Auction Team</p>
          </div>
        `,
        textContent: `Welcome to Lebanese Auction Platform!

Dear {{firstName}},

Thank you for joining our auction platform. We're excited to have you as part of our community.

You can start browsing auctions and placing bids right away!

Visit your dashboard: {{dashboardUrl}}

Best regards,
The Lebanese Auction Team`,
        variables: ['firstName', 'dashboardUrl'],
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
      },
      {
        id: 'template-002',
        name: 'Bid Confirmation',
        subject: 'Bid Placed Successfully - {{auctionTitle}}',
        description: 'Confirmation email when a user places a bid',
        type: 'notification',
        isActive: true,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4CAF50;">Bid Placed Successfully!</h1>
            <p>Dear {{firstName}},</p>
            <p>Your bid of <strong>{{bidAmount}}</strong> has been placed on:</p>
            <h2 style="color: #333;">{{auctionTitle}}</h2>
            <p>Auction ends: {{auctionEndTime}}</p>
            <p>We'll notify you if you're outbid or if you win the auction.</p>
            <a href="{{auctionUrl}}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Auction
            </a>
            <p>Good luck!<br>The Lebanese Auction Team</p>
          </div>
        `,
        textContent: `Bid Placed Successfully!

Dear {{firstName}},

Your bid of {{bidAmount}} has been placed on:

{{auctionTitle}}

Auction ends: {{auctionEndTime}}

We'll notify you if you're outbid or if you win the auction.

View auction: {{auctionUrl}}

Good luck!
The Lebanese Auction Team`,
        variables: ['firstName', 'bidAmount', 'auctionTitle', 'auctionEndTime', 'auctionUrl'],
        createdAt: '2024-01-10T09:30:00Z',
        updatedAt: '2024-01-12T16:45:00Z',
      },
      {
        id: 'template-003',
        name: 'Auction Ending Soon',
        subject: 'Auction Ending Soon - {{auctionTitle}}',
        description: 'Reminder email sent before auction ends',
        type: 'reminder',
        isActive: true,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #FF9800;">⏰ Auction Ending Soon!</h1>
            <p>Dear {{firstName}},</p>
            <p>The auction you're watching is ending in less than {{timeRemaining}}:</p>
            <h2 style="color: #333;">{{auctionTitle}}</h2>
            <p>Current bid: <strong>{{currentBid}}</strong></p>
            <p>Don't miss your chance to win this item!</p>
            <a href="{{auctionUrl}}" style="background: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Place Bid Now
            </a>
            <p>Hurry, time is running out!<br>The Lebanese Auction Team</p>
          </div>
        `,
        textContent: `⏰ Auction Ending Soon!

Dear {{firstName}},

The auction you're watching is ending in less than {{timeRemaining}}:

{{auctionTitle}}

Current bid: {{currentBid}}

Don't miss your chance to win this item!

Place bid now: {{auctionUrl}}

Hurry, time is running out!
The Lebanese Auction Team`,
        variables: ['firstName', 'timeRemaining', 'auctionTitle', 'currentBid', 'auctionUrl'],
        createdAt: '2024-01-11T11:15:00Z',
        updatedAt: '2024-01-14T09:20:00Z',
      },
      {
        id: 'template-004',
        name: 'KYC Approved',
        subject: 'Identity Verification Approved',
        description: 'Email sent when user KYC is approved',
        type: 'notification',
        isActive: false,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4CAF50;">✅ Identity Verification Approved</h1>
            <p>Dear {{firstName}},</p>
            <p>Great news! Your identity verification has been approved.</p>
            <p>You now have full access to all platform features including:</p>
            <ul>
              <li>Higher bidding limits</li>
              <li>Selling items</li>
              <li>Faster withdrawals</li>
            </ul>
            <a href="{{dashboardUrl}}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Access Dashboard
            </a>
            <p>Thank you for completing the verification process!<br>The Lebanese Auction Team</p>
          </div>
        `,
        textContent: `✅ Identity Verification Approved

Dear {{firstName}},

Great news! Your identity verification has been approved.

You now have full access to all platform features including:
- Higher bidding limits
- Selling items  
- Faster withdrawals

Access your dashboard: {{dashboardUrl}}

Thank you for completing the verification process!
The Lebanese Auction Team`,
        variables: ['firstName', 'dashboardUrl'],
        createdAt: '2024-01-12T15:30:00Z',
        updatedAt: '2024-01-13T10:45:00Z',
      }
    ];

    return successResponse({
      data: templates,
      message: 'Mail templates retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// POST /api/mail-templates - Create new mail template
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to create mail templates',
      });
    }

    const body = await request.json();
    const validatedData = mailTemplateSchema.parse(body);

    // Extract variables from template content
    const variables = extractVariables(validatedData.htmlContent, validatedData.textContent);

    const newTemplate = {
      id: `template-${Date.now()}`,
      ...validatedData,
      variables,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return successResponse({
      data: newTemplate,
      message: 'Mail template created successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Template validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}, { required: true });

// Helper function to extract variables from template content
function extractVariables(htmlContent: string, textContent: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  
  let match;
  while ((match = variableRegex.exec(htmlContent)) !== null) {
    variables.add(match[1]);
  }
  while ((match = variableRegex.exec(textContent)) !== null) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}