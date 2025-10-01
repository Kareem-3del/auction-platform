'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Person as PersonIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Description as DescriptionIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  ChevronRight as ChevronRightIcon,
  Visibility as VisibilityIcon,
  LocationOn as LocationIcon,
  Label as LabelIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Box,
  Grid,
  Card,
  Stack,
  Alert,
  Button,
  Avatar,
  Skeleton,
  Typography,
  CardContent,
  Breadcrumbs,
  Link as MuiLink,
  IconButton,
  Tooltip,
  Container,
  Divider,
  Tabs,
  Tab,
  Chip,
  Paper,
} from '@mui/material';

import { formatDate, formatCurrency } from 'src/lib/utils';
import BidHistory from 'src/components/bidding/BidHistory';
import QuickBidDialog from 'src/components/bidding/QuickBidDialog';
import { useRealtimeBidding } from 'src/hooks/useRealtimeBidding';
import AuctionStatusCard from 'src/components/auction/AuctionStatusCard';
import AuctionBidCard from 'src/components/auction/AuctionBidCard';
import AuctionImageGallery from 'src/components/auction/AuctionImageGallery';
import { CountdownTimer } from 'src/components/common/CountdownTimer';

interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  location: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  auctionStatus: 'SCHEDULED' | 'LIVE' | 'ENDED' | null;
  startTime: string | null;
  endTime: string | null;
  currentBid: number;
  startingBid: number | null;
  bidIncrement: number | null;
  bidCount: number;
  uniqueBidders: number;
  highestBidderId: string | null;
  createdAt: string;
  viewCount?: number;
  watcherCount?: number;
  agent: {
    id: string;
    displayName: string;
    businessName: string;
    logoUrl?: string;
    rating?: number;
    reviewCount: number;
  };
  showSellerInfo?: boolean;
  sellerName?: string;
  sellerContact?: string;
  sellerEmail?: string;
  sellerLocation?: string;
  sellerNotes?: string;
}

interface BidWinner {
  id: string;
  name: string;
  isAnonymous: boolean;
}

