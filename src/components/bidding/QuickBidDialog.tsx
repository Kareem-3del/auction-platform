'use client';

import { useState, useEffect } from 'react';

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
import { useLocale } from 'src/hooks/useLocale';
import { formatCurrency } from 'src/lib/utils';
import type { BidDialogProps } from 'src/types/common';

export default function QuickBidDialog({
  productId,
  currentBid,
  bidIncrement,
  timeLeft,
  auctionStatus,
  onBidPlaced,
  isConnected = true,
  connectionError,
  onReconnect,
  lastBidUpdate,
  liveCurrentBid,
  liveBidCount,
  bidButtonDisabled = false,
  bidCooldownTime = 0,
}: BidDialogProps) {
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const { t } = useLocale();
  
  const [open, setOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedBid, setSelectedBid] = useState<number>(currentBid + bidIncrement);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveUserBalance, setLiveUserBalance] = useState<number | null>(null);
  
  // Real-time bid tracking
  const [displayCurrentBid, setDisplayCurrentBid] = useState<number>(currentBid);
  const [bidUpdateAnimation, setBidUpdateAnimation] = useState(false);
  const [newBidNotification, setNewBidNotification] = useState<string | null>(null);

  // Update display current bid when live bid comes in
  useEffect(() => {
    const newCurrentBid = liveCurrentBid ?? currentBid;
    if (newCurrentBid > displayCurrentBid) {
      setDisplayCurrentBid(newCurrentBid);
      setBidUpdateAnimation(true);
      
      // Show new bid notification if it's not from the current user (reduced timeout)
      if (lastBidUpdate && lastBidUpdate.amount === newCurrentBid) {
        setNewBidNotification(`New bid: ${formatCurrency(lastBidUpdate.amount)} by ${lastBidUpdate.bidderName}`);
        setTimeout(() => setNewBidNotification(null), 2000); // Reduced from 5 seconds to 2 seconds
      }
      
      // Animate and then remove animation (reduced timeout)
      setTimeout(() => setBidUpdateAnimation(false), 500); // Reduced from 1000ms to 500ms
    }
  }, [liveCurrentBid, currentBid, displayCurrentBid, lastBidUpdate]);

  // Auto-increment selected bid when current bid increases
  useEffect(() => {
    const newMinimumBid = displayCurrentBid + bidIncrement;
    
    // If selected bid is no longer valid (too low), auto-increment it
    if (selectedBid <= displayCurrentBid) {
      setSelectedBid(newMinimumBid);
      setCustomAmount(''); // Clear custom amount if it becomes invalid
    }
  }, [displayCurrentBid, bidIncrement, selectedBid]);

  // Calculate quick bid amounts with affordability check based on display current bid
  const allQuickBids = [
    displayCurrentBid + bidIncrement, // x1
    displayCurrentBid + bidIncrement * 2, // x2
    displayCurrentBid + bidIncrement * 3, // x3
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
    if (!selectedBid || selectedBid <= displayCurrentBid) {
      setError('Bid amount must be higher than the current bid');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to place a bid');
      return;
    }

    // Frontend validation before API call
    const minimumBid = displayCurrentBid + bidIncrement;
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
      
      // Use a more responsive fetch with shorter timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await authenticatedFetch(`/api/products/${productId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedBid }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle HTTP error responses
        const errorData = await response.json().catch(() => ({ error: { message: 'Network error occurred' } }));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        setError(errorMessage);
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Update live balance immediately
        if (user) {
          setLiveUserBalance(user.balanceVirtual - selectedBid);
        }
        
        setOpen(false);
        setCustomAmount('');
        setSelectedBid(displayCurrentBid + bidIncrement);
        // Trigger parent component refresh
        if (onBidPlaced) {
          onBidPlaced();
        }
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
        if (error.name === 'AbortError') {
          setError('Request was cancelled due to timeout. Please try again.');
        } else if (error.message.includes('No authentication token')) {
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

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
              Current bid: 
              <strong 
                style={{ 
                  color: '#CE0E2D',
                  marginLeft: '8px',
                  transition: 'all 0.3s ease',
                  ...(bidUpdateAnimation ? {
                    transform: 'scale(1.1)',
                    background: 'rgba(206, 14, 45, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  } : {})
                }}
              >
                {formatCurrency(displayCurrentBid)}
              </strong>
              {liveBidCount && liveBidCount > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#666' }}>
                  ({liveBidCount} bids)
                </span>
              )}
            </Typography>
            
            {/* New bid notification */}
            {newBidNotification && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#28a745', 
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(40, 167, 69, 0.1)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  animation: 'fadeInOut 5s ease-in-out',
                  '@keyframes fadeInOut': {
                    '0%': { opacity: 0, transform: 'translateY(-5px)' },
                    '10%': { opacity: 1, transform: 'translateY(0)' },
                    '90%': { opacity: 1, transform: 'translateY(0)' },
                    '100%': { opacity: 0, transform: 'translateY(-5px)' }
                  }
                }}
              >
                🎯 {newBidNotification}
              </Typography>
            )}
          </Box>

          {/* Enhanced Balance Display */}
          {user && (
            <Box sx={{ 
              mb: 2,
              p: 2,
              background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.05), rgba(206, 14, 45, 0.1))',
              borderRadius: 2,
              border: '1px solid rgba(206, 14, 45, 0.2)'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, textAlign: 'center' }}>
                💰 {t('auction.yourBalance')}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>{t('auction.virtualBalance')}</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: user.balanceVirtual >= (displayCurrentBid + bidIncrement) ? '#2E7D32' : '#d32f2f',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    ${(liveUserBalance ?? user.balanceVirtual).toFixed(2)}
                  </Typography>
                </Box>
                
                {user.balanceReal && user.balanceReal > 0 && (
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>{t('auction.realBalance')}</Typography>
                    <Typography variant="body2" sx={{ color: '#2E7D32', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      ${user.balanceReal.toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                {user.balanceVirtual < (displayCurrentBid + bidIncrement) ? (
                  <Typography variant="caption" sx={{ 
                    color: '#d32f2f', 
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    px: 1,
                    py: 0.3,
                    borderRadius: 1
                  }}>
                    ⚠️ {t('auction.insufficientForNext')}
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ 
                    color: '#2e7d32', 
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    px: 1,
                    py: 0.3,
                    borderRadius: 1
                  }}>
                    ✓ {t('auction.readyToBid')}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

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

          {/* Connection Status Warning */}
          {!isConnected && connectionError && (
            <Alert 
              severity="warning" 
              sx={{ mb: 1, fontSize: '0.8rem' }}
              action={
                onReconnect && (
                  <Button size="small" onClick={onReconnect} sx={{ color: '#CE0E2D' }}>
                    {t('auction.reconnect')}
                  </Button>
                )
              }
            >
              {t('auction.connectionIssue')}: {connectionError}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            startIcon={<BidIcon />}
            onClick={handleBidSubmit}
            disabled={auctionStatus !== 'LIVE' || loading || !isConnected || bidButtonDisabled}
            sx={{
              backgroundColor: bidButtonDisabled ? '#ff9800' : (isConnected ? '#CE0E2D' : '#666'),
              color: 'white',
              fontWeight: 600,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: bidButtonDisabled ? '#ff9800' : (isConnected ? '#B00C24' : '#666'),
                boxShadow: 'none',
              },
              '&:disabled': {
                backgroundColor: bidButtonDisabled ? '#ff9800' : '#ccc',
                color: bidButtonDisabled ? 'white' : '#888',
                opacity: bidButtonDisabled ? 1 : 0.6,
              }
            }}
          >
            {bidButtonDisabled ? `⏱️ Wait ${bidCooldownTime}s` : 
             loading ? t('auction.placingBid') : 
             !isConnected ? `🔄 ${t('auction.reconnecting')}...` : 
             `${t('auction.placeBid')} - ${formatCurrency(selectedBid)}`}
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
              Current highest bid: <strong style={{ color: '#CE0E2D' }}>{formatCurrency(displayCurrentBid)}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Minimum bid: <strong style={{ color: '#CE0E2D' }}>{formatCurrency(displayCurrentBid + bidIncrement)}</strong>
            </Typography>
            {user && (
              <Typography variant="body2" color="text.secondary">
                Your available balance: <strong style={{ color: user.balanceVirtual >= (displayCurrentBid + bidIncrement) ? '#28a745' : '#CE0E2D' }}>
                  {formatCurrency(user.balanceVirtual)}
                </strong>
                {user.balanceVirtual < (displayCurrentBid + bidIncrement) && (
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
                  customAmount && parseFloat(customAmount) <= displayCurrentBid
                    ? `Must be higher than current bid (${formatCurrency(displayCurrentBid)})`
                    : customAmount && user && parseFloat(customAmount) > user.balanceVirtual
                    ? `Amount exceeds your available balance (${formatCurrency(user.balanceVirtual)})`
                    : 'Enter an amount higher than the current bid'
                }
                error={customAmount !== '' && (parseFloat(customAmount) <= displayCurrentBid || (user && parseFloat(customAmount) > user.balanceVirtual))}
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
            disabled={loading || selectedBid <= displayCurrentBid || (user && user.balanceVirtual < selectedBid) || bidButtonDisabled}
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
            {bidButtonDisabled ? `⏱️ Wait ${bidCooldownTime}s` : loading ? 'Placing Bid...' : `Confirm Bid - ${formatCurrency(selectedBid)}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}