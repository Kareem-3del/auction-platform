'use client';

import { useState, useEffect } from 'react';

import {
  Save as SaveIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  Tab,
  Card,
  Tabs,
  Stack,
  Alert,
  Button,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useLocale } from 'src/hooks/useLocale';

interface Settings {
  virtualMultiplier: number;
  itemHideTimeoutDays: number;
}

export default function SettingsPage() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState<Settings>({
    virtualMultiplier: 1,
    itemHideTimeoutDays: 30,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/admin/settings');

        if (data.success) {
          setSettings(data.data.settings);
        } else {
          setError(data.error?.message || 'Failed to load settings');
        }
      } catch (err: any) {
        console.error('Error loading settings:', err);
        setError(err.response?.data?.error?.message || 'Failed to load settings');
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

      const data = await apiClient.put('/api/admin/settings', settings);

      if (data.success) {
        setSuccess('Settings saved successfully!');
        // Update local state with returned settings
        if (data.data.settings) {
          setSettings(data.data.settings);
        }
      } else {
        setError(data.error?.message || 'Failed to save settings');
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Settings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderBalanceSettings = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
          Virtual Balance Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure how virtual balance is calculated from real balance for bidding purposes
        </Typography>
      </Box>

      <TextField
        fullWidth
        label="Virtual Balance Multiplier"
        type="number"
        inputProps={{ min: 0.1, max: 100, step: 0.1 }}
        value={settings.virtualMultiplier}
        onChange={(e) => handleInputChange('virtualMultiplier', parseFloat(e.target.value))}
        helperText="This multiplier will be applied to users' real balance to calculate their virtual balance for bidding. Example: if multiplier is 3 and real balance is $100, virtual balance will be $300."
      />

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Current Setting:</strong> For every $1 in real balance, users will have $
          {settings.virtualMultiplier.toFixed(1)} available for bidding.
        </Typography>
      </Alert>
    </Stack>
  );

  const renderVisibilitySettings = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
          Item Visibility Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Control when completed auctions are hidden from public views
        </Typography>
      </Box>

      <TextField
        fullWidth
        label="Hide Timeout (Days)"
        type="number"
        inputProps={{ min: 1, max: 365, step: 1 }}
        value={settings.itemHideTimeoutDays}
        onChange={(e) => handleInputChange('itemHideTimeoutDays', parseInt(e.target.value))}
        helperText="Hide completed auctions from homepage and search results after this many days. Ended auctions will still be visible in admin panel and user's won auctions."
      />

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Current Setting:</strong> Ended auctions will be hidden from public views after{' '}
          {settings.itemHideTimeoutDays} days.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Note: This only affects homepage and search results. Direct links and admin views will
          continue to work.
        </Typography>
      </Alert>
    </Stack>
  );

  if (loading) {
    return (
      <DashboardContent>
        <Box
          sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}
        >
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
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary' }}>
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
              <Tab icon={<PaymentIcon />} label="Balance Settings" />
              <Tab icon={<VisibilityIcon />} label="Visibility Settings" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {activeTab === 0 && renderBalanceSettings()}
            {activeTab === 1 && renderVisibilitySettings()}
          </CardContent>
        </Card>
      </Box>
    </DashboardContent>
  );
}
