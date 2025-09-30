'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Button,
  Switch,
  TextField,
  Typography,
  CardContent,
  Alert,
  InputAdornment,
  Divider,
  FormControlLabel,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  AutoMode as AutoIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface AutoBidSetupProps {
  auctionId: string;
  currentBid?: number;
  minBidIncrement: number;
  maxBid?: number;
  onAutoBidUpdate?: (enabled: boolean, maxBid: number) => void;
}

export default function AutoBidSetup({
  auctionId,
  currentBid = 0,
  minBidIncrement,
  maxBid: initialMaxBid,
  onAutoBidUpdate,
}: AutoBidSetupProps) {
  const [enabled, setEnabled] = useState(!!initialMaxBid);
  const [maxBid, setMaxBid] = useState<string>(initialMaxBid?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const maxBidValue = parseFloat(maxBid);

      // Validation
      if (enabled && (!maxBid || maxBidValue <= 0)) {
        setError('Please enter a valid maximum bid amount');
        return;
      }

      if (enabled && maxBidValue <= currentBid) {
        setError(`Maximum bid must be greater than current bid ($${currentBid})`);
        return;
      }

      const authTokens = localStorage.getItem('auth_tokens');
      if (!authTokens) {
        setError('Authentication required');
        return;
      }

      const tokens = JSON.parse(authTokens);

      // Call API to set up auto-bidding
      const response = await fetch(`/api/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          amount: currentBid + minBidIncrement,
          isAutoBid: enabled,
          maxAmount: enabled ? maxBidValue : undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccess(
            enabled
              ? `Auto-bidding enabled with max bid of $${maxBidValue}`
              : 'Auto-bidding disabled'
          );
          onAutoBidUpdate?.(enabled, maxBidValue);
        } else {
          setError(result.error?.message || 'Failed to update auto-bid settings');
        }
      } else {
        const errorData = await response.json();

        // Handle rate limiting
        if (response.status === 429) {
          setError('Too many requests. Please wait a moment before trying again.');
        } else {
          setError(errorData.error?.message || 'Failed to update auto-bid settings');
        }
      }
    } catch (err) {
      console.error('Error updating auto-bid:', err);
      setError('Failed to update auto-bid settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setEnabled(false);
    setMaxBid('');
    // Could also call API to disable auto-bidding here
  };

  const suggestedMaxBids = [
    currentBid + minBidIncrement * 5,
    currentBid + minBidIncrement * 10,
    currentBid + minBidIncrement * 20,
  ];

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoIcon color="primary" />
              <Typography variant="h6">Auto-Bidding</Typography>
              <Tooltip title="Auto-bidding will automatically place bids on your behalf up to your maximum bid amount">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  disabled={loading}
                />
              }
              label={enabled ? 'Enabled' : 'Disabled'}
            />
          </Stack>

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

          <Divider />

          {/* Configuration */}
          {enabled && (
            <>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Set your maximum bid amount. The system will automatically bid up to this amount
                  when you're outbid.
                </Typography>
              </Box>

              <TextField
                label="Maximum Bid Amount"
                type="number"
                fullWidth
                value={maxBid}
                onChange={(e) => setMaxBid(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText={`Current bid: $${currentBid} | Minimum increment: $${minBidIncrement}`}
              />

              {/* Quick Suggestions */}
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Quick suggestions:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {suggestedMaxBids.map((amount) => (
                    <Button
                      key={amount}
                      size="small"
                      variant="outlined"
                      onClick={() => setMaxBid(amount.toString())}
                      disabled={loading}
                    >
                      ${amount}
                    </Button>
                  ))}
                </Stack>
              </Box>

              {/* Info Box */}
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2">
                  <strong>How it works:</strong> When another bidder places a bid higher than yours,
                  the system will automatically place a new bid on your behalf (current bid + minimum
                  increment) as long as it doesn't exceed your maximum bid amount.
                </Typography>
              </Alert>

              {/* Current Settings */}
              {maxBid && parseFloat(maxBid) > currentBid && (
                <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Your Next Auto-Bid:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${currentBid + minBidIncrement}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Maximum Auto-Bid:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${maxBid}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Potential Bids Remaining:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.floor((parseFloat(maxBid) - currentBid) / minBidIncrement)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              )}
            </>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {enabled && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDisable}
                disabled={loading}
              >
                Disable Auto-Bid
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading || (enabled && !maxBid)}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </Stack>

          {/* Warning */}
          {enabled && (
            <Alert severity="warning">
              <Typography variant="body2">
                Make sure you have sufficient balance to cover your maximum bid. Auto-bidding will
                stop if you run out of funds.
              </Typography>
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
