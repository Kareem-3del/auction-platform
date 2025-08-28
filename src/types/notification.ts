export interface Notification {
  id: string;
  userId: string;
  relatedId?: string;
  relatedType?: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  deliveryMethod: DeliveryMethod;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum NotificationType {
  BID_OUTBID = 'BID_OUTBID',
  BID_WON = 'BID_WON',
  AUCTION_ENDING = 'AUCTION_ENDING',
  AUCTION_STARTED = 'AUCTION_STARTED',
  AUCTION_CANCELLED = 'AUCTION_CANCELLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYOUT_PROCESSED = 'PAYOUT_PROCESSED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  AGENT_APPROVED = 'AGENT_APPROVED',
  SYSTEM = 'SYSTEM',
}

export enum DeliveryMethod {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export interface NotificationPreferences {
  notificationSoundEnabled: boolean;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  playNotificationSound: () => void;
}

export interface CreateNotificationData {
  userId: string;
  relatedId?: string;
  relatedType?: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  data?: any;
  deliveryMethod?: DeliveryMethod;
}