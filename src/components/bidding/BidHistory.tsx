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
import { useLocale } from 'src/hooks/useLocale';

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

export default function BidHistory({ 
  auctionId, 
  currentBid, 
  refreshTrigger = 0,
  isLive = false,
  isConnected = true 
}: BidHistoryProps) {
  const { t } = useLocale();
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
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ 
          px: 2, 
          py: 1.5,
          backgroundColor: '#0F1419',
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2
        }}>
          <Skeleton variant="text" width={120} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        </Box>
        <Box sx={{ backgroundColor: '#ffffff', borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }}>
          {[...Array(3)].map((_, index) => (
            <Box key={index} display="flex" alignItems="center" px={1.5} py={1}>
              <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1.5 }} />
              <Box flexGrow={1}>
                <Skeleton variant="text" width="70%" height={16} />
                <Skeleton variant="text" width="50%" height={12} />
              </Box>
              <Skeleton variant="text" width="15%" height={16} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  const displayBids = expanded ? bids : bids.slice(0, 3);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Compact Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ 
        px: 2, 
        py: 1.5,
        backgroundColor: '#0F1419',
        color: 'white',
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
            📊 Recent Bids ({bids.length})
          </Typography>
          {isLive && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#4CAF50' : '#f44336',
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
              <Typography variant="caption" sx={{ 
                color: isConnected ? '#4CAF50' : '#f44336',
                fontWeight: 'bold',
                fontSize: '0.65rem'
              }}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </Typography>
            </Box>
          )}
        </Box>
        {bids.length > 3 && (
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {bids.length === 0 ? (
        <Box 
          textAlign="center" 
          py={3} 
          sx={{
            backgroundColor: '#f8f9fa',
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2
          }}
        >
          <GavelIcon sx={{ 
            fontSize: 36, 
            mb: 1, 
            opacity: 0.3,
            color: '#CE0E2D'
          }} />
          <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
            No bids yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Be the first to bid!
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0, backgroundColor: '#ffffff', borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }}>
          {displayBids.map((bid, index) => (
            <ListItem
              key={bid.id}
              sx={{
                px: 1.5,
                py: 1,
                borderBottom: index < displayBids.length - 1 ? '1px solid #f0f0f0' : 'none',
                backgroundColor: newBidAnimation === bid.id 
                  ? 'rgba(206, 14, 45, 0.1)' 
                  : bid.isWinning 
                  ? 'rgba(76, 175, 80, 0.05)'
                  : '#ffffff',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            >
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar
                  src={getBidderAvatar(bid.bidder)}
                  sx={{
                    bgcolor: bid.isWinning ? '#4CAF50' : '#CE0E2D',
                    width: 32,
                    height: 32,
                    fontSize: '0.8rem'
                  }}
                >
                  <GavelIcon sx={{ fontSize: 16 }} />
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        fontWeight: bid.isWinning ? 'bold' : 500,
                        color: '#0F1419',
                        fontSize: '0.85rem'
                      }}
                    >
                      {getBidderDisplay(bid.bidder)}
                    </Typography>
                    {bid.isWinning && (
                      <Chip
                        label="🏆"
                        size="small"
                        sx={{ 
                          height: 16, 
                          fontSize: '0.6rem',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          '& .MuiChip-label': { px: 0.5 }
                        }}
                      />
                    )}
                    {bid.isAutomatic && (
                      <Chip
                        label="🤖"
                        size="small"
                        variant="outlined"
                        sx={{ 
                          height: 16, 
                          fontSize: '0.6rem',
                          borderColor: '#666',
                          color: '#666',
                          '& .MuiChip-label': { px: 0.5 }
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {new Date(bid.timestamp).toLocaleTimeString()}
                  </Typography>
                }
              />
              
              <Box textAlign="right">
                <Typography
                  variant="subtitle2"
                  color={bid.isWinning ? 'success.main' : '#CE0E2D'}
                  fontWeight="bold"
                  sx={{ fontSize: '0.9rem' }}
                >
                  {formatCurrency(bid.amount)}
                </Typography>
                {newBidAnimation === bid.id && (
                  <Typography variant="caption" sx={{ 
                    color: '#CE0E2D',
                    fontSize: '0.55rem'
                  }}>
                    ✨ NEW
                  </Typography>
                )}
              </Box>
            </ListItem>
          ))}
          
          {!expanded && bids.length > 3 && (
            <ListItem sx={{ px: 1.5, py: 0.5, justifyContent: 'center' }}>
              <Typography
                variant="caption"
                color="primary"
                sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                onClick={() => setExpanded(true)}
              >
                +{bids.length - 3} more bids
              </Typography>
            </ListItem>
          )}
        </List>
      )}
      
      <Collapse in={expanded}>
        <Box p={1} textAlign="center" sx={{ backgroundColor: '#ffffff', borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }}>
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
            onClick={() => setExpanded(false)}
          >
            Show less
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}