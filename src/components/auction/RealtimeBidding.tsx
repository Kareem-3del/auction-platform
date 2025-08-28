'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useRealtimeBidding } from '@/hooks/useRealtimeBidding';

import {
  Box,
  Alert,
  Stack,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';

interface RealtimeBiddingProps {
  productId: string;
  productTitle: string;
  initialBid?: number;
  initialBidCount?: number;
  bidIncrement?: number;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
}

export function RealtimeBidding({
  productId,
  productTitle,
  initialBid = 0,
  initialBidCount = 0,
  bidIncrement = 5,
  estimatedValueMin = 0,
  estimatedValueMax = 0,
}: RealtimeBiddingProps) {
  const { user, tokens } = useAuth();
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);

  const {
    isConnected,
    isAuthenticated,
    currentBid,
    bidCount,
    lastBid,
    auctionStatus,
    connectionError,
    reconnect,
  } = useRealtimeBidding({
    productId,
    onBidUpdate: (update) => {
      console.log('🔔 New bid update:', update);
      setBidSuccess(`New bid: $${update.bid.amount.toFixed(2)} by ${update.bid.bidderName}`);
      setTimeout(() => setBidSuccess(null), 5000);
    },
    onAuctionStatusChange: (status) => {
      console.log('🔔 Auction status changed:', status);
    },
    onError: (error) => {
      console.error('🔔 Bidding error:', error);
      setBidError(error);
    },
  });

  const displayCurrentBid = currentBid || initialBid;
  const displayBidCount = bidCount || initialBidCount;
  const minimumBid = displayCurrentBid + bidIncrement;

  useEffect(() => {
    // Set suggested bid amount
    if (!bidAmount) {
      setBidAmount(minimumBid.toFixed(2));
    }
  }, [minimumBid, bidAmount]);

  const handlePlaceBid = async () => {
    if (!user || !isAuthenticated) {
      setBidError('Please log in to place a bid');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minimumBid) {
      setBidError(`Minimum bid is $${minimumBid.toFixed(2)}`);
      return;
    }

    setIsPlacingBid(true);
    setBidError(null);
    setBidSuccess(null);

    try {
      const response = await fetch(`/api/products/${productId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          amount,
          isAnonymous: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBidSuccess(`Bid placed successfully: $${amount.toFixed(2)}`);
        setBidAmount((amount + bidIncrement).toFixed(2)); // Set next suggested bid
      } else {
        setBidError(data.error?.message || 'Failed to place bid');
      }
    } catch (error) {
      setBidError('Network error - please try again');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const getConnectionStatusColor = () => {
    if (!isConnected) return 'error';
    if (!isAuthenticated) return 'warning';
    return 'success';
  };

  const getConnectionStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (!isAuthenticated) return 'Connecting...';
    return 'Live';
  };

  return (
    <Box sx={{ maxWidth: 500 }}>
      <Stack spacing={3}>


        {/* Last Bid Info */}
        {lastBid && (
          <Box sx={{ 
            p: 2, 
            bgcolor: 'rgba(206, 14, 45, 0.05)', 
            borderRadius: 2,
            border: '1px solid rgba(206, 14, 45, 0.2)'
          }}>
            <Typography variant="body2" sx={{ color: '#0F1419', fontWeight: 'bold' }}>
              <strong>{lastBid.bidderName}</strong> bid <strong style={{ color: '#CE0E2D' }}>${lastBid.amount.toFixed(2)}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(lastBid.bidTime).toLocaleTimeString()}
            </Typography>
          </Box>
        )}

        {/* Connection Error */}
        {connectionError && (
          <Alert severity="warning" action={
            <Button size="small" onClick={reconnect}>
              Reconnect
            </Button>
          }>
            {connectionError}
          </Alert>
        )}

        {/* Bid Form */}
        {user && isAuthenticated ? (
          <Box sx={{ 
            p: 3, 
            bgcolor: '#f8f9fa', 
            borderRadius: 3,
            border: '1px solid #e0e0e0'
          }}>
            <Stack spacing={3}>
              {/* Virtual Balance Display */}
              <Box sx={{ 
                textAlign: 'center',
                p: 2,
                bgcolor: 'rgba(206, 14, 45, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(206, 14, 45, 0.2)'
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Your Virtual Balance
                </Typography>
                <Typography variant="h6" sx={{ color: '#CE0E2D', fontWeight: 'bold' }}>
                  ${user?.balanceVirtual?.toFixed(2) || '0.00'}
                </Typography>
              </Box>

              <TextField
                label="Your Bid Amount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: '#CE0E2D', fontWeight: 'bold' }}>$</Typography>,
                }}
                helperText={`Minimum bid: $${minimumBid.toFixed(2)}`}
                disabled={isPlacingBid || auctionStatus !== 'LIVE'}
                error={!!bidError}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#CE0E2D',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#CE0E2D',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#CE0E2D',
                  }
                }}
              />

              <Button
                variant="contained"
                size="large"
                onClick={handlePlaceBid}
                disabled={isPlacingBid || !isConnected || auctionStatus !== 'LIVE'}
                sx={{
                  bgcolor: '#CE0E2D',
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  '&:hover': { 
                    bgcolor: '#a50b25',
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#ccc',
                    color: '#666'
                  }
                }}
              >
                {isPlacingBid ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                    Placing Bid...
                  </>
                ) : (
                  'Place Bid'
                )}
              </Button>
            </Stack>
          </Box>
        ) : null}

        {/* Status Messages */}
        {bidError && (
          <Alert severity="error" onClose={() => setBidError(null)}>
            {bidError}
          </Alert>
        )}

        {bidSuccess && (
          <Alert severity="success" onClose={() => setBidSuccess(null)}>
            {bidSuccess}
          </Alert>
        )}

        {/* Auction Status */}
        {auctionStatus && auctionStatus !== 'LIVE' && (
          <Alert severity="warning">
            Auction Status: {auctionStatus}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}