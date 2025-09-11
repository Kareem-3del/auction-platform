'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Visibility,
  VisibilityOff,
  Google,
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
  IconButton,
  InputAdornment,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';

import { useAuth } from 'src/hooks/useAuth';
import { useLocale } from 'src/hooks/useLocale';

import { isValidEmail } from 'src/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = t('validation.emailRequired');
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired');
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
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        router.push('/');
      } else {
        setSubmitError(result.error || t('auth.loginFailed'));
      }
    } catch (error) {
      setSubmitError(t('messages.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setSubmitError(null);
    
    try {
      // Load Google Identity Services
      if (typeof window !== 'undefined') {
        const { google } = window as any;
        
        if (!google) {
          throw new Error('Google Identity Services not loaded');
        }

        // Initialize Google Sign-In
        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              const result = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential }),
              });

              const data = await result.json();
              
              if (data.success) {
                // Store tokens in the format expected by auth context
                const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes from now
                
                const authTokens = {
                  accessToken: data.data.tokens.accessToken,
                  refreshToken: data.data.tokens.refreshToken,
                  expiresAt,
                };

                // Store in localStorage in the format expected by useAuth
                localStorage.setItem('auth_tokens', JSON.stringify(authTokens));
                localStorage.setItem('auth_user', JSON.stringify(data.data.user));
                
                // Also store the simple accessToken for backward compatibility
                localStorage.setItem('accessToken', data.data.tokens.accessToken);
                
                // Redirect to home page - auth context will pick up the stored tokens
                window.location.href = '/';
              } else {
                setSubmitError(data.error?.message || t('auth.loginFailed'));
              }
            } catch (error) {
              setSubmitError(t('messages.unexpectedError'));
            } finally {
              setIsGoogleLoading(false);
            }
          },
        });

        // Trigger the sign-in prompt
        google.accounts.id.prompt();
      }
    } catch (error) {
      setSubmitError(t('auth.googleLoginError'));
      setIsGoogleLoading(false);
    }
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
              {t('auth.welcomeBack')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
              {t('auth.signInContinue')}
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
                value={formData.email}
                onChange={handleInputChange('email')}
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

              <TextField
                fullWidth
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting || loading}
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
                    {t('auth.signingIn')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </Button>

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
                <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
                <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>
                  {t('auth.orContinueWith')}
                </Typography>
                <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
              </Box>

              {/* Google Sign-In Button */}
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isSubmitting || loading}
                startIcon={isGoogleLoading ? <CircularProgress size={20} /> : <Google />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderColor: '#dadce0',
                  color: '#3c4043',
                  backgroundColor: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                    borderColor: '#dadce0',
                    boxShadow: '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)',
                  },
                  '&:disabled': {
                    backgroundColor: '#ffffff',
                    borderColor: '#dadce0',
                    opacity: 0.6,
                  },
                }}
              >
                {isGoogleLoading ? t('auth.signingInWithGoogle') : t('auth.continueWithGoogle')}
              </Button>
            </Stack>
          </Box>

          {/* Links */}
          <Box mt={3}>
            <Box textAlign="right" mb={2}>
              <MuiLink
                component={Link}
                href="/auth/forgot-password"
                variant="body2"
                underline="hover"
                sx={{
                  color: '#CE0E2D',
                  fontWeight: 500,
                  '&:hover': {
                    color: '#B00C24',
                  },
                }}
              >
{t('auth.forgotPassword')}
              </MuiLink>
            </Box>
            
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                {t('auth.dontHaveAccount')}{' '}
                <MuiLink
                  component={Link}
                  href="/auth/register"
                  underline="hover"
                  sx={{ 
                    fontWeight: 500,
                    color: '#CE0E2D',
                    '&:hover': {
                      color: '#B00C24',
                    },
                  }}
                >
                  {t('auth.signUp')}
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}