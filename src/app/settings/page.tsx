'use client';

import { useState, useEffect } from 'react';

import {
  Save as SaveIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Visibility as VisibilityIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import {
  Box,
  Tab,
  Grid,
  Card,
  Tabs,
  Chip,
  Radio,
  Alert,
  Paper,
  Stack,
  Switch,
  Button,
  Avatar,
  Divider,
  Snackbar,
  Container,
  FormLabel,
  TextField,
  Typography,
  CardHeader,
  RadioGroup,
  IconButton,
  CardContent,
  FormControl,
  FormControlLabel,
} from '@mui/material';

import { useAuth } from 'src/hooks/useAuth';

import Layout from 'src/components/layout/Layout';

interface UserSettings {
  // Privacy & Anonymity
  isAnonymousDisplay: boolean;
  anonymousDisplayName: string;
  showEmailPublicly: boolean;
  showLocationPublicly: boolean;
  allowDirectMessages: boolean;
  
  // Notifications
  emailNotifications: {
    auctionUpdates: boolean;
    bidNotifications: boolean;
    winNotifications: boolean;
    marketingEmails: boolean;
  };
  pushNotifications: {
    auctionEnding: boolean;
    outbid: boolean;
    newMessage: boolean;
  };
  
  // Bidding Preferences
  maxAutoBidAmount: number;
  bidIncrement: number;
  confirmBeforeBidding: boolean;
  
  // Account Settings
  currency: string;
  language: string;
  timezone: string;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState<UserSettings>({
    isAnonymousDisplay: false,
    anonymousDisplayName: '',
    showEmailPublicly: false,
    showLocationPublicly: true,
    allowDirectMessages: true,
    emailNotifications: {
      auctionUpdates: true,
      bidNotifications: true,
      winNotifications: true,
      marketingEmails: false,
    },
    pushNotifications: {
      auctionEnding: true,
      outbid: true,
      newMessage: true,
    },
    maxAutoBidAmount: 1000,
    bidIncrement: 25,
    confirmBeforeBidding: true,
    currency: 'USD',
    language: 'en',
    timezone: 'America/New_York',
  });
  
  const [originalSettings, setOriginalSettings] = useState<UserSettings>({} as UserSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAnonymousName, setEditingAnonymousName] = useState(false);
  const [tempAnonymousName, setTempAnonymousName] = useState('');

  useEffect(() => {
    if (user) {
      // Load user settings - in real app this would come from API
      const userSettings: UserSettings = {
        isAnonymousDisplay: user.isAnonymousDisplay || false,
        anonymousDisplayName: user.anonymousDisplayName || '',
        showEmailPublicly: false,
        showLocationPublicly: true,
        allowDirectMessages: true,
        emailNotifications: {
          auctionUpdates: true,
          bidNotifications: true,
          winNotifications: true,
          marketingEmails: false,
        },
        pushNotifications: {
          auctionEnding: true,
          outbid: true,
          newMessage: true,
        },
        maxAutoBidAmount: 1000,
        bidIncrement: 25,
        confirmBeforeBidding: true,
        currency: 'USD',
        language: 'en',
        timezone: 'America/New_York',
      };
      
      setSettings(userSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(userSettings)));
      setTempAnonymousName(userSettings.anonymousDisplayName);
    }
  }, [user]);

  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanges);
  }, [settings, originalSettings]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user context if anonymity settings changed
      if (settings.isAnonymousDisplay !== originalSettings.isAnonymousDisplay ||
          settings.anonymousDisplayName !== originalSettings.anonymousDisplayName) {
        await updateUser({
          isAnonymousDisplay: settings.isAnonymousDisplay,
          anonymousDisplayName: settings.anonymousDisplayName,
        });
      }
      
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setSuccess(true);
      
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    setTempAnonymousName(originalSettings.anonymousDisplayName);
    setEditingAnonymousName(false);
  };

  const handleAnonymousNameSave = () => {
    if (tempAnonymousName.trim()) {
      handleSettingChange('anonymousDisplayName', tempAnonymousName.trim());
      setEditingAnonymousName(false);
    }
  };

  const handleAnonymousNameCancel = () => {
    setTempAnonymousName(settings.anonymousDisplayName);
    setEditingAnonymousName(false);
  };

  if (!user) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Please Log In
          </Typography>
          <Typography color="text.secondary" paragraph>
            You need to be logged in to access settings.
          </Typography>
        </Container>
      </Layout>
    );
  }

  const renderPrivacySettings = () => (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          title="Anonymity Controls"
          subheader="Control how your identity appears to other users"
          avatar={<VisibilityIcon />}
        />
        <CardContent>
          <Stack spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.isAnonymousDisplay}
                  onChange={(e) => handleSettingChange('isAnonymousDisplay', e.target.checked)}
                />
              }
              label="Display anonymously"
            />
            
            {settings.isAnonymousDisplay && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Anonymous Display Name
                </Typography>
                {editingAnonymousName ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      value={tempAnonymousName}
                      onChange={(e) => setTempAnonymousName(e.target.value)}
                      placeholder="Enter anonymous name"
                      sx={{ flexGrow: 1 }}
                    />
                    <IconButton onClick={handleAnonymousNameSave} color="primary">
                      <CheckIcon />
                    </IconButton>
                    <IconButton onClick={handleAnonymousNameCancel}>
                      <CancelIcon />
                    </IconButton>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={settings.anonymousDisplayName || 'Anonymous User'}
                      avatar={<Avatar sx={{ width: 24, height: 24 }}>A</Avatar>}
                    />
                    <IconButton onClick={() => setEditingAnonymousName(true)} size="small">
                      <EditIcon />
                    </IconButton>
                  </Stack>
                )}
              </Box>
            )}
            
            <Divider />
            
            <Typography variant="h6">Public Information</Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showEmailPublicly}
                  onChange={(e) => handleSettingChange('showEmailPublicly', e.target.checked)}
                />
              }
              label="Show email address on profile"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showLocationPublicly}
                  onChange={(e) => handleSettingChange('showLocationPublicly', e.target.checked)}
                />
              }
              label="Show location on listings"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowDirectMessages}
                  onChange={(e) => handleSettingChange('allowDirectMessages', e.target.checked)}
                />
              }
              label="Allow direct messages from other users"
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );

  const renderNotificationSettings = () => (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          title="Email Notifications"
          subheader="Choose what email notifications you want to receive"
          avatar={<NotificationsIcon />}
        />
        <CardContent>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications.auctionUpdates}
                  onChange={(e) => handleSettingChange('emailNotifications.auctionUpdates', e.target.checked)}
                />
              }
              label="Auction updates and status changes"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications.bidNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications.bidNotifications', e.target.checked)}
                />
              }
              label="Bid confirmations and outbid notifications"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications.winNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications.winNotifications', e.target.checked)}
                />
              }
              label="Auction win notifications"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications.marketingEmails}
                  onChange={(e) => handleSettingChange('emailNotifications.marketingEmails', e.target.checked)}
                />
              }
              label="Marketing emails and promotions"
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Push Notifications"
          subheader="Real-time notifications in your browser"
        />
        <CardContent>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications.auctionEnding}
                  onChange={(e) => handleSettingChange('pushNotifications.auctionEnding', e.target.checked)}
                />
              }
              label="Auction ending soon alerts"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications.outbid}
                  onChange={(e) => handleSettingChange('pushNotifications.outbid', e.target.checked)}
                />
              }
              label="When you've been outbid"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications.newMessage}
                  onChange={(e) => handleSettingChange('pushNotifications.newMessage', e.target.checked)}
                />
              }
              label="New direct messages"
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );

  const renderBiddingSettings = () => (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          title="Bidding Preferences"
          subheader="Customize your bidding experience"
          avatar={<SettingsIcon />}
        />
        <CardContent>
          <Stack spacing={3}>
            <TextField
              label="Maximum Auto-bid Amount"
              type="number"
              value={settings.maxAutoBidAmount}
              onChange={(e) => handleSettingChange('maxAutoBidAmount', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: '$',
              }}
              helperText="Maximum amount for automatic bidding"
            />
            
            <TextField
              label="Default Bid Increment"
              type="number"
              value={settings.bidIncrement}
              onChange={(e) => handleSettingChange('bidIncrement', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: '$',
              }}
              helperText="Your preferred bid increment amount"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.confirmBeforeBidding}
                  onChange={(e) => handleSettingChange('confirmBeforeBidding', e.target.checked)}
                />
              }
              label="Always confirm before placing bids"
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );

  const renderAccountSettings = () => (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          title="Account Preferences"
          subheader="Language, currency, and regional settings"
          avatar={<AccountIcon />}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <FormLabel>Currency</FormLabel>
                <RadioGroup
                  value={settings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                >
                  <FormControlLabel value="USD" control={<Radio />} label="USD ($)" />
                  <FormControlLabel value="EUR" control={<Radio />} label="EUR (€)" />
                  <FormControlLabel value="GBP" control={<Radio />} label="GBP (£)" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <FormLabel>Language</FormLabel>
                <RadioGroup
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <FormControlLabel value="en" control={<Radio />} label="English" />
                  <FormControlLabel value="fr" control={<Radio />} label="Français" />
                  <FormControlLabel value="es" control={<Radio />} label="Español" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Timezone"
                select
                value={settings.timezone}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                <option value="Europe/Paris">Central European Time (CET)</option>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );

  const tabs = [
    { label: 'Privacy & Anonymity', component: renderPrivacySettings },
    { label: 'Notifications', component: renderNotificationSettings },
    { label: 'Bidding', component: renderBiddingSettings },
    { label: 'Account', component: renderAccountSettings },
  ];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Settings
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Customize your auction platform experience
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box mb={4}>
          {tabs[tabValue].component()}
        </Box>

        {/* Save/Reset Actions */}
        {hasChanges && (
          <Paper 
            sx={{ 
              p: 2, 
              position: 'sticky', 
              bottom: 16, 
              bgcolor: 'background.paper',
              boxShadow: 3,
              borderRadius: 2,
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
              <Typography color="text.secondary">
                You have unsaved changes
              </Typography>
              <Button
                variant="outlined"
                onClick={handleResetSettings}
                startIcon={<CancelIcon />}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveSettings}
                startIcon={<SaveIcon />}
                loading={loading}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Success/Error Messages */}
        <Snackbar
          open={success}
          autoHideDuration={3000}
          onClose={() => setSuccess(false)}
        >
          <Alert severity="success" onClose={() => setSuccess(false)}>
            Settings saved successfully!
          </Alert>
        </Snackbar>

        <Snackbar
          open={Boolean(error)}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}