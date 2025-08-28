'use client';

import { useState } from 'react';

import {
  Gavel as BidIcon,
  AccessTime as TimerIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Stack,
  Alert,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  CardContent,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';

import { useAuth, useAuthenticatedFetch } from 'src/hooks/useAuth';

import { formatCurrency } from 'src/lib/utils';

interface QuickBidDialogProps {
  productId: string;
  currentBid: number;
  bidIncrement: number;
  timeLeft?: string;
  auctionStatus?: 'SCHEDULED' | 'LIVE' | 'ENDED';
  onBidPlaced?: () => void;
}

export default function QuickBidDialog({
  productId,
  currentBid,
  bidIncrement,
  timeLeft,
  auctionStatus,
  onBidPlaced,
}: QuickBidDialogProps) {
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  
  const [open, setOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedBid, setSelectedBid] = useState<number>(currentBid + bidIncrement);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate quick bid amounts with affordability check
  const allQuickBids = [
    currentBid + bidIncrement, // x1
    currentBid + bidIncrement * 2, // x2
    currentBid + bidIncrement * 3, // x3
  ];
  
  // Add affordability information to each bid
  const quickBids = allQuickBids.map((amount, index) => ({
    amount,
    multiplier: index + 1,
    affordable: !user || user.balanceVirtual >= amount,
    isMinimum: amount === currentBid + bidIncrement,
  }));

  const handleBidSubmit = async () => {
    // Basic validation
    if (!selectedBid || selectedBid <= currentBid) {
      setError('Bid amount must be higher than the current bid');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to place a bid');
      return;
    }

    // Frontend validation before API call
    const minimumBid = currentBid + bidIncrement;
    if (selectedBid < minimumBid) {
      setError(`Minimum bid amount is ${formatCurrency(minimumBid)}`);
      return;
    }

    // Check user balance
    if (user.balanceVirtual < selectedBid) {
      setError(`Insufficient balance. You need ${formatCurrency(selectedBid)} but only have ${formatCurrency(user.balanceVirtual)}`);
      return;
    }

    // Validate auction status
    if (auctionStatus !== 'LIVE') {
      setError('This auction is not currently active');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedFetch(`/api/products/${productId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedBid }),
      });

      const data = await response.json();
      if (data.success) {
        setOpen(false);
        setCustomAmount('');
        setSelectedBid(currentBid + bidIncrement);
        if (onBidPlaced) onBidPlaced();
      } else {
        // Handle specific error types
        const errorMessage = data.error?.message || 'Failed to place bid';
        if (errorMessage.includes('Insufficient virtual balance') || errorMessage.includes('InsufficientBalanceError')) {
          setError('Insufficient balance to place this bid. Please add funds to your account or reduce your bid amount.');
        } else if (errorMessage.includes('Bid amount must be higher')) {
          setError('Your bid must be higher than the current bid. Please increase your bid amount.');
        } else if (errorMessage.includes('Auction has ended')) {
          setError('This auction has ended. You can no longer place bids.');
        } else if (errorMessage.includes('Auction not found')) {
          setError('This auction is no longer available.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      if (error instanceof Error) {
        if (error.message.includes('No authentication token')) {
          setError('Please log in to place a bid');
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          setError('Network error occurred. Please check your connection and try again.');
        } else if (error.message.includes('timeout')) {
          setError('Request timed out. Please try again.');
        } else {
          setError(`Error: ${error.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSelectedBid(numValue);
    }
  };

  if (auctionStatus !== 'LIVE') {
    return null;
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)', border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#0F1419', fontWeight: 'bold', mb: 2 }}>
            Quick Bid
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Please log in to participate in this auction
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => window.location.href = '/auth/login'}
            sx={{
              backgroundColor: '#CE0E2D',
              color: 'white',
              fontWeight: 600,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#B00C24',
                boxShadow: 'none',
              },
            }}
          >
            Login to Bid
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Quick Bid Card */}
      <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)', border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ color: '#0F1419', fontWeight: 'bold' }}>
              Quick Bid
            </Typography>
            {timeLeft && timeLeft !== 'Auction Ended' && (
              <Chip 
                icon={<TimerIcon />}
                label={timeLeft}
                sx={{ 
                  backgroundColor: '#CE0E2D', 
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'white' }
                }}
                size="small"
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
            Current bid: <strong style={{ color: '#CE0E2D' }}>{formatCurrency(currentBid)}</strong>
          </Typography>

          <Stack direction="row" spacing={1} mb={2}>
            {quickBids.map((bid, index) => (
              <Button
                key={index}
                variant={selectedBid === bid.amount ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  setSelectedBid(bid.amount);
                  setCustomAmount('');
                }}
                disabled={!bid.affordable}
                sx={{ 
                  flex: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  position: 'relative',
                  ...(selectedBid === bid.amount ? {
                    backgroundColor: '#CE0E2D',
                    '&:hover': { backgroundColor: '#B00C24' }
                  } : {
                    borderColor: bid.affordable ? '#CE0E2D' : '#e0e0e0',
                    color: bid.affordable ? '#CE0E2D' : '#999',
                    '&:hover': { 
                      borderColor: bid.affordable ? '#CE0E2D' : '#e0e0e0',
                      backgroundColor: bid.affordable ? 'rgba(206, 14, 45, 0.04)' : 'transparent'
                    }
                  }),
                  '&:disabled': {
                    borderColor: '#e0e0e0',
                    color: '#999',
                    backgroundColor: '#f5f5f5',
                    opacity: 0.6,
                    cursor: 'not-allowed'
                  }
                }}
              >
                <Box textAlign="center" sx={{ position: 'relative' }}>
                  <Typography variant="body2" fontWeight="bold">
                    +{formatCurrency(bidIncrement * bid.multiplier)}
                  </Typography>
                  {!bid.affordable && (
                    <Typography variant="caption" sx={{ 
                      color: '#999', 
                      fontSize: '0.6rem',
                      position: 'absolute',
                      bottom: -8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap'
                    }}>
                      Can't afford
                    </Typography>
                  )}
                </Box>
              </Button>
            ))}
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setOpen(true);
                setError(null);
              }}
              sx={{ flex: 1, borderColor: '#CE0E2D', color: '#CE0E2D', '&:hover': { borderColor: '#CE0E2D', backgroundColor: 'rgba(206, 14, 45, 0.04)' } }}
            >
              Enter Amount
            </Button>
          </Stack>

          <Button
            variant="contained"
            fullWidth
            startIcon={<BidIcon />}
            onClick={handleBidSubmit}
            disabled={auctionStatus !== 'LIVE' || loading}
            sx={{
              backgroundColor: '#CE0E2D',
              color: 'white',
              fontWeight: 600,
              py: 1.5,
              borderRadius: 2,
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
              }
            }}
          >
            {loading ? 'Placing Bid...' : `Place Bid - ${formatCurrency(selectedBid)}`}
          </Button>
        </CardContent>
      </Card>

      {/* Bid Confirmation Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center">
            <BidIcon sx={{ mr: 1, color: '#CE0E2D' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F1419' }}>
              Enter Your Amount to Bid
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box mb={3} p={2} sx={{ backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current highest bid: <strong style={{ color: '#CE0E2D' }}>{formatCurrency(currentBid)}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Minimum bid: <strong style={{ color: '#CE0E2D' }}>{formatCurrency(currentBid + bidIncrement)}</strong>
            </Typography>
            {user && (
              <Typography variant="body2" color="text.secondary">
                Your available balance: <strong style={{ color: user.balanceVirtual >= (currentBid + bidIncrement) ? '#28a745' : '#CE0E2D' }}>
                  {formatCurrency(user.balanceVirtual)}
                </strong>
                {user.balanceVirtual < (currentBid + bidIncrement) && (
                  <Typography variant="caption" display="block" sx={{ color: '#CE0E2D', mt: 0.5, fontSize: '0.7rem' }}>
                    ⚠️ Insufficient balance for minimum bid
                  </Typography>
                )}
              </Typography>
            )}
          </Box>

          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#0F1419', fontWeight: 'bold' }}>Quick Bid Options</Typography>
              
              <Stack direction="row" spacing={1}>
                {quickBids.map((bid, index) => (
                  <Button
                    key={index}
                    variant={selectedBid === bid.amount && !customAmount ? 'contained' : 'outlined'}
                    onClick={() => {
                      setSelectedBid(bid.amount);
                      setCustomAmount('');
                    }}
                    disabled={!bid.affordable}
                    sx={{ 
                      flex: 1,
                      borderRadius: 2,
                      fontWeight: 600,
                      minHeight: 64,
                      position: 'relative',
                      ...(selectedBid === bid.amount && !customAmount ? {
                        backgroundColor: '#CE0E2D',
                        '&:hover': { backgroundColor: '#B00C24' }
                      } : {
                        borderColor: bid.affordable ? '#CE0E2D' : '#e0e0e0',
                        color: bid.affordable ? '#CE0E2D' : '#999',
                        '&:hover': { 
                          borderColor: bid.affordable ? '#CE0E2D' : '#e0e0e0',
                          backgroundColor: bid.affordable ? 'rgba(206, 14, 45, 0.04)' : 'transparent'
                        }
                      }),
                      '&:disabled': {
                        borderColor: '#e0e0e0',
                        color: '#999',
                        backgroundColor: '#f5f5f5',
                        opacity: 0.6,
                        cursor: 'not-allowed'
                      }
                    }}
                  >
                    <Box textAlign="center">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(bid.amount)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.7 }}>
                        (+{bid.multiplier}x)
                      </Typography>
                      {!bid.affordable && (
                        <Typography variant="caption" sx={{ 
                          color: '#CE0E2D', 
                          fontSize: '0.6rem',
                          display: 'block',
                          mt: 0.5
                        }}>
                          ⚠️ Insufficient funds
                        </Typography>
                      )}
                    </Box>
                  </Button>
                ))}
              </Stack>
              
              {/* Show warning if all quick bids are unaffordable */}
              {quickBids.every(bid => !bid.affordable) && user && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: '#fff3cd', 
                  borderRadius: 2, 
                  border: '1px solid #ffeaa7' 
                }}>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.85rem' }}>
                    💳 All quick bid options exceed your available balance of {formatCurrency(user.balanceVirtual)}.
                    Please use the custom amount below or add funds to your account.
                  </Typography>
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#0F1419', fontWeight: 'bold' }}>
                Custom Amount
              </Typography>
              
              <TextField
                label="Your bid amount"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
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
                helperText={
                  customAmount && parseFloat(customAmount) <= currentBid
                    ? `Must be higher than current bid (${formatCurrency(currentBid)})`
                    : customAmount && user && parseFloat(customAmount) > user.balanceVirtual
                    ? `Amount exceeds your available balance (${formatCurrency(user.balanceVirtual)})`
                    : 'Enter an amount higher than the current bid'
                }
                error={customAmount !== '' && (parseFloat(customAmount) <= currentBid || (user && parseFloat(customAmount) > user.balanceVirtual))}
                fullWidth
              />
            </Box>
          </Stack>

          <Box mt={3} p={2} sx={{ backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ color: '#CE0E2D', fontWeight: 'bold' }} gutterBottom>
              Your bid: {formatCurrency(selectedBid)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You are about to place a bid of <strong>{formatCurrency(selectedBid)}</strong>. This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            sx={{
              color: '#6c757d',
              fontWeight: 500,
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': { backgroundColor: 'rgba(108, 117, 125, 0.04)' }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleBidSubmit}
            disabled={loading || selectedBid <= currentBid || (user && user.balanceVirtual < selectedBid)}
            startIcon={<BidIcon />}
            sx={{
              backgroundColor: '#CE0E2D',
              color: 'white',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#B00C24',
                boxShadow: 'none',
              },
              '&:disabled': {
                backgroundColor: '#CE0E2D',
                opacity: 0.6,
              }
            }}
          >
            {loading ? 'Placing Bid...' : `Confirm Bid - ${formatCurrency(selectedBid)}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}