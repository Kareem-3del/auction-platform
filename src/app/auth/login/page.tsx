'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Visibility,
  VisibilityOff,
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

import { isValidEmail } from 'src/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
        setSubmitError(result.error || 'Login failed');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred');
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
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
              Sign in to your Lebanon Auction account
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
                label="Email Address"
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
                label="Password"
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
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
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
                Forgot password?
              </MuiLink>
            </Box>
            
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don&apos;t have an account?{' '}
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
                  Sign up
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}