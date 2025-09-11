'use client';

import { useAuth } from 'src/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useRealtimeBidding } from 'src/hooks/useRealtimeBidding';
import { useLocale } from 'src/hooks/useLocale';

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
  isConnected?: boolean;
  connectionError?: string | null;
  onReconnect?: () => void;
}

export function RealtimeBidding({
  productId,
  productTitle,
  initialBid = 0,
  initialBidCount = 0,
  bidIncrement = 5,
  estimatedValueMin = 0,
  estimatedValueMax = 0,
  isConnected: propIsConnected,
  connectionError: propConnectionError,
  onReconnect: propOnReconnect,
}: RealtimeBiddingProps) {
  const { user, tokens, updateUser } = useAuth();
  const { t } = useLocale();
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);

  const {
    isConnected: hookIsConnected,
    isAuthenticated,
    currentBid,
    bidCount,
    lastBid,
    auctionStatus,
    connectionError: hookConnectionError,
    reconnect: hookReconnect,
  } = useRealtimeBidding({
    productId,
    onBidUpdate: (update) => {
      console.log('🔔 New bid update:', update);
      setBidSuccess(`New bid: $${update.bid.amount.toFixed(2)} by ${update.bid.bidderName}`);
      
      // If this is the user's own bid, update their balance
      if (user && update.bid.userId === user.id) {
        const newBalance = user.balanceVirtual - update.bid.amount;
        setLiveBalance(newBalance);
        // Also update the auth context
        updateUser({ balanceVirtual: newBalance });
      }
      
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

  // Use prop values if provided, otherwise fall back to hook values
  const isConnected = propIsConnected !== undefined ? propIsConnected : hookIsConnected;
  const connectionError = propConnectionError !== undefined ? propConnectionError : hookConnectionError;
  const reconnect = propOnReconnect || hookReconnect;
  
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
    if (!user) {
      setBidError('Please log in to place a bid');
      return;
    }

    if (!isConnected) {
      setBidError('Connection lost. Attempting to reconnect...');
      reconnect();
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
      const response = await fetch(`/api/auctions/${productId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          amount,
          isAnonymous: false,
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setBidSuccess(`🎉 Bid placed successfully: $${amount.toFixed(2)}`);
        setBidAmount((amount + bidIncrement).toFixed(2)); // Set next suggested bid
        
        // Update user's balance immediately after successful bid
        if (user) {
          const newBalance = user.balanceVirtual - amount;
          setLiveBalance(newBalance);
          updateUser({ balanceVirtual: newBalance });
        }
        
        setTimeout(() => setBidSuccess(null), 5000);
      } else {
        setBidError(data.error?.message || 'Failed to place bid');
      }
    } catch (error: any) {
      console.error('Bid placement error:', error);
      
      if (error.name === 'TimeoutError') {
        setBidError('Request timed out. Check your connection and try again.');
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        setBidError('Network error. Reconnecting...');
        // Trigger reconnection on network issues
        setTimeout(() => reconnect(), 1000);
      } else {
        setBidError(error.message || 'Failed to place bid. Please try again.');
      }
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
    if (!isConnected && connectionError?.includes('reconnecting')) return t('auction.reconnecting');
    if (!isConnected && connectionError?.includes('retrying')) return t('auction.reconnecting');
    if (!isConnected) return t('auction.disconnected');
    if (!isAuthenticated) return 'Authenticating...';
    return t('auction.liveBiddingActive');
  };

  return (
    <Box sx={{ maxWidth: 500 }}>
      <Stack spacing={3}>


        {/* Connection Status with Green Dot */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          p: 2, 
          backgroundColor: isConnected ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          border: `1px solid ${isConnected ? '#4CAF50' : '#f44336'}`,
          borderRadius: 2,
          mb: 2
        }}>
          {/* Connection Status Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: isConnected ? '#00ff00' : '#ff0000',
                boxShadow: isConnected ? '0 0 8px #00ff00' : '0 0 8px #ff0000',
                animation: isConnected ? 'pulse-dot 2s infinite' : 'none',
                '@keyframes pulse-dot': {
                  '0%': { boxShadow: '0 0 8px #00ff00' },
                  '50%': { boxShadow: '0 0 16px #00ff00, 0 0 24px #00ff00' },
                  '100%': { boxShadow: '0 0 8px #00ff00' },
                },
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: isConnected ? '#2E7D32' : '#C62828' }}>
              {getConnectionStatusText()}
            </Typography>
          </Box>
          
          {/* Connection Info */}
          <Box sx={{ flex: 1 }}>
            {isConnected && isAuthenticated ? (
              <Typography variant="caption" sx={{ color: '#2E7D32' }}>
                Current: <strong>${displayCurrentBid.toFixed(2)}</strong> • {displayBidCount} bids
              </Typography>
            ) : !isConnected ? (
              <Typography variant="caption" sx={{ color: '#C62828' }}>
                Attempting to reconnect...
              </Typography>
            ) : null}
          </Box>
          
          {/* Reconnect Button */}
          {!isConnected && (
            <Button 
              size="small" 
              onClick={reconnect} 
              variant="outlined" 
              sx={{ 
                borderColor: '#f44336', 
                color: '#f44336',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  borderColor: '#f44336'
                }
              }}
            >
              Reconnect
            </Button>
          )}
        </Box>

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

        {/* Connection Error - Only show if not covered by main status */}
        {connectionError && !isConnected && !connectionError.includes('reconnecting') && (
          <Alert severity="error" action={
            <Button size="small" onClick={reconnect}>
              Retry Now
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
              {/* Enhanced Balance Display */}
              <Box sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.05), rgba(206, 14, 45, 0.1))',
                borderRadius: 3,
                border: '2px solid rgba(206, 14, 45, 0.2)',
                boxShadow: '0 4px 12px rgba(206, 14, 45, 0.1)'
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center', fontSize: '0.9rem' }}>
                  💰 Your Account Balance
                </Typography>
                
                {/* Virtual Balance */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem', mb: 0.5 }}>
                    Virtual Balance
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: '#CE0E2D', 
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      transform: liveBalance !== null ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    ${(liveBalance ?? user?.balanceVirtual ?? 0).toFixed(2)}
                  </Typography>
                </Box>
                
                {/* Real Balance */}
                {user?.balanceReal && user.balanceReal > 0 && (
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem', mb: 0.5 }}>
                      Real Balance
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#28a745', fontWeight: 'bold' }}>
                      ${user.balanceReal.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                
                {/* Balance Status */}
                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  {user && user.balanceVirtual < displayCurrentBid + (bidIncrement || 1) ? (
                    <Typography variant="caption" sx={{ 
                      color: '#d32f2f', 
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}>
                      ⚠️ Insufficient for next bid
                    </Typography>
                  ) : (
                    <Typography variant="caption" sx={{ 
                      color: '#2e7d32', 
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(46, 125, 50, 0.1)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}>
                      ✓ Ready to bid
                    </Typography>
                  )}
                </Box>
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
                disabled={isPlacingBid || auctionStatus !== 'LIVE' || (!isConnected && !isPlacingBid)}
                sx={{
                  bgcolor: isConnected ? '#CE0E2D' : '#6c757d',
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  '&:hover': { 
                    bgcolor: isConnected ? '#a50b25' : '#6c757d',
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
                ) : !isConnected ? (
                  '🔄 Reconnecting...'
                ) : (
                  '💰 Place Bid'
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