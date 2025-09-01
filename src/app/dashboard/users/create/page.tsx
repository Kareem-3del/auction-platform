'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Save as SaveIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  Switch,
  Select,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  FormControlLabel,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useLocale } from 'src/hooks/useLocale';

export default function CreateUserPage() {
  const router = useRouter();
  const { t } = useLocale();
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'BUYER',
    isActive: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = t('users.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('users.emailInvalid');
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('users.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('users.lastNameRequired');
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('users.phoneInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const data = await apiClient.post('/api/users', formData);

      if (data.success) {
        setSuccessMessage(t('users.createSuccess'));
        setTimeout(() => {
          router.push('/dashboard/users');
        }, 1500);
      } else {
        setErrors({ general: data.error?.message || t('users.createError') });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ general: t('users.unexpectedError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/users');
  };

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              {t('users.createTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('users.createDescription')}
            </Typography>
          </Box>
        </Stack>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3} sx={{ maxWidth: 600 }}>
            {/* Personal Information */}
            <Card sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6">
                  {t('users.personalInfo')}
                </Typography>
              </Stack>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label={t('users.email')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                  placeholder="user@example.com"
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label={t('users.firstName')}
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    required
                    placeholder={t('users.firstNamePlaceholder')}
                  />
                  
                  <TextField
                    fullWidth
                    label={t('users.lastName')}
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    required
                    placeholder={t('users.lastNamePlaceholder')}
                  />
                </Stack>

                <TextField
                  fullWidth
                  label={t('users.phone')}
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={!!errors.phone}
                  helperText={errors.phone || t('users.phoneHelp')}
                  placeholder="+1 (555) 123-4567"
                />
              </Stack>
            </Card>

            {/* Account Settings */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('users.accountSettings')}
              </Typography>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('users.userType')}</InputLabel>
                  <Select
                    value={formData.userType}
                    label={t('users.userType')}
                    onChange={(e) => handleInputChange('userType', e.target.value)}
                  >
                    <MenuItem value="BUYER">{t('users.typeBuyer')}</MenuItem>
                    <MenuItem value="AGENT">{t('users.typeAgent')}</MenuItem>
                    <MenuItem value="ADMIN">{t('users.typeAdmin')}</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    />
                  }
                  label={t('users.activeStatus')}
                />
              </Stack>
            </Card>

            {/* Notice */}
            <Alert severity="info">
              {t('users.createNotice')}
            </Alert>

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('users.creating') : t('users.createUser')}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </DashboardContent>
  );
}