'use client';

import { useState, useEffect } from 'react';

import {
  Gavel as GavelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  List,
  Chip,
  Avatar,
  ListItem,
  Skeleton,
  Collapse,
  Typography,
  IconButton,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';

import { formatDate, formatCurrency } from 'src/lib/utils';

interface BidHistoryItem {
  id: string;
  amount: number;
  bidder: {
    id: string;
    name: string;
    isAnonymous: boolean;
    avatar?: string;
  };
  timestamp: string;
  isWinning: boolean;
  isAutomatic: boolean;
}

interface BidHistoryProps {
  auctionId: string;
  currentBid: number;
  refreshTrigger?: number;
}

export default function BidHistory({ auctionId, currentBid, refreshTrigger = 0 }: BidHistoryProps) {
  const [bids, setBids] = useState<BidHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [newBidAnimation, setNewBidAnimation] = useState<string | null>(null);

  useEffect(() => {
    loadBidHistory();
  }, [auctionId, refreshTrigger]);

  const loadBidHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${auctionId}/bids`);
      const data = await response.json();
      
      if (data.success) {
        const newBids = data.data.bids;
        
        // Check for new bids to animate
        if (bids.length > 0 && newBids.length > bids.length) {
          const newestBid = newBids[0];
          setNewBidAnimation(newestBid.id);
          setTimeout(() => setNewBidAnimation(null), 2000);
        }
        
        setBids(newBids);
      }
    } catch (error) {
      console.error('Error loading bid history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBidderDisplay = (bidder: BidHistoryItem['bidder']) => {
    if (bidder.isAnonymous) {
      return 'Anonymous Bidder';
    }
    return bidder.name;
  };

  const getBidderAvatar = (bidder: BidHistoryItem['bidder']) => {
    if (bidder.isAnonymous) {
      return undefined;
    }
    return bidder.avatar;
  };

  if (loading) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bid History
        </Typography>
        {[...Array(3)].map((_, index) => (
          <Box key={index} display="flex" alignItems="center" mb={2}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Box flexGrow={1}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
            <Skeleton variant="text" width="20%" />
          </Box>
        ))}
      </Card>
    );
  }

  const displayBids = expanded ? bids : bids.slice(0, 5);

  return (
    <Card sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Bid History ({bids.length})
        </Typography>
        {bids.length > 5 && (
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      {bids.length === 0 ? (
        <Box textAlign="center" py={4} color="text.secondary">
          <GavelIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography>No bids yet. Be the first to bid!</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {displayBids.map((bid, index) => (
            <ListItem
              key={bid.id}
              sx={{
                px: 0,
                py: 1.5,
                borderBottom: index < displayBids.length - 1 ? 1 : 0,
                borderColor: 'divider',
                backgroundColor: newBidAnimation === bid.id ? 'action.hover' : 'transparent',
                borderRadius: newBidAnimation === bid.id ? 1 : 0,
                transition: 'all 0.3s ease-in-out',
                transform: newBidAnimation === bid.id ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={getBidderAvatar(bid.bidder)}
                  sx={{
                    bgcolor: bid.isWinning ? 'success.main' : 'primary.main',
                    border: bid.isWinning ? 2 : 0,
                    borderColor: 'success.main',
                  }}
                >
                  <GavelIcon />
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">
                      {getBidderDisplay(bid.bidder)}
                    </Typography>
                    {bid.isWinning && (
                      <Chip
                        label="Winning"
                        size="small"
                        color="success"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                    {bid.isAutomatic && (
                      <Chip
                        label="Auto"
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(bid.timestamp)}
                  </Typography>
                }
              />
              
              <Typography
                variant="h6"
                color={bid.isWinning ? 'success.main' : 'text.primary'}
                fontWeight={bid.isWinning ? 700 : 600}
              >
                {formatCurrency(bid.amount)}
              </Typography>
            </ListItem>
          ))}
          
          {!expanded && bids.length > 5 && (
            <ListItem sx={{ px: 0, justifyContent: 'center' }}>
              <Typography
                variant="button"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={() => setExpanded(true)}
              >
                Show {bids.length - 5} more bids
              </Typography>
            </ListItem>
          )}
        </List>
      )}
      
      <Collapse in={expanded}>
        <Box mt={2} textAlign="center">
          <Typography
            variant="button"
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={() => setExpanded(false)}
          >
            Show less
          </Typography>
        </Box>
      </Collapse>
    </Card>
  );
}