interface AuctionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AuctionDetailPage({ params }: AuctionPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [winner, setWinner] = useState<BidWinner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [bidRefreshTrigger, setBidRefreshTrigger] = useState(0);
  const [liveCurrentBid, setLiveCurrentBid] = useState<number | null>(null);
  const [liveBidCount, setLiveBidCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const {
    isConnected,
    currentBid: wsCurrentBid,
    bidCount: wsBidCount,
    lastBid,
    connectionError,
    reconnect
  } = useRealtimeBidding({
    productId: product?.id || '',
    onBidUpdate: (update) => {
      setLiveCurrentBid(update.currentBid);
      setLiveBidCount(update.bidCount);
      setBidRefreshTrigger(prev => prev + 1);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  useEffect(() => {
    if (!product?.endTime || product?.auctionStatus !== 'LIVE') {
      setTimeLeft('');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(product.endTime!).getTime();
      const distance = end - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft(
          days > 0
            ? `${days}d ${hours}h ${minutes}m ${seconds}s`
            : `${hours}h ${minutes}m ${seconds}s`
        );
      } else {
        setTimeLeft('Auction Ended');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [product]);

  useEffect(() => {
    params.then(p => {
      if (p.id) {
        loadProduct(p.id);
      }
    });
  }, [params]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/auctions/${productId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Product not found');
        } else {
          throw new Error('Failed to load product');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        const productData = data.data;
        setProduct(productData);

        if (productData.auctionStatus === 'ENDED' && productData.highestBidderId) {
          loadWinner(productId, productData.highestBidderId);
        }
      } else {
        setError(data.error?.message || 'Failed to load product');
      }
    } catch (err) {
      setError('Failed to load product');
      console.error('Error loading product:', productId, err);
    } finally {
      setLoading(false);
    }
  };

  const loadWinner = async (productId: string, winnerId: string) => {
    try {
      const bidsResponse = await fetch(`/api/auctions/${productId}/bids`);
      if (bidsResponse.ok) {
        const bidsData = await bidsResponse.json();
        if (bidsData.success && bidsData.data?.bids?.length > 0) {
          const winningBid = bidsData.data.bids[0];
          setWinner({
            id: winningBid.bidder.id,
            name: winningBid.bidder.name,
            isAnonymous: winningBid.bidder.isAnonymous
          });
        }
      }
    } catch (err) {
      console.error('Error loading winner:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
        <Container maxWidth="xl">
          <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={500} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Product not found'}
          </Alert>
          <Button variant="contained" onClick={() => router.back()}>
            Go Back
          </Button>
        </Container>
      </Box>
    );
  }

  if (!product.auctionStatus) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          <Alert severity="info" sx={{ mb: 3 }}>
            This product is not available for auction.
          </Alert>
          <Button variant="contained" onClick={() => router.push(`/products/${product.id}`)}>
            View Product Details
          </Button>
        </Container>
      </Box>
    );
  }

  const handleBidPlaced = () => {
    setBidRefreshTrigger(prev => prev + 1);
  };

  const displayCurrentBid = liveCurrentBid ?? product?.currentBid ?? product?.startingBid ?? 0;
  const displayBidCount = liveBidCount ?? product?.bidCount ?? 0;

  const getConditionColor = (condition: string): any => {
    switch (condition) {
      case 'NEW': return 'success';
      case 'LIKE_NEW': return 'info';
      case 'VERY_GOOD': return 'primary';
      case 'GOOD': return 'secondary';
      case 'FAIR': return 'warning';
      case 'POOR': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, md: 4 } }}>

        {/* Professional Breadcrumbs */}
        <Breadcrumbs
          separator={<ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
          sx={{ mb: 3 }}
        >
          <MuiLink
            href="/"
            sx={{
              color: 'text.secondary',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': { color: 'primary.main', textDecoration: 'underline' }
            }}
          >
            Home
          </MuiLink>
          <MuiLink
            href="/auctions"
            sx={{
              color: 'text.secondary',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': { color: 'primary.main', textDecoration: 'underline' }
            }}
          >
            Auctions
          </MuiLink>
          <Typography sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 600 }}>
            {product.title.length > 50 ? product.title.substring(0, 50) + '...' : product.title}
          </Typography>
        </Breadcrumbs>

        {/* Formal Header Card */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderLeft: '4px solid',
            borderLeftColor: product.auctionStatus === 'LIVE' ? 'primary.main' : 'grey.400',
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 1.5,
                    color: 'text.primary',
                    letterSpacing: '-0.01em'
                  }}
                >
                  {product.title}
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
                  <AuctionStatusCard
                    auctionStatus={product.auctionStatus}
                    timeLeft={timeLeft}
                    startTime={product.startTime}
                    endTime={product.endTime}
                    isConnected={isConnected}
                  />

                  <Chip
                    icon={<LocationIcon sx={{ fontSize: '0.9rem' }} />}
                    label={product.location}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.75rem',
                      height: 26,
                      fontWeight: 600,
                      borderColor: 'grey.400',
                      '& .MuiChip-icon': { color: 'text.secondary' }
                    }}
                  />

                  <Chip
                    icon={<LabelIcon sx={{ fontSize: '0.9rem' }} />}
                    label={product.condition.replace('_', ' ')}
                    color={getConditionColor(product.condition)}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.75rem',
                      height: 26,
                      fontWeight: 600,
                    }}
                  />

                  {(product.watcherCount !== undefined && product.watcherCount > 0) && (
                    <Chip
                      icon={<VisibilityIcon sx={{ fontSize: '0.9rem' }} />}
                      label={`${product.watcherCount} Watching`}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        height: 26,
                        bgcolor: 'warning.lighter',
                        color: 'warning.dark',
                        border: '1px solid',
                        borderColor: 'warning.light',
                        '& .MuiChip-icon': { color: 'warning.dark' },
                        fontWeight: 600
                      }}
                    />
                  )}
                </Stack>
              </Box>

              <Stack direction="row" spacing={1}>
                <Tooltip title={isFavorite ? 'Remove from watchlist' : 'Add to watchlist'}>
                  <IconButton
                    size="medium"
                    onClick={() => setIsFavorite(!isFavorite)}
                    sx={{
                      border: '1px solid',
                      borderColor: isFavorite ? 'primary.main' : 'divider',
                      color: isFavorite ? 'primary.main' : 'text.secondary',
                      bgcolor: isFavorite ? 'primary.lighter' : 'background.paper',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'common.white',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Share auction">
                  <IconButton
                    size="medium"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.secondary',
                      bgcolor: 'background.paper',
                      '&:hover': {
                        bgcolor: 'info.main',
                        color: 'common.white',
                        borderColor: 'info.main'
                      }
                    }}
                  >
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        </Paper>

        {/* Main Content Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>

          {/* Left Column - Image Gallery */}
          <Grid item xs={12} md={7}>
            <AuctionImageGallery images={product.images} title={product.title} />
          </Grid>

          {/* Right Column - Bid Section */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2.5}>

              {/* Current Bid Card */}
              <AuctionBidCard
                currentBid={displayCurrentBid}
                bidCount={displayBidCount}
                uniqueBidders={product.uniqueBidders}
                auctionStatus={product.auctionStatus}
              />

              {/* Bid Information */}
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{
                  p: 1.5,
                  bgcolor: 'grey.100',
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      letterSpacing: 1,
                      color: 'text.secondary'
                    }}
                  >
                    Bidding Information
                  </Typography>
                </Box>

                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'success.main',
                        bgcolor: 'success.lighter',
                      }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'success.dark',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            mb: 0.5,
                            display: 'block',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase'
                          }}
                        >
                          Starting Bid
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            fontSize: '1rem'
                          }}
                        >
                          {formatCurrency(product.startingBid || 0)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'info.main',
                        bgcolor: 'info.lighter',
                      }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'info.dark',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            mb: 0.5,
                            display: 'block',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase'
                          }}
                        >
                          Bid Increment
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            fontSize: '1rem'
                          }}
                        >
                          {formatCurrency(product.bidIncrement || 1)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              {/* Quick Bid Interface */}
              <Paper
                elevation={0}
                sx={{
                  border: '2px solid',
                  borderColor: product.auctionStatus === 'LIVE' ? 'primary.main' : 'divider',
                }}
              >
                <Box sx={{ p: 2 }}>
                  {product.auctionStatus === 'LIVE' && timeLeft && timeLeft !== 'Auction Ended' ? (
                    <QuickBidDialog
                      productId={product.id}
                      currentBid={displayCurrentBid}
                      bidIncrement={product.bidIncrement || 1}
                      timeLeft={timeLeft}
                      endTime={product.endTime}
                      auctionStatus={product.auctionStatus}
                      onBidPlaced={handleBidPlaced}
                      isConnected={isConnected}
                      connectionError={connectionError}
                      onReconnect={reconnect}
                      bidButtonDisabled={false}
                      bidCooldownTime={0}
                    />
                  ) : product.auctionStatus === 'SCHEDULED' ? (
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 700,
                          mb: 2,
                          display: 'block',
                          fontSize: '0.7rem',
                          letterSpacing: 1
                        }}
                      >
                        Auction Starts In
                      </Typography>
                      {product.startTime && (
                        <Box sx={{
                          p: 3,
                          bgcolor: 'info.lighter',
                          border: '2px solid',
                          borderColor: 'info.main',
                          mb: 2
                        }}>
                          <CountdownTimer
                            startTime={new Date(product.startTime)}
                            endTime={product.endTime ? new Date(product.endTime) : undefined}
                            variant="modern"
                            size="medium"
                          />
                        </Box>
                      )}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          textAlign: 'center',
                          fontWeight: 500
                        }}
                      >
                        Starts: {product.startTime ? formatDate(product.startTime) : 'TBA'}
                      </Typography>
                    </Box>
                  ) : (
                    <Alert
                      severity="warning"
                      sx={{
                        border: '1px solid',
                        borderColor: 'warning.main',
                        '& .MuiAlert-message': { width: '100%' }
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                        Auction Ended
                      </Typography>
                      <Typography variant="caption">
                        Ended: {product.endTime ? formatDate(product.endTime) : 'N/A'}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* Tabbed Content Section */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: '2px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: 0.5,
                color: 'text.secondary',
                py: 1.5,
                '&.Mui-selected': {
                  color: 'primary.main',
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
              }
            }}
          >
            <Tab icon={<InfoIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Details" />
            <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Bid History (${displayBidCount})`} />
            <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Seller Information" />
          </Tabs>

          {/* Tab 0: Details */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ mb: 4 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  pb: 1,
                  mb: 2,
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }}>
                  <DescriptionIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: 1,
                      color: 'text.primary'
                    }}
                  >
                    Description
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-line',
                    lineHeight: 1.8,
                    color: 'text.primary',
                    fontWeight: 400
                  }}
                >
                  {product.description}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                pb: 1,
                mb: 2,
                borderBottom: '2px solid',
                borderColor: 'divider'
              }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: 1,
                    color: 'text.primary'
                  }}
                >
                  Item Information
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                  }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        mb: 1,
                        display: 'block',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase'
                      }}
                    >
                      Location
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      {product.location}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                  }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        mb: 1,
                        display: 'block',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase'
                      }}
                    >
                      Condition
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      {product.condition.replace('_', ' ')}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={4}>
                  <Box sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'primary.main',
                    bgcolor: 'primary.lighter'
                  }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'primary.dark',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        mb: 1,
                        display: 'block',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase'
                      }}
                    >
                      Estimated Value
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ fontSize: '1.1rem' }}>
                      {formatCurrency(product.estimatedValueMin)} - {formatCurrency(product.estimatedValueMax)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {product.auctionStatus === 'ENDED' && winner && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Alert
                    severity="success"
                    sx={{
                      border: '1px solid',
                      borderColor: 'success.main',
                      '& .MuiAlert-message': { width: '100%' }
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700}>
                      Winner: {winner.isAnonymous ? 'Anonymous Bidder' : winner.name}
                    </Typography>
                  </Alert>
                </>
              )}
            </Box>
          )}

          {/* Tab 1: Bid History */}
          {activeTab === 1 && (
            <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
              <BidHistory
                auctionId={product.id}
                currentBid={displayCurrentBid}
                refreshTrigger={bidRefreshTrigger}
                isLive={product.auctionStatus === 'LIVE'}
                isConnected={isConnected}
              />
            </Box>
          )}

          {/* Tab 2: Seller Info */}
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              {product.agent ? (
                <Box>
                  <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                    <Avatar
                      src={product.agent.logoUrl}
                      alt={product.agent.displayName}
                      sx={{
                        width: 64,
                        height: 64,
                        border: '2px solid',
                        borderColor: 'primary.main'
                      }}
                    />
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="text.primary">
                        {product.agent.displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {product.agent.businessName}
                      </Typography>
                      {product.agent.rating && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Typography variant="body2" fontWeight={700} color="warning.dark">
                            ★ {Number(product.agent.rating).toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({product.agent.reviewCount} reviews)
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Stack>

                  {product.showSellerInfo && (product.sellerName || product.sellerContact || product.sellerEmail || product.sellerLocation) && (
                    <>
                      <Divider sx={{ my: 3 }} />

                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        pb: 1,
                        mb: 2,
                        borderBottom: '2px solid',
                        borderColor: 'divider'
                      }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                        <Typography
                          variant="overline"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            letterSpacing: 1,
                            color: 'text.primary'
                          }}
                        >
                          Additional Information
                        </Typography>
                      </Box>

                      <Grid container spacing={2}>
                        {product.sellerName && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{
                              p: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper'
                            }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Name
                              </Typography>
                              <Typography variant="body1" fontWeight={600} color="text.primary">
                                {product.sellerName}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {product.sellerLocation && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{
                              p: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper'
                            }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Location
                              </Typography>
                              <Typography variant="body1" fontWeight={600} color="text.primary">
                                {product.sellerLocation}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {product.sellerContact && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{
                              p: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper'
                            }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Contact
                              </Typography>
                              <Typography variant="body1" fontWeight={600} color="text.primary">
                                {product.sellerContact}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {product.sellerEmail && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{
                              p: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper'
                            }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Email
                              </Typography>
                              <Typography variant="body1" fontWeight={600} color="text.primary">
                                {product.sellerEmail}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      {product.sellerNotes && (
                        <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                            Notes
                          </Typography>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7, color: 'text.primary' }}>
                            {product.sellerNotes}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              ) : (
                <Alert
                  severity="info"
                  sx={{
                    border: '1px solid',
                    borderColor: 'info.main'
                  }}
                >
                  Seller information not available
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
