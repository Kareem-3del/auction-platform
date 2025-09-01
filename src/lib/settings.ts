/**
 * Settings utility functions
 * Provides access to system settings and configuration values
 */

// Default settings structure
const DEFAULT_SETTINGS = {
  general: {
    siteName: 'Lebanese Auction Platform',
    siteDescription: 'Premier auction platform for Lebanon',
    supportEmail: 'support@lebauction.com',
    maintenanceMode: false,
    registrationEnabled: true,
  },
  auction: {
    defaultAuctionDuration: 7,
    minBidIncrement: 1,
    maxBidIncrement: 1000,
    extendAuctionTime: 5,
    enableAutoBid: true,
  },
  payment: {
    enableBinance: true,
    enableWishMoney: true,
    enablePaypal: false,
    enableStripe: false,
    enableCrypto: false,
    paymentFeePercentage: 2.5,
    minimumWithdrawal: 10,
    virtualBalanceMultiplier: 1.0,
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@lebauction.com',
    smtpPassword: '********',
    fromEmail: 'noreply@lebauction.com',
    fromName: 'Lebanese Auction Platform',
    enableEmailNotifications: true,
  },
};

export interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  auction: {
    defaultAuctionDuration: number;
    minBidIncrement: number;
    maxBidIncrement: number;
    extendAuctionTime: number;
    enableAutoBid: boolean;
  };
  payment: {
    enableBinance: boolean;
    enableWishMoney: boolean;
    enablePaypal: boolean;
    enableStripe: boolean;
    enableCrypto: boolean;
    paymentFeePercentage: number;
    minimumWithdrawal: number;
    virtualBalanceMultiplier: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableEmailNotifications: boolean;
  };
}

/**
 * Get system settings
 * In production, this would fetch from a settings database table
 * For now, returns default mock settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  // TODO: In production, fetch from database
  // const settings = await prisma.setting.findFirst({
  //   where: { key: 'system' },
  // });
  // 
  // if (settings?.value) {
  //   return { ...DEFAULT_SETTINGS, ...JSON.parse(settings.value) };
  // }
  
  return DEFAULT_SETTINGS;
}

/**
 * Get virtual balance multiplier from settings
 * This is used to calculate virtual balance when users recharge
 */
export async function getVirtualBalanceMultiplier(): Promise<number> {
  const settings = await getSystemSettings();
  return settings.payment.virtualBalanceMultiplier;
}

/**
 * Get payment settings
 */
export async function getPaymentSettings() {
  const settings = await getSystemSettings();
  return settings.payment;
}

/**
 * Check if a payment method is enabled
 */
export async function isPaymentMethodEnabled(method: 'binance' | 'whish' | 'paypal' | 'stripe' | 'crypto'): Promise<boolean> {
  const settings = await getSystemSettings();
  
  switch (method) {
    case 'binance':
      return settings.payment.enableBinance;
    case 'whish':
      return settings.payment.enableWishMoney;
    case 'paypal':
      return settings.payment.enablePaypal;
    case 'stripe':
      return settings.payment.enableStripe;
    case 'crypto':
      return settings.payment.enableCrypto;
    default:
      return false;
  }
}

/**
 * Get auction settings
 */
export async function getAuctionSettings() {
  const settings = await getSystemSettings();
  return settings.auction;
}

/**
 * Get email settings
 */
export async function getEmailSettings() {
  const settings = await getSystemSettings();
  return settings.email;
}

/**
 * Get general settings
 */
export async function getGeneralSettings() {
  const settings = await getSystemSettings();
  return settings.general;
}