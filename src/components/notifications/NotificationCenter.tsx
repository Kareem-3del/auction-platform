'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Badge,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Circle as CircleIcon,
  Gavel as GavelIcon,
  Payment as PaymentIcon,
  AccountCircle as AccountIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from 'src/hooks/useAuth';
import { getClientEnv } from 'src/lib/env';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);

  const isOpen = Boolean(anchorEl);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Connect to WebSocket for real-time notifications
      connectWebSocket();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.notifications.filter((n: Notification) => !n.isRead).length);
        }
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      const token = localStorage.getItem('accessToken');
      const { WS_URL } = getClientEnv();
      const wsUrl = WS_URL || (window.location.protocol === 'https:' ? 
        `wss://${window.location.hostname}/ws/` : 
        `ws://${window.location.hostname}:8081`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Authenticate connection
        ws.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'notification') {
          // Add new notification to the list
          const newNotification = message.data;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if permitted
          showBrowserNotification(newNotification);
          
          // Play notification sound
          playNotificationSound();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/images/logo.png',
        badge: '/images/logo.png',
      });
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play notification sound'));
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.id === notificationId);
          return notification && !notification.isRead ? prev - 1 : prev;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BID_PLACED':
      case 'BID_OUTBID':
      case 'AUCTION_STARTING':
      case 'AUCTION_ENDING':
      case 'AUCTION_WON':
        return <GavelIcon color="primary" />;
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_FAILED':
        return <PaymentIcon color="secondary" />;
      case 'ACCOUNT_UPDATE':
        return <AccountIcon color="info" />;
      default:
        return <CircleIcon color="action" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'AUCTION_WON':
        return 'success';
      case 'BID_OUTBID':
      case 'PAYMENT_FAILED':
        return 'error';
      case 'AUCTION_ENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (!user) return null;

  return (
    <Box className={className}>
      <IconButton
        onClick={handleClick}
        size="large"
        sx={{
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            overflow: 'visible',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight="bold">
            Notifications
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="error"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          <Box>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead} sx={{ mr: 1 }}>
                Mark All Read
              </Button>
            )}
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* Content */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Box key={index} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                </Box>
              </Box>
            ))
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <NotificationsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body2">No notifications yet</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((notification, index) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                    handleClose();
                  }}
                  sx={{
                    alignItems: 'flex-start',
                    py: 2,
                    px: 2,
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 48, mt: 0.5 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {notification.title}
                        </Typography>
                        {!notification.isRead && (
                          <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.disabled">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={notification.type.replace('_', ' ')}
                              size="small"
                              variant="outlined"
                              color={getNotificationColor(notification.type) as any}
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              sx={{ p: 0.5 }}
                            >
                              <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    }
                  />
                </MenuItem>
              ))}
            </List>
          )}
        </Box>

        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button variant="text" size="small" onClick={() => {
                handleClose();
                // Navigate to full notifications page if needed
                window.location.href = '/notifications';
              }}>
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </Box>
  );
}