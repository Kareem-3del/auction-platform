'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useLocale } from 'src/hooks/useLocale';
import { DashboardContent } from 'src/layouts/dashboard';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: 'BUYER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN';
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  emailVerified: boolean;
  balanceReal: number;
  balanceVirtual: number;
  anonymousDisplayName?: string;
  anonymousAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: string;
  kycStatus: string;
  isActive: boolean;
  balanceReal: string;
  balanceVirtual: string;
  anonymousDisplayName: string;
  anonymousAvatarUrl: string;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  balanceReal?: string;
  balanceVirtual?: string;
  anonymousAvatarUrl?: string;
}

export default function UserEditPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLocale();
  
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'BUYER',
    kycStatus: 'PENDING',
    isActive: true,
    balanceReal: '0',
    balanceVirtual: '0',
    anonymousDisplayName: '',
    anonymousAvatarUrl: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const userId = params?.id as string;

  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to fetch user');
      }

      const userData = data.data;
      setUser(userData);
      setFormData({
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        userType: userData.userType || 'BUYER',
        kycStatus: userData.kycStatus || 'PENDING',
        isActive: userData.isActive ?? true,
        balanceReal: userData.balanceReal?.toString() || '0',
        balanceVirtual: userData.balanceVirtual?.toString() || '0',
        anonymousDisplayName: userData.anonymousDisplayName || '',
        anonymousAvatarUrl: userData.anonymousAvatarUrl || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = t('users.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('users.validation.emailInvalid');
    }

    if (!formData.firstName) {
      newErrors.firstName = t('users.validation.firstNameRequired');
    }

    if (!formData.lastName) {
      newErrors.lastName = t('users.validation.lastNameRequired');
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = t('users.validation.phoneInvalid');
    }

    if (formData.balanceReal && (isNaN(Number(formData.balanceReal)) || Number(formData.balanceReal) < 0)) {
      newErrors.balanceReal = t('users.validation.balanceInvalid');
    }

    if (formData.balanceVirtual && (isNaN(Number(formData.balanceVirtual)) || Number(formData.balanceVirtual) < 0)) {
      newErrors.balanceVirtual = t('users.validation.balanceInvalid');
    }

    if (formData.anonymousAvatarUrl && formData.anonymousAvatarUrl.trim() !== '') {
      try {
        new URL(formData.anonymousAvatarUrl);
      } catch {
        newErrors.anonymousAvatarUrl = t('users.validation.urlInvalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updateData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        userType: formData.userType,
        kycStatus: formData.kycStatus,
        isActive: formData.isActive,
        balanceReal: parseFloat(formData.balanceReal),
        balanceVirtual: parseFloat(formData.balanceVirtual),
        anonymousDisplayName: formData.anonymousDisplayName || undefined,
        anonymousAvatarUrl: formData.anonymousAvatarUrl || undefined,
      };

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.details) {
          const fieldErrors: FormErrors = {};
          data.error.details.forEach((detail: any) => {
            fieldErrors[detail.field as keyof FormErrors] = detail.message;
          });
          setErrors(fieldErrors);
        }
        throw new Error(data.error?.message || data.message || 'Failed to update user');
      }

      setSuccessMessage(t('users.userUpdatedSuccessfully'));
      
      // Redirect to user view page after successful update
      setTimeout(() => {
        router.push(`/dashboard/users/${userId}`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) {
    return (
      <DashboardContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (error && !user) {
    return (
      <DashboardContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </DashboardContent>
    );
  }

  if (!user) {
    return (
      <DashboardContent>
        <Alert severity="warning">
          {t('users.userNotFound')}
        </Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('users.editUser')}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {t('navigation.dashboard')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              /
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('users.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              /
            </Typography>
            <Typography variant="body2" color="primary">
              {`${user.firstName} ${user.lastName}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              /
            </Typography>
            <Typography variant="body2" color="primary">
              {t('common.edit')}
            </Typography>
          </Stack>
        </Box>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => router.push(`/dashboard/users/${userId}`)}
        >
          {t('common.back')}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack alignItems="center" spacing={3}>
                  <Avatar
                    src={formData.anonymousAvatarUrl}
                    sx={{ width: 120, height: 120, fontSize: 48 }}
                  >
                    {formData.firstName[0]}{formData.lastName[0]}
                  </Avatar>
                  
                  <TextField
                    fullWidth
                    label={t('users.anonymousDisplayName')}
                    value={formData.anonymousDisplayName}
                    onChange={handleInputChange('anonymousDisplayName')}
                    helperText={t('users.anonymousDisplayNameHelp')}
                  />
                  
                  <TextField
                    fullWidth
                    label={t('users.avatarUrl')}
                    value={formData.anonymousAvatarUrl}
                    onChange={handleInputChange('anonymousAvatarUrl')}
                    error={!!errors.anonymousAvatarUrl}
                    helperText={errors.anonymousAvatarUrl || t('users.avatarUrlHelp')}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* User Details Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('users.personalInformation')}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('users.firstName')}
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('users.lastName')}
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('users.email')}
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      error={!!errors.email}
                      helperText={errors.email}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('users.phone')}
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      error={!!errors.phone}
                      helperText={errors.phone}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  {t('users.accountSettings')}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>{t('users.userType')}</InputLabel>
                      <Select
                        value={formData.userType}
                        onChange={handleInputChange('userType')}
                        label={t('users.userType')}
                      >
                        <MenuItem value="BUYER">{t('users.userType.buyer')}</MenuItem>
                        <MenuItem value="AGENT">{t('users.userType.agent')}</MenuItem>
                        <MenuItem value="ADMIN">{t('users.userType.admin')}</MenuItem>
                        <MenuItem value="SUPER_ADMIN">{t('users.userType.super_admin')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>{t('users.kycStatus')}</InputLabel>
                      <Select
                        value={formData.kycStatus}
                        onChange={handleInputChange('kycStatus')}
                        label={t('users.kycStatus')}
                      >
                        <MenuItem value="PENDING">{t('users.kycStatus.pending')}</MenuItem>
                        <MenuItem value="APPROVED">{t('users.kycStatus.approved')}</MenuItem>
                        <MenuItem value="REJECTED">{t('users.kycStatus.rejected')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={handleInputChange('isActive')}
                          color="primary"
                        />
                      }
                      label={t('users.activeAccount')}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  {t('users.balanceManagement')}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('users.realBalance')}
                      type="number"
                      value={formData.balanceReal}
                      onChange={handleInputChange('balanceReal')}
                      error={!!errors.balanceReal}
                      helperText={errors.balanceReal}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('users.virtualBalance')}
                      type="number"
                      value={formData.balanceVirtual}
                      onChange={handleInputChange('balanceVirtual')}
                      error={!!errors.balanceVirtual}
                      helperText={errors.balanceVirtual}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
                  <Button
                    variant="outlined"
                    onClick={() => router.push(`/dashboard/users/${userId}`)}
                    disabled={saving}
                  >
                    {t('common.cancel')}
                  </Button>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={saving}
                    startIcon={<SaveIcon />}
                    sx={{ bgcolor: '#CE0E2D', '&:hover': { bgcolor: '#B0122A' } }}
                  >
                    {t('common.saveChanges')}
                  </LoadingButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </DashboardContent>
  );
}