'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Error as ErrorIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Alert,
  Button,
  Typography,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';

interface VerificationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  email: string | null;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>({
    loading: true,
    success: false,
    error: null,
    email: null,
  });

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token && email) {
      verifyEmail(token, email);
    } else {
      setState({
        loading: false,
        success: false,
        error: 'Invalid verification link. Missing token or email.',
        email,
      });
    }
  }, [token, email]);

  const verifyEmail = async (token: string, email: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (data.success) {
        setState({
          loading: false,
          success: true,
          error: null,
          email,
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?verified=true');
        }, 3000);
      } else {
        setState({
          loading: false,
          success: false,
          error: data.error?.message || 'Email verification failed',
          email,
        });
      }
    } catch (error) {
      setState({
        loading: false,
        success: false,
        error: 'Network error occurred. Please try again.',
        email,
      });
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: null,
        }));
        alert('Verification email sent successfully! Please check your inbox.');
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: data.error?.message || 'Failed to send verification email',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Network error occurred. Please try again.',
      }));
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={2}
    >
      <Paper 
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: 4,
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        {state.loading && (
          <Box>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Verifying Your Email...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please wait while we verify your email address.
            </Typography>
          </Box>
        )}

        {!state.loading && state.success && (
          <Box>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 80, 
                color: 'success.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h4" gutterBottom color="success.main">
              Email Verified!
            </Typography>
            <Typography variant="h6" gutterBottom>
              Welcome to Auction Platform
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your email address has been successfully verified. 
              You can now access all features of your account.
            </Typography>

            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>What's next?</strong>
                <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                  <li>Complete your profile setup</li>
                  <li>Add funds to your wallet</li>
                  <li>Browse and bid on auctions</li>
                  <li>Set up your preferences</li>
                </ul>
              </Typography>
            </Alert>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Redirecting to login in a few seconds...
            </Typography>

            <Box mt={3}>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/auth/login?verified=true')}
                sx={{ mr: 2 }}
              >
                Go to Login
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>
          </Box>
        )}

        {!state.loading && !state.success && state.error && (
          <Box>
            <ErrorIcon 
              sx={{ 
                fontSize: 80, 
                color: 'error.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h5" gutterBottom color="error.main">
              Verification Failed
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {state.error}
            </Typography>

            {state.email && (
              <Box>
                <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="body2">
                    <strong>Possible reasons:</strong>
                    <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                      <li>The verification link has expired (links expire after 24 hours)</li>
                      <li>The link has already been used</li>
                      <li>The email address is already verified</li>
                      <li>The verification token is invalid</li>
                    </ul>
                  </Typography>
                </Alert>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Need a new verification link for <strong>{state.email}</strong>?
                </Typography>

                <Box mt={3}>
                  <Button
                    variant="contained"
                    startIcon={<EmailIcon />}
                    onClick={handleResendVerification}
                    disabled={state.loading}
                    sx={{ mr: 2 }}
                  >
                    Send New Verification Email
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/auth/login')}
                  >
                    Back to Login
                  </Button>
                </Box>
              </Box>
            )}

            {!state.email && (
              <Box mt={3}>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/auth/login')}
                >
                  Back to Login
                </Button>
              </Box>
            )}
          </Box>
        )}

        <Box mt={4} pt={3} borderTop="1px solid" borderColor="divider">
          <Typography variant="body2" color="text.secondary">
            Need help? {' '}
            <MuiLink href="/support" underline="hover">
              Contact Support
            </MuiLink>
            {' '} | {' '}
            <MuiLink 
              component={Link}
              href="/auth/register" 
              underline="hover"
            >
              Create New Account
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}