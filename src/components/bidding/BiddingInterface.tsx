'use client';

import { useState, useEffect } from 'react';

import {
  Add as AddIcon,
  Gavel as GavelIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Visibility as WatchIcon,
  TrendingUp as AutoBidIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Stack,
  Alert,
  Paper,
  Button,
  Dialog,
  Switch,
  Slider,
  Divider,
  Collapse,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControlLabel,
} from '@mui/material';

import { useAuth } from 'src/hooks/useAuth';

import { formatCurrency } from 'src/lib/utils';

interface BiddingInterfaceProps {
  auctionId: string;
  currentBid: number;
  minimumBid: number;
  bidIncrement: number;
  endTime: string;
  isActive: boolean;
  onBidPlaced: () => void;
}

export default function BiddingInterface({
  auctionId,
  currentBid,
  minimumBid,
  bidIncrement,
  endTime,
  isActive,
  onBidPlaced,
}: BiddingInterfaceProps) {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState(currentBid + bidIncrement);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Bidding privacy options
  const [bidAnonymously, setBidAnonymously] = useState(false);
  const [customBidderName, setCustomBidderName] = useState('');
  
  // Auto-bid dialog state
  const [autoBidDialogOpen, setAutoBidDialogOpen] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState(currentBid + bidIncrement * 10);
  const [autoBidIncrement, setAutoBidIncrement] = useState(bidIncrement);
  
  // Watchlist state
  const [isWatching, setIsWatching] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    setBidAmount(currentBid + bidIncrement);
    setMaxBidAmount(currentBid + bidIncrement * 10);
  }, [currentBid, bidIncrement]);

  // Temporarily disable watchlist check until endpoints are created
  // useEffect(() => {
  //   checkWatchlistStatus();
  // }, [auctionId]);

  const checkWatchlistStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/products/${auctionId}/watchlist/check`);
      const data = await response.json();
      if (data.success) {
        setIsWatching(data.data.isWatching);
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const minBid = currentBid + bidIncrement;
  const quickBidOptions = [
    { label: '+1x', value: minBid, description: `${formatCurrency(minBid)}` },
    { label: '+2x', value: minBid + bidIncrement, description: `${formatCurrency(minBid + bidIncrement)}` },
    { label: '+3x', value: minBid + (bidIncrement * 2), description: `${formatCurrency(minBid + (bidIncrement * 2))}` },
    { label: 'Custom', value: bidAmount, description: 'Enter amount', isCustom: true },
  ];

  const placeBid = async () => {
    if (!user) {
      setError('Please sign in to place a bid');
      return;
    }

    if (bidAmount < currentBid + bidIncrement) {
      setError(`Minimum bid is ${formatCurrency(currentBid + bidIncrement)}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/products/${auctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: bidAmount,
          isAnonymous: bidAnonymously,
          customName: customBidderName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Bid placed successfully!');
        onBidPlaced();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error?.message || 'Failed to place bid');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setupAutoBid = async () => {
    if (!user) {
      setError('Please sign in to set up auto-bid');
      return;
    }

    try {
      const response = await fetch(`/api/products/${auctionId}/auto-bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxAmount: maxBidAmount,
          increment: autoBidIncrement,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Auto-bid setup successfully!');
        setAutoBidDialogOpen(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error?.message || 'Failed to setup auto-bid');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    }
  };

  const toggleWatchlist = async () => {
    if (!user) {
      setError('Please sign in to add to watchlist');
      return;
    }

    setWatchlistLoading(true);

    try {
      const response = await fetch(`/api/products/${auctionId}/watchlist`, {
        method: isWatching ? 'DELETE' : 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setIsWatching(!isWatching);
        setSuccess(isWatching ? 'Removed from watchlist' : 'Added to watchlist');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error?.message || 'Failed to update watchlist');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (!isActive) {
    return (
      <Card sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          This auction has ended or is not yet active.
        </Alert>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<WatchIcon />}
          onClick={toggleWatchlist}
          disabled={watchlistLoading}
        >
          {isWatching ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </Button>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Place Your Bid
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box mb={3}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Current Bid: {formatCurrency(currentBid)}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Minimum Bid: {formatCurrency(currentBid + bidIncrement)}
        </Typography>
      </Box>

      {/* Quick Bid Options */}
      <Box mb={3}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Quick Bid Options
        </Typography>
        <Grid container spacing={1}>
          {quickBidOptions.map((option) => (
            <Grid item xs={3} key={option.label}>
              <Button
                fullWidth
                variant={bidAmount === option.value ? 'contained' : 'outlined'}
                color={bidAmount === option.value ? 'primary' : 'inherit'}
                onClick={() => {
                  if (!option.isCustom) {
                    setBidAmount(option.value);
                  }
                }}
                disabled={option.isCustom}
                sx={{
                  flexDirection: 'column',
                  py: 1.5,
                  minHeight: 60,
                  fontSize: '0.9rem',
                  fontWeight: bidAmount === option.value ? 600 : 400,
                  borderColor: bidAmount === option.value ? 'primary.main' : 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: option.isCustom ? 'transparent' : undefined,
                  },
                }}
              >
                <Typography variant="caption" component="div" sx={{ fontWeight: 600 }}>
                  {option.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.isCustom ? option.description : option.description}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Custom Bid Amount - Enhanced */}
      <Box mb={3}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Or Enter Custom Amount
        </Typography>
        <TextField
          fullWidth
          label="Your Bid Amount"
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(Number(e.target.value))}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            endAdornment: (
              <InputAdornment position="end">
                <Stack direction="row" spacing={0.5}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setBidAmount(Math.max(bidAmount - bidIncrement, minBid))}
                    sx={{ minWidth: 36, p: 0.5, borderRadius: '50%' }}
                    disabled={bidAmount <= minBid}
                  >
                    <RemoveIcon fontSize="small" />
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setBidAmount(bidAmount + bidIncrement)}
                    sx={{ minWidth: 36, p: 0.5, borderRadius: '50%' }}
                  >
                    <AddIcon fontSize="small" />
                  </Button>
                </Stack>
              </InputAdornment>
            ),
          }}
          helperText={`Minimum: ${formatCurrency(minBid)} • Increment: ${formatCurrency(bidIncrement)}`}
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '1.1rem',
              fontWeight: 600,
            },
          }}
        />
      </Box>

      {/* Bid Slider */}
      <Box mb={3}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Adjust bid amount:
        </Typography>
        <Slider
          value={bidAmount}
          min={currentBid + bidIncrement}
          max={(currentBid + bidIncrement) * 3}
          step={bidIncrement}
          onChange={(_, value) => setBidAmount(value as number)}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => formatCurrency(value)}
          sx={{ mb: 1 }}
        />
        <Box display="flex" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Min: {formatCurrency(currentBid + bidIncrement)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Max: {formatCurrency((currentBid + bidIncrement) * 3)}
          </Typography>
        </Box>
      </Box>

      {/* Privacy Options */}
      <Box mb={3}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Privacy Settings
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={bidAnonymously}
                  onChange={(e) => setBidAnonymously(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Hide my identity
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Show as "Anonymous Bidder" in bid history
                  </Typography>
                </Box>
              }
            />
            
            {!bidAnonymously && (
              <Collapse in={!bidAnonymously}>
                <TextField
                  fullWidth
                  size="small"
                  label="Display Name (Optional)"
                  value={customBidderName}
                  onChange={(e) => setCustomBidderName(e.target.value)}
                  placeholder={`${user?.firstName} ${user?.lastName}`.trim() || 'Your Name'}
                  helperText="Leave empty to use your account name"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment>,
                  }}
                />
              </Collapse>
            )}
          </Stack>
        </Paper>
      </Box>

      {/* Action Buttons */}
      <Stack spacing={2}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<GavelIcon />}
          onClick={placeBid}
          disabled={isSubmitting || !user || bidAmount < minBid}
          sx={{
            py: 2,
            fontSize: '1.2rem',
            fontWeight: 700,
            borderRadius: 2,
            background: (theme) => 
              isSubmitting || !user || bidAmount < minBid
                ? undefined
                : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
            boxShadow: (theme) => 
              isSubmitting || !user || bidAmount < minBid
                ? undefined
                : `0 4px 20px ${theme.palette.primary.main}40`,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: (theme) => `0 6px 25px ${theme.palette.primary.main}60`,
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isSubmitting ? (
            'Placing Bid...'
          ) : !user ? (
            'Sign In to Bid'
          ) : bidAmount < minBid ? (
            `Minimum Bid: ${formatCurrency(minBid)}`
          ) : (
            <>
              Place Bid
              <Box component="span" sx={{ mx: 1, fontSize: '1.3rem', fontWeight: 800 }}>
                {formatCurrency(bidAmount)}
              </Box>
            </>
          )}
        </Button>

        <Stack direction="row" spacing={2}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AutoBidIcon />}
            onClick={() => setAutoBidDialogOpen(true)}
            disabled={!user}
          >
            Auto Bid
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={<WatchIcon />}
            onClick={toggleWatchlist}
            disabled={watchlistLoading || !user}
            color={isWatching ? 'error' : 'primary'}
          >
            {isWatching ? 'Unwatch' : 'Watch'}
          </Button>
        </Stack>
      </Stack>

      {!user && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Please <strong>sign in</strong> to place bids and use advanced features.
        </Alert>
      )}

      {/* Auto Bid Setup Dialog */}
      <Dialog open={autoBidDialogOpen} onClose={() => setAutoBidDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Setup Auto Bid</DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Auto bid will automatically place bids up to your maximum amount when you're outbid.
          </Typography>
          
          <TextField
            fullWidth
            label="Maximum Bid Amount"
            type="number"
            value={maxBidAmount}
            onChange={(e) => setMaxBidAmount(Number(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Auto Bid Increment"
            type="number"
            value={autoBidIncrement}
            onChange={(e) => setAutoBidIncrement(Number(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            helperText={`Minimum increment: ${formatCurrency(bidIncrement)}`}
            sx={{ mb: 3 }}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            <strong>Summary:</strong><br />
            - Maximum amount you'll spend: {formatCurrency(maxBidAmount)}<br />
            - Auto bid increment: {formatCurrency(autoBidIncrement)}<br />
            - Estimated number of bids: {Math.floor((maxBidAmount - currentBid) / autoBidIncrement)}
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setAutoBidDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={setupAutoBid}
            disabled={maxBidAmount <= currentBid + bidIncrement}
          >
            Setup Auto Bid
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}