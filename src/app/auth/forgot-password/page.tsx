'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Email,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Alert,
  Stack,
  Button,
  TextField,
  Container,
  Typography,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';

import { useLocale } from 'src/hooks/useLocale';
import { isValidEmail } from 'src/lib/utils';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = t('validation.emailRequired');
    } else if (!isValidEmail(email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsEmailSent(true);
      } else {
        setSubmitError(data.message || t('auth.forgotPasswordFailed'));
      }
    } catch (error) {
      setSubmitError(t('messages.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({ ...errors, email: '' });
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  const handleResendEmail = () => {
    setIsEmailSent(false);
    setSubmitError(null);
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 82px)',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            backgroundColor: '#ffffff',
          }}
        >
          {!isEmailSent ? (
            <>
              {/* Header */}
              <Box textAlign="center" mb={4}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 'bold',
                    color: '#0F1419',
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    mb: 1,
                  }}
                >
                  {t('auth.forgotPasswordTitle')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                  {t('auth.forgotPasswordSubtitle')}
                </Typography>
              </Box>

              {/* Error Alert */}
              {submitError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {submitError}
                </Alert>
              )}

              {/* Form */}
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label={t('auth.emailAddress')}
                    type="email"
                    value={email}
                    onChange={handleInputChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    disabled={isSubmitting}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f8f9fa',
                        '&:hover': {
                          backgroundColor: '#ffffff',
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#ffffff',
                        },
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{ 
                      py: 1.5, 
                      mt: 2,
                      backgroundColor: '#CE0E2D',
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#B00C24',
                        boxShadow: 'none',
                      },
                      '&:disabled': {
                        backgroundColor: '#CE0E2D',
                        opacity: 0.6,
                      },
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                        {t('auth.sendingResetLink')}
                      </>
                    ) : (
                      t('auth.sendResetLink')
                    )}
                  </Button>
                </Stack>
              </Box>

              {/* Back to Login Link */}
              <Box mt={3} textAlign="center">
                <Button
                  variant="text"
                  startIcon={<ArrowBack />}
                  onClick={handleBackToLogin}
                  sx={{
                    color: '#CE0E2D',
                    fontWeight: 500,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#B00C24',
                    },
                  }}
                >
                  {t('auth.backToLogin')}
                </Button>
              </Box>
            </>
          ) : (
            <>
              {/* Success State */}
              <Box textAlign="center">
                <CheckCircle
                  sx={{
                    fontSize: 64,
                    color: '#4caf50',
                    mb: 2,
                  }}
                />
                
                <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 'bold',
                    color: '#0F1419',
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    mb: 2,
                  }}
                >
                  {t('auth.checkYourEmail')}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {t('auth.resetLinkSent')} <strong>{email}</strong>
                </Typography>

                <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                  {t('auth.resetLinkInstructions')}
                </Alert>

                <Stack spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleBackToLogin}
                    sx={{ 
                      py: 1.5,
                      backgroundColor: '#CE0E2D',
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#B00C24',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {t('auth.backToLogin')}
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handleResendEmail}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      borderColor: '#CE0E2D',
                      color: '#CE0E2D',
                      '&:hover': {
                        backgroundColor: 'rgba(206, 14, 45, 0.04)',
                        borderColor: '#B00C24',
                        color: '#B00C24',
                      },
                    }}
                  >
                    {t('auth.resendEmail')}
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Card>
      </Container>
    </Box>
  );
}