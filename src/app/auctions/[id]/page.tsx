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
} from '@mui/material';

import { formatDate, formatCurrency } from 'src/lib/utils';
import BidHistory from 'src/components/bidding/BidHistory';
import QuickBidDialog from 'src/components/bidding/QuickBidDialog';
import { useRealtimeBidding } from 'src/hooks/useRealtimeBidding';
import AuctionStatusCard from 'src/components/auction/AuctionStatusCard';
import AuctionBidCard from 'src/components/auction/AuctionBidCard';
import AuctionImageGallery from 'src/components/auction/AuctionImageGallery';

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
      <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh', py: 2 }}>
        <Container maxWidth="xl">
          <Skeleton variant="text" width={300} height={30} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh', py: 3 }}>
        <Container maxWidth="xl">
          <Alert severity="error" sx={{ mb: 2 }}>
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
      <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh', py: 3 }}>
        <Container maxWidth="xl">
          <Alert severity="info" sx={{ mb: 2 }}>
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
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, md: 3 } }}>

        {/* Compact Breadcrumbs */}
        <Breadcrumbs
          separator={<ChevronRightIcon sx={{ fontSize: 14 }} />}
          sx={{ mb: 2, fontSize: '0.75rem' }}
        >
          <MuiLink href="/" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
            Home
          </MuiLink>
          <MuiLink href="/auctions" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
            Auctions
          </MuiLink>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', fontWeight: 600 }}>
            {product.title.length > 50 ? product.title.substring(0, 50) + '...' : product.title}
          </Typography>
        </Breadcrumbs>

        {/* Compact Info Bar */}
        <Card elevation={0} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.95rem' }}>
                  {product.title}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <AuctionStatusCard
                    auctionStatus={product.auctionStatus}
                    timeLeft={timeLeft}
                    startTime={product.startTime}
                    endTime={product.endTime}
                    isConnected={isConnected}
                  />
                  <Chip
                    label={product.location}
                    size="small"
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                  <Chip
                    label={product.condition.replace('_', ' ')}
                    color={getConditionColor(product.condition)}
                    size="small"
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                </Stack>
              </Box>

              <Stack direction="row" spacing={1}>
                <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                  <IconButton
                    size="small"
                    onClick={() => setIsFavorite(!isFavorite)}
                    sx={{
                      color: isFavorite ? 'primary.main' : 'text.secondary',
                      bgcolor: isFavorite ? 'primary.lighter' : 'grey.100',
                      '&:hover': { bgcolor: 'primary.main', color: 'common.white' }
                    }}
                  >
                    {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share auction">
                  <IconButton
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      bgcolor: 'grey.100',
                      '&:hover': { bgcolor: 'info.main', color: 'common.white' }
                    }}
                  >
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Hero Section - Image and Bid Actions Side by Side */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Left Half - Image Gallery */}
          <Grid item xs={12} md={6}>
            <AuctionImageGallery images={product.images} title={product.title} />
          </Grid>

          {/* Right Half - Bid Actions */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2} sx={{ height: '100%' }}>
              {/* Compact Bid Stats */}
              <AuctionBidCard
                currentBid={displayCurrentBid}
                bidCount={displayBidCount}
                uniqueBidders={product.uniqueBidders}
                auctionStatus={product.auctionStatus}
              />

              {/* Bid Details */}
              <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.light' }}>
                        <Typography variant="caption" color="success.dark" fontWeight={700} sx={{ fontSize: '0.65rem', mb: 0.5, display: 'block' }}>
                          STARTING BID
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.primary" sx={{ fontSize: '0.85rem' }}>
                          {formatCurrency(product.startingBid || 0)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'secondary.lighter', border: '1px solid', borderColor: 'secondary.light' }}>
                        <Typography variant="caption" color="secondary.dark" fontWeight={700} sx={{ fontSize: '0.65rem', mb: 0.5, display: 'block' }}>
                          BID INCREMENT
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.primary" sx={{ fontSize: '0.85rem' }}>
                          {formatCurrency(product.bidIncrement || 1)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Quick Bid Interface */}
              <Card elevation={0} sx={{ borderRadius: 2, border: '2px solid', borderColor: product.auctionStatus === 'LIVE' ? 'primary.main' : 'divider', flex: 1 }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, height: '100%' }}>
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
                    <Alert severity="info" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                        Auction Not Started
                      </Typography>
                      <Typography variant="caption">
                        Starts: {product.startTime ? formatDate(product.startTime) : 'TBA'}
                      </Typography>
                    </Alert>
                  ) : (
                    <Alert severity="warning" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                        Auction Ended
                      </Typography>
                      <Typography variant="caption">
                        Ended: {product.endTime ? formatDate(product.endTime) : 'N/A'}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* Main Content - Tabbed Details */}
        <Grid container spacing={2}>

          {/* Full Width - Tabbed Content */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  minHeight: 42,
                  '& .MuiTab-root': {
                    minHeight: 42,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1,
                  }
                }}
              >
                <Tab icon={<InfoIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Details" />
                <Tab icon={<HistoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Bid History (${displayBidCount})`} />
                <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Seller" />
              </Tabs>

              {/* Tab 0: Details */}
              {activeTab === 0 && (
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 1, display: 'block', fontSize: '0.7rem' }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7, color: 'text.secondary', mb: 3 }}>
                    {product.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 0.5, display: 'block', fontSize: '0.7rem' }}>
                        Location
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>{product.location}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 0.5, display: 'block', fontSize: '0.7rem' }}>
                        Condition
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>{product.condition.replace('_', ' ')}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 0.5, display: 'block', fontSize: '0.7rem' }}>
                        Estimated Value
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {formatCurrency(product.estimatedValueMin)} - {formatCurrency(product.estimatedValueMax)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {product.auctionStatus === 'ENDED' && winner && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Alert severity="success" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Winner: {winner.isAnonymous ? 'Anonymous Bidder' : winner.name}
                        </Typography>
                      </Alert>
                    </>
                  )}
                </CardContent>
              )}

              {/* Tab 1: Bid History */}
              {activeTab === 1 && (
                <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
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
                <CardContent sx={{ p: 2 }}>
                  {product.agent ? (
                    <Box>
                      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <Avatar
                          src={product.agent.logoUrl}
                          alt={product.agent.displayName}
                          sx={{ width: 48, height: 48, border: '2px solid', borderColor: 'primary.main' }}
                        />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>{product.agent.displayName}</Typography>
                          <Typography variant="caption" color="text.secondary">{product.agent.businessName}</Typography>
                          {product.agent.rating && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <Typography variant="caption" fontWeight={600} color="warning.dark">
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
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 1.5, display: 'block', fontSize: '0.7rem' }}>
                            Additional Information
                          </Typography>
                          <Grid container spacing={2}>
                            {product.sellerName && (
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Name</Typography>
                                <Typography variant="body2" fontWeight={500}>{product.sellerName}</Typography>
                              </Grid>
                            )}
                            {product.sellerLocation && (
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Location</Typography>
                                <Typography variant="body2" fontWeight={500}>{product.sellerLocation}</Typography>
                              </Grid>
                            )}
                            {product.sellerContact && (
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Contact</Typography>
                                <Typography variant="body2" fontWeight={500}>{product.sellerContact}</Typography>
                              </Grid>
                            )}
                            {product.sellerEmail && (
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Email</Typography>
                                <Typography variant="body2" fontWeight={500}>{product.sellerEmail}</Typography>
                              </Grid>
                            )}
                          </Grid>
                          {product.sellerNotes && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Notes</Typography>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{product.sellerNotes}</Typography>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                      Seller information not available
                    </Alert>
                  )}
                </CardContent>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
