'use client';

import { useState, useEffect } from 'react';

import {
  Save as SaveIcon,
  Email as EmailIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  Box,
  Tab,
  Card,
  Tabs,
  Stack,
  Alert,
  Button,
  Switch,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface SystemSettings {
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
    enablePaypal: boolean;
    enableStripe: boolean;
    enableCrypto: boolean;
    paymentFeePercentage: number;
    minimumWithdrawal: number;
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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: '',
      siteDescription: '',
      supportEmail: '',
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
      enablePaypal: true,
      enableStripe: true,
      enableCrypto: false,
      paymentFeePercentage: 2.5,
      minimumWithdrawal: 10,
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '',
      enableEmailNotifications: true,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/settings');

        if (data.success) {
          setSettings({ ...settings, ...data.data });
        } else {
          setError(data.error?.message || 'Failed to load settings');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const data = await apiClient.put('/api/settings', settings);

      if (data.success) {
        setSuccess('Settings saved successfully!');
      } else {
        setError(data.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const renderGeneralSettings = () => (
    <Stack spacing={3}>
      <TextField
        fullWidth
        label="Site Name"
        value={settings.general.siteName}
        onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
      />
      <TextField
        fullWidth
        label="Site Description"
        multiline
        rows={3}
        value={settings.general.siteDescription}
        onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
      />
      <TextField
        fullWidth
        label="Support Email"
        type="email"
        value={settings.general.supportEmail}
        onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
      />
      <FormControlLabel
        control={
          <Switch
            checked={settings.general.maintenanceMode}
            onChange={(e) => handleInputChange('general', 'maintenanceMode', e.target.checked)}
          />
        }
        label="Maintenance Mode"
      />
      <FormControlLabel
        control={
          <Switch
            checked={settings.general.registrationEnabled}
            onChange={(e) => handleInputChange('general', 'registrationEnabled', e.target.checked)}
          />
        }
        label="Enable User Registration"
      />
    </Stack>
  );

  const renderAuctionSettings = () => (
    <Stack spacing={3}>
      <TextField
        fullWidth
        label="Default Auction Duration (days)"
        type="number"
        value={settings.auction.defaultAuctionDuration}
        onChange={(e) => handleInputChange('auction', 'defaultAuctionDuration', parseInt(e.target.value))}
      />
      <TextField
        fullWidth
        label="Minimum Bid Increment ($)"
        type="number"
        value={settings.auction.minBidIncrement}
        onChange={(e) => handleInputChange('auction', 'minBidIncrement', parseFloat(e.target.value))}
      />
      <TextField
        fullWidth
        label="Maximum Bid Increment ($)"
        type="number"
        value={settings.auction.maxBidIncrement}
        onChange={(e) => handleInputChange('auction', 'maxBidIncrement', parseFloat(e.target.value))}
      />
      <TextField
        fullWidth
        label="Auto-Extend Time (minutes)"
        type="number"
        value={settings.auction.extendAuctionTime}
        onChange={(e) => handleInputChange('auction', 'extendAuctionTime', parseInt(e.target.value))}
      />
      <FormControlLabel
        control={
          <Switch
            checked={settings.auction.enableAutoBid}
            onChange={(e) => handleInputChange('auction', 'enableAutoBid', e.target.checked)}
          />
        }
        label="Enable Auto-Bidding"
      />
    </Stack>
  );

  const renderPaymentSettings = () => (
    <Stack spacing={3}>
      <FormControlLabel
        control={
          <Switch
            checked={settings.payment.enablePaypal}
            onChange={(e) => handleInputChange('payment', 'enablePaypal', e.target.checked)}
          />
        }
        label="Enable PayPal"
      />
      <FormControlLabel
        control={
          <Switch
            checked={settings.payment.enableStripe}
            onChange={(e) => handleInputChange('payment', 'enableStripe', e.target.checked)}
          />
        }
        label="Enable Stripe"
      />
      <FormControlLabel
        control={
          <Switch
            checked={settings.payment.enableCrypto}
            onChange={(e) => handleInputChange('payment', 'enableCrypto', e.target.checked)}
          />
        }
        label="Enable Cryptocurrency"
      />
      <TextField
        fullWidth
        label="Payment Fee Percentage (%)"
        type="number"
        value={settings.payment.paymentFeePercentage}
        onChange={(e) => handleInputChange('payment', 'paymentFeePercentage', parseFloat(e.target.value))}
      />
      <TextField
        fullWidth
        label="Minimum Withdrawal Amount ($)"
        type="number"
        value={settings.payment.minimumWithdrawal}
        onChange={(e) => handleInputChange('payment', 'minimumWithdrawal', parseFloat(e.target.value))}
      />
    </Stack>
  );

  const renderEmailSettings = () => (
    <Stack spacing={3}>
      <FormControlLabel
        control={
          <Switch
            checked={settings.email.enableEmailNotifications}
            onChange={(e) => handleInputChange('email', 'enableEmailNotifications', e.target.checked)}
          />
        }
        label="Enable Email Notifications"
      />
      <TextField
        fullWidth
        label="SMTP Host"
        value={settings.email.smtpHost}
        onChange={(e) => handleInputChange('email', 'smtpHost', e.target.value)}
      />
      <TextField
        fullWidth
        label="SMTP Port"
        type="number"
        value={settings.email.smtpPort}
        onChange={(e) => handleInputChange('email', 'smtpPort', parseInt(e.target.value))}
      />
      <TextField
        fullWidth
        label="SMTP Username"
        value={settings.email.smtpUser}
        onChange={(e) => handleInputChange('email', 'smtpUser', e.target.value)}
      />
      <TextField
        fullWidth
        label="SMTP Password"
        type="password"
        value={settings.email.smtpPassword}
        onChange={(e) => handleInputChange('email', 'smtpPassword', e.target.value)}
      />
      <TextField
        fullWidth
        label="From Email"
        type="email"
        value={settings.email.fromEmail}
        onChange={(e) => handleInputChange('email', 'fromEmail', e.target.value)}
      />
      <TextField
        fullWidth
        label="From Name"
        value={settings.email.fromName}
        onChange={(e) => handleInputChange('email', 'fromName', e.target.value)}
      />
    </Stack>
  );

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              System Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure platform settings and preferences
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Stack>

        {/* Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Settings Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab icon={<SettingsIcon />} label="General" />
              <Tab icon={<SecurityIcon />} label="Auction" />
              <Tab icon={<PaymentIcon />} label="Payment" />
              <Tab icon={<EmailIcon />} label="Email" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {activeTab === 0 && renderGeneralSettings()}
            {activeTab === 1 && renderAuctionSettings()}
            {activeTab === 2 && renderPaymentSettings()}
            {activeTab === 3 && renderEmailSettings()}
          </CardContent>
        </Card>
      </Box>
    </DashboardContent>
  );
}