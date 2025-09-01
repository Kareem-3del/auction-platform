'use client';

import { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  IconButton,
  Typography,
  Slide,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  Gavel as GavelIcon,
  Payment as PaymentIcon,
  AccountCircle as AccountIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

interface NotificationToast {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  autoHideDuration?: number;
  data?: Record<string, any>;
}

interface NotificationToastProps {
  notifications: NotificationToast[];
  onClose: (id: string) => void;
  maxVisible?: number;
}

function SlideTransition(props: TransitionProps & {
  children: React.ReactElement<any, any>;
}) {
  return <Slide {...props} direction="left" />;
}

export default function NotificationToast({
  notifications,
  onClose,
  maxVisible = 3,
}: NotificationToastProps) {
  const visibleNotifications = notifications.slice(0, maxVisible);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BID_PLACED':
      case 'BID_OUTBID':
      case 'AUCTION_STARTING':
      case 'AUCTION_ENDING':
      case 'AUCTION_WON':
        return <GavelIcon />;
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_FAILED':
        return <PaymentIcon />;
      case 'ACCOUNT_UPDATE':
        return <AccountIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getSeverity = (type: string): 'success' | 'info' | 'warning' | 'error' => {
    switch (type) {
      case 'AUCTION_WON':
      case 'PAYMENT_RECEIVED':
        return 'success';
      case 'BID_OUTBID':
      case 'PAYMENT_FAILED':
        return 'error';
      case 'AUCTION_ENDING':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      {visibleNotifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHideDuration || 6000}
          onClose={() => onClose(notification.id)}
          TransitionComponent={SlideTransition}
          sx={{
            position: 'relative',
            mb: index > 0 ? 1 : 0,
            '& .MuiSnackbarContent-root': {
              padding: 0,
            },
          }}
        >
          <Alert
            severity={getSeverity(notification.type)}
            onClose={() => onClose(notification.id)}
            icon={getNotificationIcon(notification.type)}
            sx={{
              width: '100%',
              alignItems: 'flex-start',
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
                mt: 0.5,
              },
              '& .MuiAlert-message': {
                width: '100%',
                pt: 0.5,
              },
            }}
          >
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ mb: 0.5 }}
              >
                {notification.title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {notification.message}
              </Typography>
              
              {/* Additional data display */}
              {notification.data && (
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  {notification.data.productTitle && (
                    <Typography variant="caption" display="block">
                      Product: {notification.data.productTitle}
                    </Typography>
                  )}
                  {notification.data.bidAmount && (
                    <Typography variant="caption" display="block">
                      Amount: ${notification.data.bidAmount}
                    </Typography>
                  )}
                  {notification.data.timeLeft && (
                    <Typography variant="caption" display="block">
                      Time Left: {notification.data.timeLeft}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
}

// Hook for managing toast notifications
export function useNotificationToast() {
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const addToast = (notification: Omit<NotificationToast, 'id'>) => {
    const id = Date.now().toString();
    const toast: NotificationToast = {
      id,
      ...notification,
      severity: notification.severity || getSeverityFromType(notification.type),
    };
    
    setToasts(prev => [toast, ...prev]);

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, notification.autoHideDuration || 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
  };
}

function getSeverityFromType(type: string): 'success' | 'info' | 'warning' | 'error' {
  switch (type) {
    case 'AUCTION_WON':
    case 'PAYMENT_RECEIVED':
      return 'success';
    case 'BID_OUTBID':
    case 'PAYMENT_FAILED':
      return 'error';
    case 'AUCTION_ENDING':
      return 'warning';
    default:
      return 'info';
  }
}