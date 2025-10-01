'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Stack,
  Alert,
  Button,
  Container,
  Typography,
  CardContent,
  CircularProgress,
  IconButton,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Gavel as GavelIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingIcon,
  Visibility as ViewIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

import Layout from 'src/components/layout/Layout';
import { useAuth, getAccessToken } from 'src/hooks/useAuth';
import { formatCurrency, formatDate } from 'src/lib/utils';

interface WatchlistProduct {
  id: string;
  title: string;
  currentBid: number;
  startingBid: number;
  bidCount: number;
  auctionStatus: string;
  endTime: string;
  images: string[];
  thumbnailIndex: number;
  favoriteCount: number;
}

export default function WatchlistPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchlistProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchWatchlist();
      } else {
        router.push('/auth/login');
      }
    }
  }, [authLoading, user]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/users/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }

      const data = await response.json();
      if (data.success) {
        setWatchlist(data.data.favorites || []);
      } else {
        setError(data.error?.message || 'Failed to load watchlist');
      }
    } catch (err) {
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (productId: string) => {
    try {
      setRemovingIds(prev => new Set(prev).add(productId));
      const token = getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/users/favorites/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setWatchlist(prev => prev.filter(item => item.id !== productId));
      } else {
        setError('Failed to remove from watchlist');
      }
    } catch (err) {
      setError('Failed to remove from watchlist');
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return theme.palette.success.main;
      case 'SCHEDULED':
        return theme.palette.info.main;
      case 'ENDED':
        return theme.palette.grey[500];
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'Live Now';
      case 'SCHEDULED':
        return 'Upcoming';
      case 'ENDED':
        return 'Ended';
      default:
        return status;
    }
  };

  const getThumbnailUrl = (product: WatchlistProduct) => {
    try {
      const images = typeof product.images === 'string'
        ? JSON.parse(product.images)
        : product.images;
      return images[product.thumbnailIndex || 0] || '/images/placeholder.jpg';
    } catch {
      return '/images/placeholder.jpg';
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            My Watchlist
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your favorite auction items and never miss a bidding opportunity
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {watchlist.length === 0 ? (
          <Card
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            }}
          >
            <FavoriteBorderIcon
              sx={{
                fontSize: 80,
                color: theme.palette.text.disabled,
                mb: 3,
              }}
            />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Your Watchlist is Empty
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Start adding items to your watchlist to keep track of auctions you're interested in
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/auctions')}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Browse Auctions
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {watchlist.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[12],
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  {/* Image */}
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '75%',
                      overflow: 'hidden',
                      borderRadius: '12px 12px 0 0',
                      cursor: 'pointer',
                    }}
                    onClick={() => router.push(`/auctions/${product.id}`)}
                  >
                    <Box
                      component="img"
                      src={getThumbnailUrl(product)}
                      alt={product.title}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />

                    {/* Status Badge */}
                    <Chip
                      label={getStatusLabel(product.auctionStatus)}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        bgcolor: alpha(getStatusColor(product.auctionStatus), 0.9),
                        color: 'white',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)',
                      }}
                    />

                    {/* Remove from Watchlist Button */}
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromWatchlist(product.id);
                      }}
                      disabled={removingIds.has(product.id)}
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.error.main, 0.9),
                          color: 'white',
                        },
                      }}
                    >
                      {removingIds.has(product.id) ? (
                        <CircularProgress size={20} />
                      ) : (
                        <FavoriteIcon color="error" />
                      )}
                    </IconButton>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    {/* Title */}
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      gutterBottom
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: 56,
                        cursor: 'pointer',
                        '&:hover': {
                          color: theme.palette.primary.main,
                        },
                      }}
                      onClick={() => router.push(`/auctions/${product.id}`)}
                    >
                      {product.title}
                    </Typography>

                    {/* Current Bid */}
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Current Bid
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {formatCurrency(product.currentBid || product.startingBid)}
                      </Typography>
                    </Box>

                    {/* Stats */}
                    <Stack spacing={1} mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <GavelIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                        <Typography variant="caption" color="text.secondary">
                          {product.bidCount} {product.bidCount === 1 ? 'Bid' : 'Bids'}
                        </Typography>
                      </Box>
                      {product.endTime && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <TimeIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                          <Typography variant="caption" color="text.secondary">
                            Ends {formatDate(product.endTime)}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {/* Action Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      endIcon={<ArrowIcon />}
                      onClick={() => router.push(`/auctions/${product.id}`)}
                      disabled={product.auctionStatus === 'ENDED'}
                      sx={{
                        borderRadius: 2,
                        py: 1.25,
                        fontWeight: 600,
                      }}
                    >
                      {product.auctionStatus === 'LIVE' ? 'Place Bid' : 'View Details'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Summary */}
        {watchlist.length > 0 && (
          <Box
            mt={4}
            p={3}
            sx={{
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {watchlist.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items Watched
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {watchlist.filter(p => p.auctionStatus === 'LIVE').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Live Auctions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {watchlist.filter(p => p.auctionStatus === 'SCHEDULED').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming Auctions
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </Layout>
  );
}
