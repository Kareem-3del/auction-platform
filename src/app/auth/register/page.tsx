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
  Checkbox,
  MenuItem,
  TextField,
  Container,
  Typography,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { useAuth } from 'src/hooks/useAuth';

import { isValidEmail, isValidPhoneNumber } from 'src/lib/utils';

const userTypes = [
  { value: 'BUYER', label: 'Buyer' },
  { value: 'AGENT', label: 'Agent' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'BUYER',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Phone validation (optional)
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
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
      const result = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone || undefined,
        userType: formData.userType,
        agreeToTerms: formData.agreeToTerms,
      });
      
      if (result.success) {
        router.push('/dashboard');
      } else {
        setSubmitError(result.error || 'Registration failed');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => () => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
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
      <Container maxWidth="md">
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
              Create Your Account
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
              Join Lebanon Auction and start bidding today
            </Typography>
          </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={3}>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
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
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
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
              </Box>

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
                label="Phone Number (Optional)"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                error={!!errors.phone}
                helperText={errors.phone}
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
                select
                fullWidth
                label="Account Type"
                value={formData.userType}
                onChange={handleInputChange('userType')}
                disabled={isSubmitting}
                helperText="Choose your account type"
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
              >
                {userTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

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
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility('password')}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
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
                        aria-label="toggle confirm password visibility"
                        onClick={togglePasswordVisibility('confirmPassword')}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange('agreeToTerms')}
                    disabled={isSubmitting}
                    sx={{
                      color: '#CE0E2D',
                      '&.Mui-checked': {
                        color: '#CE0E2D',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" color="text.primary">
                    I agree to the{' '}
                    <MuiLink 
                      href="/terms" 
                      target="_blank" 
                      underline="hover"
                      sx={{ 
                        color: '#CE0E2D',
                        '&:hover': {
                          color: '#B00C24',
                        },
                      }}
                    >
                      Terms of Service
                    </MuiLink>{' '}
                    and{' '}
                    <MuiLink 
                      href="/privacy" 
                      target="_blank" 
                      underline="hover"
                      sx={{ 
                        color: '#CE0E2D',
                        '&:hover': {
                          color: '#B00C24',
                        },
                      }}
                    >
                      Privacy Policy
                    </MuiLink>
                  </Typography>
                }
              />
              {errors.agreeToTerms && (
                <Typography variant="caption" color="error">
                  {errors.agreeToTerms}
                </Typography>
              )}

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
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </Stack>
          </Box>

          {/* Links */}
          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <MuiLink
                component={Link}
                href="/auth/login"
                underline="hover"
                sx={{ 
                  fontWeight: 500,
                  color: '#CE0E2D',
                  '&:hover': {
                    color: '#B00C24',
                  },
                }}
              >
                Sign in
              </MuiLink>
            </Typography>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}