'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getClientEnv } from 'src/lib/env';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotifications(result.notifications || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
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
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
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
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [user]);

  const connectWebSocket = useCallback(() => {
    if (!user || ws) return;

    const { WS_URL } = getClientEnv();
    const wsUrl = WS_URL || (window.location.protocol === 'https:' ? 
      `wss://${window.location.hostname}/ws/` : 
      `ws://${window.location.hostname}:8081`);

    try {
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('🔔 Notifications WebSocket connected');
        
        // Authenticate for notifications
        websocket.send(JSON.stringify({
          type: 'authenticate',
          token: user.accessToken,
        }));
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'notification') {
            // Add new real-time notification
            const newNotification: Notification = {
              id: message.data.id,
              title: message.data.title,
              message: message.data.message,
              type: message.data.type,
              isRead: false,
              createdAt: message.data.createdAt,
              data: message.data.data,
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show browser notification if permitted
            if (Notification.permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/logo.png',
              });
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('🔔 Notifications WebSocket disconnected');
        setWs(null);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (user) {
            connectWebSocket();
          }
        }, 5000);
      };

      websocket.onerror = (error) => {
        console.error('🔔 Notifications WebSocket error:', error);
      };

      setWs(websocket);
    } catch (error) {
      console.error('Failed to connect notification WebSocket:', error);
    }
  }, [user, ws]);

  const disconnectWebSocket = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  }, [ws]);

  // Connect WebSocket when user logs in
  useEffect(() => {
    if (user) {
      fetchNotifications();
      connectWebSocket();
      
      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } else {
      disconnectWebSocket();
      setNotifications([]);
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, fetchNotifications, connectWebSocket, disconnectWebSocket]);

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    connectWebSocket,
    disconnectWebSocket,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}