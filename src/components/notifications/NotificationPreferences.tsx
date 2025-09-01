'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Button,
  Switch,
  Divider,
  Typography,
  CardContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Alert,
  Skeleton,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneIphone as PushIcon,
  Desktop as InAppIcon,
  Wifi as SocketIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  VolumeUp as SoundIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface NotificationPreference {
  id: string;
  notificationType: string;
  isEnabled: boolean;
  enabledChannels: string[];
  settings?: {
    timingMinutes?: number;
    frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quietHoursStart?: string;
    quietHoursEnd?: string;
    timezone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationTypes {
  notificationTypes: string[];
  notificationChannels: string[];
}

const NotificationCategoryConfig = {
  auction: {
    title: 'Auction Notifications',
    description: 'Notifications about auction events and bidding',
    icon: <NotificationsIcon />,
    types: [
      'auction_starting',
      'auction_starting_soon',
      'auction_ending',
      'auction_ending_soon',
      'auction_cancelled',
      'auction_won',
      'auction_lost',
    ]
  },
  bidding: {
    title: 'Bidding Notifications',
    description: 'Updates about your bids and bidding activity',
    icon: <NotificationsIcon />,
    types: [
      'bid_placed',
      'bid_outbid',
      'bid_winning',
      'auto_bid_enabled',
      'auto_bid_disabled',
    ]
  },
  payment: {
    title: 'Payment & Financial',
    description: 'Payment confirmations, reminders, and balance updates',
    icon: <NotificationsIcon />,
    types: [
      'payment_reminder',
      'payment_overdue',
      'payment_received',
      'virtual_balance_reminder',
      'virtual_balance_penalty',
      'balance_added',
      'balance_deducted',
    ]
  },
  account: {
    title: 'Account & Security',
    description: 'Account changes, security alerts, and profile updates',
    icon: <NotificationsIcon />,
    types: [
      'account_created',
      'account_verified',
      'account_suspended',
      'password_changed',
      'email_changed',
      'profile_updated',
      'login_from_new_device',
      'security_alert',
    ]
  },
  watchlist: {
    title: 'Watchlist',
    description: 'Updates about items in your watchlist',
    icon: <NotificationsIcon />,
    types: [
      'watchlist_auction_starting',
      'watchlist_auction_ending',
      'watchlist_price_drop',
    ]
  },
  system: {
    title: 'System Announcements',
    description: 'Platform updates, maintenance, and new features',
    icon: <NotificationsIcon />,
    types: [
      'system_announcement',
      'maintenance_scheduled',
      'feature_update',
    ]
  },
};

const channelIcons: { [key: string]: React.ReactElement } = {
  in_app: <InAppIcon />,
  socket: <SocketIcon />,
  push: <PushIcon />,
  email: <EmailIcon />,
  sms: <SmsIcon />,
};

const channelLabels: { [key: string]: string } = {
  in_app: 'In-App',
  socket: 'Real-time',
  push: 'Push',
  email: 'Email',
  sms: 'SMS',
};

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [types, setTypes] = useState<NotificationTypes | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['auction', 'bidding']);
  const [globalSettings, setGlobalSettings] = useState({
    soundEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  useEffect(() => {
    loadPreferences();
    loadNotificationTypes();
  }, []);

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/v1/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const prefs = await response.json();
        setPreferences(prefs);
      } else {
        throw new Error('Failed to load preferences');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    }
  };

  const loadNotificationTypes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/v1/notifications/types', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const typesData = await response.json();
        setTypes(typesData);
      } else {
        throw new Error('Failed to load notification types');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notification types');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/v1/notifications/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences.map(pref => ({
          notificationType: pref.notificationType,
          isEnabled: pref.isEnabled,
          enabledChannels: pref.enabledChannels,
          settings: {
            ...pref.settings,
            ...globalSettings,
          },
        }))),
      });

      if (response.ok) {
        const updatedPrefs = await response.json();
        setPreferences(updatedPrefs);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const initializePreferences = async () => {
    try {
      setSaving(true);
      
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/v1/notifications/preferences/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadPreferences();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error('Failed to initialize preferences');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (notificationType: string, enabled: boolean) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.notificationType === notificationType
          ? { ...pref, isEnabled: enabled }
          : pref
      )
    );
  };

  const toggleChannel = (notificationType: string, channel: string, enabled: boolean) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.notificationType === notificationType
          ? {
              ...pref,
              enabledChannels: enabled
                ? [...pref.enabledChannels, channel]
                : pref.enabledChannels.filter(c => c !== channel)
            }
          : pref
      )
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getPreferenceForType = (notificationType: string): NotificationPreference | undefined => {
    return preferences.find(pref => pref.notificationType === notificationType);
  };

  const formatNotificationTypeName = (type: string): string => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Box maxWidth="lg" mx="auto" p={3}>
        <Typography variant="h4" gutterBottom>
          Notification Preferences
        </Typography>
        <Grid container spacing={3}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
                  <Stack spacing={2} sx={{ mt: 3 }}>
                    {[...Array(3)].map((_, i) => (
                      <Box key={i} display="flex" alignItems="center" justifyContent="space-between">
                        <Skeleton variant="text" width="40%" height={24} />
                        <Skeleton variant="rectangular" width={60} height={24} />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (preferences.length === 0) {
    return (
      <Box maxWidth="lg" mx="auto" p={3}>
        <Typography variant="h4" gutterBottom>
          Notification Preferences
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          No notification preferences found. Initialize default preferences to get started.
        </Alert>
        <Button
          variant="contained"
          onClick={initializePreferences}
          disabled={saving}
          startIcon={<RestoreIcon />}
        >
          {saving ? 'Initializing...' : 'Initialize Default Preferences'}
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth="lg" mx="auto" p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Notification Preferences
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Customize when and how you receive notifications
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={initializePreferences}
            disabled={saving}
            startIcon={<RestoreIcon />}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            onClick={updatePreferences}
            disabled={saving}
            startIcon={<SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Notification preferences updated successfully!
        </Alert>
      )}

      {/* Global Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom startIcon={<ScheduleIcon />}>
            Global Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={globalSettings.soundEnabled}
                    onChange={(e) => setGlobalSettings(prev => ({ 
                      ...prev, 
                      soundEnabled: e.target.checked 
                    }))}
                  />
                }
                label="Notification Sounds"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Quiet Hours Start"
                type="time"
                value={globalSettings.quietHoursStart}
                onChange={(e) => setGlobalSettings(prev => ({ 
                  ...prev, 
                  quietHoursStart: e.target.value 
                }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Quiet Hours End"
                type="time"
                value={globalSettings.quietHoursEnd}
                onChange={(e) => setGlobalSettings(prev => ({ 
                  ...prev, 
                  quietHoursEnd: e.target.value 
                }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={globalSettings.timezone}
                  label="Timezone"
                  onChange={(e) => setGlobalSettings(prev => ({ 
                    ...prev, 
                    timezone: e.target.value 
                  }))}
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time</MenuItem>
                  <MenuItem value="America/Chicago">Central Time</MenuItem>
                  <MenuItem value="America/Denver">Mountain Time</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  <MenuItem value="Europe/London">London</MenuItem>
                  <MenuItem value="Europe/Paris">Paris</MenuItem>
                  <MenuItem value="Asia/Dubai">Dubai</MenuItem>
                  <MenuItem value="Asia/Tokyo">Tokyo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Stack spacing={3}>
        {Object.entries(NotificationCategoryConfig).map(([categoryKey, category]) => {
          const isExpanded = expandedCategories.includes(categoryKey);
          const categoryTypes = category.types.filter(type => 
            types?.notificationTypes.includes(type)
          );

          return (
            <Card key={categoryKey}>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => toggleCategory(categoryKey)}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {category.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6">
                        {category.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton>
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Collapse in={isExpanded}>
                  <Box sx={{ mt: 3 }}>
                    <Stack spacing={2} divider={<Divider />}>
                      {categoryTypes.map((notificationType) => {
                        const preference = getPreferenceForType(notificationType);
                        const isEnabled = preference?.isEnabled ?? false;
                        const enabledChannels = preference?.enabledChannels ?? [];

                        return (
                          <Box key={notificationType}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography variant="subtitle1">
                                  {formatNotificationTypeName(notificationType)}
                                </Typography>
                              </Box>
                              <Switch
                                checked={isEnabled}
                                onChange={(e) => togglePreference(notificationType, e.target.checked)}
                              />
                            </Box>

                            <Collapse in={isEnabled}>
                              <Box sx={{ mt: 2, ml: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Delivery Channels:
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  {types?.notificationChannels.map((channel) => (
                                    <Chip
                                      key={channel}
                                      icon={channelIcons[channel]}
                                      label={channelLabels[channel]}
                                      clickable
                                      variant={enabledChannels.includes(channel) ? "filled" : "outlined"}
                                      onClick={() => 
                                        toggleChannel(notificationType, channel, !enabledChannels.includes(channel))
                                      }
                                      sx={{
                                        mb: 1,
                                        ...(enabledChannels.includes(channel) && {
                                          backgroundColor: 'primary.main',
                                          color: 'white',
                                          '&:hover': {
                                            backgroundColor: 'primary.dark',
                                          }
                                        })
                                      }}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}