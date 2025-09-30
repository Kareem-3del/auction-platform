'use client';

import { useState } from 'react';
import {
  Box,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  CircularProgress,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountBalance as BalanceIcon,
} from '@mui/icons-material';

interface BalanceAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentBalances: {
    balanceReal: number;
    balanceVirtual: number;
    balanceUSD?: number;
  };
  onSuccess?: () => void;
}

export default function BalanceAdjustmentDialog({
  open,
  onClose,
  userId,
  userName,
  currentBalances,
  onSuccess,
}: BalanceAdjustmentDialogProps) {
  const [balanceType, setBalanceType] = useState<'REAL' | 'VIRTUAL' | 'USD'>('REAL');
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const amountValue = parseFloat(amount);

      // Validation
      if (!amount || amountValue <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (!reason.trim()) {
        setError('Please provide a reason for this adjustment');
        return;
      }

      const authTokens = localStorage.getItem('auth_tokens');
      if (!authTokens) {
        setError('Authentication required');
        return;
      }

      const tokens = JSON.parse(authTokens);

      // Call admin API to adjust balance
      const response = await fetch(`/api/admin/users/${userId}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          balanceType,
          adjustmentType,
          amount: amountValue,
          reason,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccess('Balance adjusted successfully!');
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 1500);
        } else {
          setError(result.error?.message || 'Failed to adjust balance');
        }
      } else {
        const errorData = await response.json();

        // Handle specific error codes
        if (response.status === 403) {
          setError('You do not have permission to adjust balances');
        } else if (response.status === 429) {
          setError('Too many requests. Please wait a moment before trying again.');
        } else {
          setError(errorData.error?.message || 'Failed to adjust balance');
        }
      }
    } catch (err) {
      console.error('Error adjusting balance:', err);
      setError('Failed to adjust balance');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setReason('');
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  const getCurrentBalance = () => {
    switch (balanceType) {
      case 'REAL':
        return currentBalances.balanceReal;
      case 'VIRTUAL':
        return currentBalances.balanceVirtual;
      case 'USD':
        return currentBalances.balanceUSD || 0;
      default:
        return 0;
    }
  };

  const getNewBalance = () => {
    const current = getCurrentBalance();
    const amountValue = parseFloat(amount) || 0;
    return adjustmentType === 'ADD' ? current + amountValue : current - amountValue;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BalanceIcon color="primary" />
            <Typography variant="h6">Adjust User Balance</Typography>
          </Stack>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack spacing={3}>
          {/* User Info */}
          <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              User
            </Typography>
            <Typography variant="h6">{userName}</Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {userId}
            </Typography>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Balance Type */}
          <FormControl fullWidth>
            <InputLabel>Balance Type</InputLabel>
            <Select
              value={balanceType}
              label="Balance Type"
              onChange={(e) => setBalanceType(e.target.value as any)}
              disabled={loading}
            >
              <MenuItem value="REAL">Real Balance</MenuItem>
              <MenuItem value="VIRTUAL">Virtual Balance</MenuItem>
              <MenuItem value="USD">USD Balance</MenuItem>
            </Select>
          </FormControl>

          {/* Current Balance Display */}
          <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Current {balanceType} Balance:
              </Typography>
              <Typography variant="h6" color="info.main">
                ${getCurrentBalance().toFixed(2)}
              </Typography>
            </Stack>
          </Box>

          {/* Adjustment Type */}
          <FormControl component="fieldset">
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Adjustment Type
            </Typography>
            <RadioGroup
              row
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as any)}
            >
              <FormControlLabel
                value="ADD"
                control={<Radio />}
                label="Add Funds"
                disabled={loading}
              />
              <FormControlLabel
                value="SUBTRACT"
                control={<Radio />}
                label="Subtract Funds"
                disabled={loading}
              />
            </RadioGroup>
          </FormControl>

          {/* Amount */}
          <TextField
            label="Amount"
            type="number"
            fullWidth
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            helperText="Enter the amount to add or subtract"
          />

          {/* New Balance Preview */}
          {amount && parseFloat(amount) > 0 && (
            <Box
              sx={{
                p: 2,
                bgcolor: adjustmentType === 'ADD' ? 'success.lighter' : 'warning.lighter',
                borderRadius: 1,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  New Balance:
                </Typography>
                <Typography
                  variant="h6"
                  color={adjustmentType === 'ADD' ? 'success.main' : 'warning.main'}
                >
                  ${getNewBalance().toFixed(2)}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {adjustmentType === 'ADD' ? '+' : '-'}${parseFloat(amount).toFixed(2)}
              </Typography>
            </Box>
          )}

          {/* Reason */}
          <TextField
            label="Reason for Adjustment"
            fullWidth
            required
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            helperText="Provide a detailed reason for this balance adjustment (for audit purposes)"
          />

          {/* Warning */}
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Warning:</strong> This action will be logged in the audit trail and cannot be
              undone. Make sure the amount and reason are correct.
            </Typography>
          </Alert>

          {/* Actions */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !amount || !reason.trim()}
              color={adjustmentType === 'ADD' ? 'primary' : 'warning'}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                `${adjustmentType === 'ADD' ? 'Add' : 'Subtract'} $${amount || '0'}`
              )}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Dialog>
  );
}
