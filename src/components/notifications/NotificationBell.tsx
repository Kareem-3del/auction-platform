'use client';

import { formatDistanceToNow } from 'date-fns';
import React, { useRef, useState, useEffect } from 'react';

import {
  Box,
  List,
  Chip,
  Fade,
  Badge,
  Stack,
  Slide,
  Button,
  Popover,
  Divider,
  Tooltip,
  ListItem,
  Skeleton,
  TextField,
  IconButton,
  Typography,
  ListItemButton,
  InputAdornment,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  CheckBox as CheckBoxIcon,
  MarkEmailRead as MarkAllIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
} from '@mui/icons-material';

import { useNotifications } from 'src/contexts/NotificationContext';

import { NotificationType } from 'src/types/notification';

const getNotificationIcon = (type: NotificationType) => {
  const iconProps = { 
    sx: { 
      fontSize: 24,
      color: 'inherit',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
    } 
  };
  
  switch (type) {
    case NotificationType.BID_OUTBID:
      return <GavelIcon {...iconProps} sx={{ ...iconProps.sx, color: '#ff6b6b' }} />;
    case NotificationType.BID_WON:
      return <TrendingUpIcon {...iconProps} sx={{ ...iconProps.sx, color: '#51cf66' }} />;
    case NotificationType.AUCTION_ENDING:
    case NotificationType.AUCTION_STARTED:
      return <TimeIcon {...iconProps} sx={{ ...iconProps.sx, color: '#ffd43b' }} />;
    case NotificationType.PAYMENT_RECEIVED:
    case NotificationType.PAYOUT_PROCESSED:
      return <PaymentIcon {...iconProps} sx={{ ...iconProps.sx, color: '#74c0fc' }} />;
    case NotificationType.KYC_APPROVED:
    case NotificationType.KYC_REJECTED:
      return <SecurityIcon {...iconProps} sx={{ ...iconProps.sx, color: '#9775fa' }} />;
    case NotificationType.AGENT_APPROVED:
      return <CheckBoxIcon {...iconProps} sx={{ ...iconProps.sx, color: '#51cf66' }} />;
    default:
      return <NotificationsIcon {...iconProps} sx={{ ...iconProps.sx, color: '#868e96' }} />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.BID_WON:
    case NotificationType.PAYMENT_RECEIVED:
    case NotificationType.KYC_APPROVED:
    case NotificationType.AGENT_APPROVED:
      return 'success';
    case NotificationType.BID_OUTBID:
    case NotificationType.AUCTION_ENDING:
      return 'warning';
    case NotificationType.KYC_REJECTED:
      return 'error';
    case NotificationType.AUCTION_STARTED:
    case NotificationType.PAYOUT_PROCESSED:
      return 'info';
    default:
      return 'default';
  }
};

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Add local state for saving notifications if not available from context
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);
  
  const bellRef = useRef<HTMLButtonElement>(null);

  // Animation effect for new notifications
  useEffect(() => {
    if (unreadCount > previousCount && previousCount !== 0) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }
    setPreviousCount(unreadCount);
  }, [unreadCount, previousCount]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unread' && !notification.isRead) ||
                         (filterType === 'read' && notification.isRead);
    
    return matchesSearch && matchesFilter;
  });

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm('');
  };

  const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setLoadingAction(id);
    setSavingNotifications(true);
    try {
      await markAsRead(id);
    } finally {
      setLoadingAction(null);
      setSavingNotifications(false);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setLoadingAction(`delete-${id}`);
    setSavingNotifications(true);
    try {
      await deleteNotification(id);
    } finally {
      setLoadingAction(null);
      setSavingNotifications(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoadingAction('mark-all');
    setSavingNotifications(true);
    try {
      await markAllAsRead();
    } finally {
      setLoadingAction(null);
      setSavingNotifications(false);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <Tooltip 
        title={`${unreadCount} notification${unreadCount !== 1 ? 's' : ''} • ${isConnected ? 'Live' : 'Offline'}`} 
        arrow
      >
        <IconButton 
          ref={bellRef}
          onClick={handleClick}
          color="inherit"
          sx={{ 
            p: 1.5,
            position: 'relative',
            borderRadius: 2,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'scale(1.05)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            }
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error" 
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                fontWeight: 600,
                background: unreadCount > 0 ? 
                  'linear-gradient(45deg, #ff6b6b 0%, #ee5a52 100%)' : 
                  'transparent',
                boxShadow: '0 2px 8px rgba(255,107,107,0.3)',
                animation: isAnimating ? 'pulse 1s ease-in-out infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.2)', opacity: 0.8 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                }
              }
            }}
          >
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: isAnimating ? 'bellShake 0.5s ease-in-out' : 'none',
                '@keyframes bellShake': {
                  '0%, 100%': { transform: 'rotate(0deg)' },
                  '25%': { transform: 'rotate(-10deg)' },
                  '75%': { transform: 'rotate(10deg)' },
                }
              }}
            >
              {unreadCount > 0 ? 
                <NotificationsIcon sx={{ 
                  fontSize: 24,
                  color: 'inherit',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }} /> : 
                <NotificationsNoneIcon sx={{ 
                  fontSize: 24,
                  color: 'inherit',
                  opacity: 0.7
                }} />
              }
            </Box>
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        TransitionComponent={Fade}
        transitionDuration={300}
        PaperProps={{
          elevation: 24,
          sx: {
            width: 420,
            maxHeight: 600,
            mt: 1,
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          },
        }}
      >
        <Box>
          {/* Modern Header */}
          <Box 
            sx={{ 
              p: 3, 
              pb: 2,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)',
              borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #6366f1 0%, #a855f7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Notifications
                </Typography>
                <Chip
                  label={isConnected ? 'Live' : 'Offline'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    backgroundColor: isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: isConnected ? '#22c55e' : '#ef4444',
                    border: `1px solid ${isConnected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    '&::before': {
                      content: '""',
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: isConnected ? '#22c55e' : '#ef4444',
                      marginRight: 0.5,
                      animation: isConnected ? 'pulse 2s infinite' : 'none',
                    },
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
              </Box>
              
              {unreadCount > 0 && (
                <Tooltip title="Mark all as read" arrow>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MarkAllIcon />}
                    onClick={handleMarkAllAsRead}
                    disabled={loadingAction === 'mark-all'}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: 'rgba(99,102,241,0.3)',
                      color: '#6366f1',
                      '&:hover': {
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99,102,241,0.1)',
                      }
                    }}
                  >
                    Mark all read
                  </Button>
                </Tooltip>
              )}
            </Box>

            {/* Search and Filter Controls */}
            <Stack spacing={2}>
              <TextField
                size="small"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                        sx={{ p: 0.5 }}
                      >
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255,255,255,1)',
                    }
                  }
                }}
              />

              <Box display="flex" gap={1}>
                {(['all', 'unread', 'read'] as const).map((filter) => (
                  <Chip
                    key={filter}
                    label={filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'}
                    onClick={() => setFilterType(filter)}
                    variant={filterType === filter ? 'filled' : 'outlined'}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease',
                      ...(filterType === filter && {
                        background: 'linear-gradient(45deg, #6366f1 0%, #a855f7 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5b21b6 0%, #7c3aed 100%)',
                        }
                      })
                    }}
                  />
                ))}
              </Box>

              {(unreadCount > 0 || filteredNotifications.length > 0) && (
                <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                  {filteredNotifications.length} of {notifications.length} notifications
                  {unreadCount > 0 && ` • ${unreadCount} unread`}
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Enhanced Notifications List */}
          <Box sx={{ 
            maxHeight: 440, 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: 10,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 10,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.3)',
              },
            },
          }}>
            {isLoading ? (
              <Box p={3}>
                {[...Array(4)].map((_, index) => (
                  <Fade in timeout={300 + index * 100} key={index}>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      mb={2} 
                      p={2}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'rgba(0,0,0,0.02)',
                      }}
                    >
                      <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                      <Box flex={1}>
                        <Skeleton variant="text" width="85%" height={20} />
                        <Skeleton variant="text" width="65%" height={16} sx={{ mt: 0.5 }} />
                        <Skeleton variant="text" width="45%" height={14} sx={{ mt: 1 }} />
                      </Box>
                    </Box>
                  </Fade>
                ))}
              </Box>
            ) : filteredNotifications.length === 0 ? (
              <Fade in timeout={300}>
                <Box p={6} textAlign="center">
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(99,102,241,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <NotificationsNoneIcon sx={{ fontSize: 36, color: '#6366f1', opacity: 0.7 }} />
                  </Box>
                  <Typography variant="h6" color="text.primary" gutterBottom>
                    {searchTerm ? 'No matching notifications' : 'All caught up!'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm 
                      ? `No notifications match "${searchTerm}"`
                      : 'You have no new notifications right now'
                    }
                  </Typography>
                </Box>
              </Fade>
            ) : (
              <List disablePadding sx={{ p: 1 }}>
                {filteredNotifications.map((notification, index) => (
                  <Slide 
                    key={notification.id} 
                    direction="left" 
                    in 
                    timeout={300 + index * 50}
                  >
                    <ListItem 
                      disablePadding
                      sx={{ mb: 1 }}
                    >
                      <ListItemButton 
                        sx={{ 
                          alignItems: 'flex-start', 
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: notification.isRead 
                            ? 'rgba(0,0,0,0.02)' 
                            : 'rgba(99,102,241,0.05)',
                          border: notification.isRead 
                            ? '1px solid rgba(0,0,0,0.05)' 
                            : '1px solid rgba(99,102,241,0.2)',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: notification.isRead 
                              ? 'rgba(0,0,0,0.04)' 
                              : 'rgba(99,102,241,0.08)',
                            transform: 'translateX(2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          },
                          '&::before': !notification.isRead ? {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 4,
                            height: '100%',
                            background: 'linear-gradient(45deg, #6366f1 0%, #a855f7 100%)',
                          } : {},
                        }}
                      >
                        <Box display="flex" width="100%" alignItems="flex-start">
                          {/* Enhanced Icon */}
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              mr: 2,
                              borderRadius: 2,
                              backgroundColor: 'rgba(255,255,255,0.8)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(0,0,0,0.1)',
                              flexShrink: 0,
                            }}
                          >
                            {getNotificationIcon(notification.notificationType)}
                          </Box>

                          {/* Enhanced Content */}
                          <Box flex={1} minWidth={0}>
                            <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                              <Box flex={1} minWidth={0}>
                                <Typography 
                                  variant="body2" 
                                  fontWeight={notification.isRead ? 400 : 600}
                                  sx={{ 
                                    color: notification.isRead ? 'text.primary' : '#1e293b',
                                    mb: 0.5,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {notification.title}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ 
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.3,
                                    mb: 1,
                                  }}
                                >
                                  {notification.message}
                                </Typography>
                                
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip
                                    label={notification.notificationType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                    size="small"
                                    color={getNotificationColor(notification.notificationType)}
                                    sx={{ 
                                      fontSize: '0.7rem', 
                                      height: 22,
                                      fontWeight: 500,
                                      borderRadius: 1,
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </Typography>
                                </Stack>
                              </Box>

                              {/* Enhanced Action Buttons */}
                              <Stack direction="row" spacing={0.5} ml={1} flexShrink={0}>
                                {!notification.isRead && (
                                  <Tooltip title="Mark as read" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                                      disabled={loadingAction === notification.id}
                                      sx={{
                                        backgroundColor: 'rgba(34,197,94,0.1)',
                                        color: '#22c55e',
                                        '&:hover': {
                                          backgroundColor: 'rgba(34,197,94,0.2)',
                                          transform: 'scale(1.1)',
                                        },
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      <CheckCircleIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Delete" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleDelete(notification.id, e)}
                                    disabled={loadingAction === `delete-${notification.id}`}
                                    sx={{
                                      backgroundColor: 'rgba(239,68,68,0.1)',
                                      color: '#ef4444',
                                      '&:hover': {
                                        backgroundColor: 'rgba(239,68,68,0.2)',
                                        transform: 'scale(1.1)',
                                      },
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Box>
                          </Box>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  </Slide>
                ))}
              </List>
            )}
          </Box>

          {/* Enhanced Footer */}
          {notifications.length > 0 && (
            <>
              <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)' }} />
              <Box 
                p={2}
                sx={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.01) 100%)',
                }}
              >
                <Button 
                  fullWidth 
                  variant="outlined"
                  size="medium"
                  onClick={handleClose}
                  href="/profile#notifications"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    borderColor: 'rgba(99,102,241,0.3)',
                    color: '#6366f1',
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      borderColor: '#6366f1',
                      backgroundColor: 'rgba(99,102,241,0.1)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  View All Notifications
                </Button>
              </Box>
            </>
          )}
          
          {savingNotifications && (
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              p={2}
              sx={{
                borderTop: '1px solid rgba(0,0,0,0.06)',
                backgroundColor: 'rgba(99,102,241,0.05)',
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(99,102,241,0.3)',
                    borderTop: '2px solid #6366f1',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                <Typography variant="body2" color="#6366f1" fontWeight={500}>
                  Updating notifications...
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
}