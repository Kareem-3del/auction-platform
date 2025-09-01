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
    <Card sx={{ 
      p: 3, 
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: 3,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      position: 'relative'
    }}>
      {/* Enhanced Header with Live Status */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" sx={{ color: '#0F1419', fontWeight: 'bold', fontSize: '1.1rem' }}>
{t('auction.bidHistory')} ({bids.length})
          </Typography>
          {isLive && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#00ff00' : '#ff0000',
                  boxShadow: isConnected ? '0 0 6px #00ff00' : '0 0 6px #ff0000',
                  animation: isConnected ? 'blink 1.5s infinite' : 'flash 0.5s infinite',
                  '@keyframes blink': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.3 },
                    '100%': { opacity: 1 },
                  },
                  '@keyframes flash': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.3 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
              <Typography variant="caption" sx={{ 
                color: isConnected ? '#2E7D32' : '#d32f2f',
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}>
                {isConnected ? t('auction.live') : t('auction.disconnected')}
              </Typography>
            </Box>
          )}
        </Box>
        {bids.length > 5 && (
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            sx={{
              color: '#CE0E2D',
              '&:hover': {
                backgroundColor: 'rgba(206, 14, 45, 0.04)'
              }
            }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      {bids.length === 0 ? (
        <Box 
          textAlign="center" 
          py={6} 
          sx={{
            backgroundColor: '#f8f9fa',
            borderRadius: 2,
            border: '1px dashed #e0e0e0'
          }}
        >
          <GavelIcon sx={{ 
            fontSize: 64, 
            mb: 2, 
            opacity: 0.3,
            color: '#CE0E2D'
          }} />
          <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
            {t('auction.noBidsYet')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('auction.beFirstToBid')}
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {displayBids.map((bid, index) => (
            <ListItem
              key={bid.id}
              sx={{
                px: 2,
                py: 2,
                mb: index < displayBids.length - 1 ? 1 : 0,
                backgroundColor: newBidAnimation === bid.id 
                  ? 'rgba(206, 14, 45, 0.1)' 
                  : bid.isWinning 
                  ? 'rgba(76, 175, 80, 0.05)'
                  : '#ffffff',
                border: bid.isWinning ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid #f0f0f0',
                borderRadius: 2,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: newBidAnimation === bid.id ? 'scale(1.02)' : 'scale(1)',
                boxShadow: newBidAnimation === bid.id 
                  ? '0 4px 12px rgba(206, 14, 45, 0.15)' 
                  : bid.isWinning
                  ? '0 2px 8px rgba(76, 175, 80, 0.1)'
                  : '0 1px 3px rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={getBidderAvatar(bid.bidder)}
                  sx={{
                    bgcolor: bid.isWinning ? '#4CAF50' : '#CE0E2D',
                    border: bid.isWinning ? '2px solid #4CAF50' : '2px solid #CE0E2D',
                    borderColor: bid.isWinning ? '#4CAF50' : '#CE0E2D',
                    width: 48,
                    height: 48,
                    boxShadow: bid.isWinning ? '0 2px 8px rgba(76, 175, 80, 0.3)' : '0 2px 8px rgba(206, 14, 45, 0.2)'
                  }}
                >
                  <GavelIcon sx={{ fontSize: 24 }} />
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography 
                      variant="subtitle2"
                      sx={{ 
                        fontWeight: bid.isWinning ? 'bold' : 600,
                        color: '#0F1419',
                        fontSize: '0.95rem'
                      }}
                    >
                      {getBidderDisplay(bid.bidder)}
                    </Typography>
                    <Box display="flex" gap={0.5} mt={0.5}>
                      {bid.isWinning && (
                        <Chip
                          label={`🏆 ${t('auction.winning')}`}
                          size="small"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      )}
                      {bid.isAutomatic && (
                        <Chip
                          label={`🤖 ${t('auction.auto')}`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem',
                            borderColor: '#666',
                            color: '#666',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                }
                secondary={
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {formatDate(bid.timestamp)}
                  </Typography>
                }
              />
              
              <Box textAlign="right">
                <Typography
                  variant="h6"
                  color={bid.isWinning ? 'success.main' : '#CE0E2D'}
                  fontWeight={bid.isWinning ? 'bold' : 600}
                  sx={{
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {formatCurrency(bid.amount)}
                </Typography>
                {newBidAnimation === bid.id && (
                  <Typography variant="caption" sx={{ 
                    color: '#CE0E2D',
                    fontWeight: 'bold',
                    fontSize: '0.6rem'
                  }}>
                    ✨ {t('auction.newBid')}
                  </Typography>
                )}
              </Box>
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
                {t('common.show')} {bids.length - 5} {t('auction.bids')}
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
            {t('common.showLess')}
          </Typography>
        </Box>
      </Collapse>
    </Card>
  );
}