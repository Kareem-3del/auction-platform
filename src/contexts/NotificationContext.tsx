'use client';

import type { Notification, NotificationPreferences, NotificationContextValue } from 'src/types/notification';

import React, { useRef, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { useAuth, getAccessToken } from 'src/hooks/useAuth';

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notificationSoundEnabled: true,
    emailNotificationsEnabled: true,
    pushNotificationsEnabled: true,
  });

  // Audio object for notification sounds
  const [notificationAudio, setNotificationAudio] = useState<HTMLAudioElement | null>(null);
  
  // Real-time connection state
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize audio for notifications only if file exists
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.preload = 'none'; // Don't preload to save bandwidth
      audio.addEventListener('error', () => {
        console.warn('Notification sound file not found, audio notifications disabled');
        setNotificationAudio(null);
      });
      setNotificationAudio(audio);
    } catch (error) {
      console.warn('Failed to initialize notification audio:', error);
      setNotificationAudio(null);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (preferences.notificationSoundEnabled && notificationAudio) {
      notificationAudio.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
    }
  }, [preferences.notificationSoundEnabled, notificationAudio]);

  // Function to add a new notification (called from real-time updates)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
      // Play sound if enabled
      if (preferences.notificationSoundEnabled && notificationAudio) {
        notificationAudio.play().catch(error => {
          console.error('Error playing notification sound:', error);
        });
      }
    }
  }, [preferences.notificationSoundEnabled, notificationAudio]);

  // Setup real-time connection
  const setupRealTimeConnection = useCallback(() => {
    if (!isAuthenticated) return;

    const token = getAccessToken();
    if (!token) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      const eventSource = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('Connected to notification stream');
              setIsConnected(true);
              break;
              
            case 'heartbeat':
              // Keep connection alive
              break;
              
            case 'notification':
              // Add new notification
              addNotification(data.data);
              break;
              
            default:
              console.log('Unknown SSE message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isAuthenticated) {
            console.log('Attempting to reconnect SSE...');
            setupRealTimeConnection();
          }
        }, 5000);
      };

    } catch (error) {
      console.error('Error setting up SSE connection:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated, addNotification]);

  // Cleanup real-time connection
  const cleanupRealTimeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      fetchPreferences();
      setupRealTimeConnection();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      cleanupRealTimeConnection();
    }

    // Cleanup on unmount
    return () => {
      cleanupRealTimeConnection();
    };
  }, [isAuthenticated, user, setupRealTimeConnection, cleanupRealTimeConnection]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const token = getAccessToken();
      if (!token) return;
      
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = getAccessToken();
      if (!token) return;
      
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.data.preferences);
        }
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: string) => {
    if (!isAuthenticated) return;

    try {
      const token = getAccessToken();
      if (!token) return;
      
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id 
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [isAuthenticated]);

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = getAccessToken();
      if (!token) return;
      
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            isRead: true, 
            readAt: new Date().toISOString() 
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [isAuthenticated]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!isAuthenticated) return;

    try {
      const token = getAccessToken();
      if (!token) return;
      
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const notificationToDelete = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        if (notificationToDelete && !notificationToDelete.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [isAuthenticated, notifications]);

  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    if (!isAuthenticated) return;

    try {
      const token = getAccessToken();
      if (!token) return;
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPrefs),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.data.preferences);
        }
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }, [isAuthenticated]);



  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    updatePreferences,
    playNotificationSound,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};