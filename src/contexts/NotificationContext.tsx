'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from 'src/hooks/useAuth';
import { getClientEnv } from 'src/lib/env';
import NotificationToast, { useNotificationToast } from 'src/components/notifications/NotificationToast';

interface NotificationContextType {
  addToast: (notification: any) => void;
  clearAllToasts: () => void;
  notifications: any[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const { toasts, addToast, removeToast, clearAll } = useNotificationToast();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user || loading) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Fetch from notifications API
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setNotifications(result.data);
        } else if (result.notifications && Array.isArray(result.notifications)) {
          setNotifications(result.notifications);
        } else {
          setNotifications([]);
        }
      } else {
        console.log('Failed to fetch notifications:', response.status);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`/api/v1/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== id)
        );
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      connectWebSocket();
    } else {
      disconnectWebSocket();
      setNotifications([]);
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user]);

  const connectWebSocket = () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const { WS_URL } = getClientEnv();
      const wsUrl = WS_URL || (process.env.NODE_ENV === 'production' 
        ? 'wss://auction.lebanon-auction.bdaya.tech/ws/' 
        : 'ws://localhost:8081');
      
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('🔗 Connected to notification WebSocket');
        setIsConnected(true);
        // Authenticate connection
        websocket.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'notification') {
            const notification = message.data;
            
            // Add to notifications list
            setNotifications(prev => [notification, ...prev]);
            
            // Add to toast notifications
            addToast({
              type: notification.type,
              title: notification.title,
              message: notification.message,
              data: notification.data,
              autoHideDuration: getAutoHideDuration(notification.type),
            });

            // Show browser notification if permitted
            showBrowserNotification(notification);
            
            // Play notification sound
            playNotificationSound(notification.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code);
        setIsConnected(false);
        
        // Attempt to reconnect after a delay if not intentionally closed
        if (event.code !== 1000 && user) {
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 3000);
        }
      };

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      setWs(websocket);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };

  const disconnectWebSocket = () => {
    if (ws) {
      ws.close(1000); // Normal closure
      setWs(null);
    }
  };

  const showBrowserNotification = (notification: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/images/logo-192.png',
        badge: '/images/logo-72.png',
        tag: notification.id,
        renotify: true,
        requireInteraction: shouldRequireInteraction(notification.type),
      });

      browserNotification.onclick = () => {
        window.focus();
        
        // Navigate to relevant page based on notification type
        if (notification.data?.productId) {
          window.location.href = `/products/${notification.data.productId}`;
        }
        
        browserNotification.close();
      };

      // Auto-close after 10 seconds for non-critical notifications
      if (!shouldRequireInteraction(notification.type)) {
        setTimeout(() => {
          browserNotification.close();
        }, 10000);
      }
    }
  };

  const playNotificationSound = (type: string) => {
    try {
      let soundFile = '/sounds/notification.mp3';
      
      // Use different sounds for different notification types
      switch (type) {
        case 'AUCTION_WON':
          soundFile = '/sounds/success.mp3';
          break;
        case 'BID_OUTBID':
        case 'AUCTION_ENDING':
          soundFile = '/sounds/alert.mp3';
          break;
        case 'BID_PLACED':
          soundFile = '/sounds/bid.mp3';
          break;
        default:
          soundFile = '/sounds/notification.mp3';
      }

      const audio = new Audio(soundFile);
      audio.volume = 0.4;
      audio.play().catch(e => {
        // Fallback to default notification sound
        const defaultAudio = new Audio('/sounds/notification.mp3');
        defaultAudio.volume = 0.3;
        defaultAudio.play().catch(() => {
          console.log('Could not play notification sound');
        });
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const getAutoHideDuration = (type: string): number => {
    switch (type) {
      case 'AUCTION_ENDING':
        return 10000; // 10 seconds for urgent notifications
      case 'BID_OUTBID':
        return 8000; // 8 seconds for important notifications
      case 'AUCTION_WON':
        return 12000; // 12 seconds for success notifications
      default:
        return 6000; // 6 seconds for normal notifications
    }
  };

  const shouldRequireInteraction = (type: string): boolean => {
    // These notification types require user interaction to close
    return ['AUCTION_WON', 'PAYMENT_FAILED'].includes(type);
  };

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const contextValue: NotificationContextType = {
    addToast,
    clearAllToasts: clearAll,
    notifications,
    unreadCount,
    isLoading: loading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationToast
        notifications={toasts}
        onClose={removeToast}
        maxVisible={3}
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}

// Utility function to manually trigger notifications (for testing or manual triggers)
export function useNotificationTrigger() {
  const { addToast } = useNotificationContext();

  const triggerNotification = (
    type: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ) => {
    addToast({
      type,
      title,
      message,
      data,
    });
  };

  return { triggerNotification };
}

// Hook for notification preferences management
export function useNotifications() {
  const [preferences, setPreferences] = useState({
    notificationSoundEnabled: true,
    emailNotificationsEnabled: true,
    pushNotificationsEnabled: true,
  });
  const [loading, setLoading] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notificationPreferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }, []);

  // Update preferences
  const updatePreferences = async (updates: Partial<typeof preferences>) => {
    try {
      setLoading(true);
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
      
      // You could also sync with backend here if needed
      // await fetch('/api/notifications/preferences', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates),
      // });
      
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    preferences,
    updatePreferences,
    loading,
  };
}