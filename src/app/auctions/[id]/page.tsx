'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Gavel as AuctionIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  MonetizationOn as BidIcon,
  TrendingUp as TrendIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Group as GroupIcon,
  LocalOffer as OfferIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import {
  Box,
  Grid,
  Card,
  Chip,
  Stack,
  Alert,
  Button,
  Avatar,
  Skeleton,
  Typography,
  CardContent,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Divider,
  IconButton,
  LinearProgress,
  Badge,
  Tooltip,
  Container,
} from '@mui/material';

import { formatDate, formatCurrency, formatTimeRemaining } from 'src/lib/utils';
import BidHistory from 'src/components/bidding/BidHistory';
import QuickBidDialog from 'src/components/bidding/QuickBidDialog';
import { useRealtimeBidding } from 'src/hooks/useRealtimeBidding';

interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  location: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  // Unified auction fields
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
        
        // Load winner information if auction has ended and there's a highest bidder
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
      // Get the highest bid to find winner information
      const bidsResponse = await fetch(`/api/auctions/${productId}/bids`);
      if (bidsResponse.ok) {
        const bidsData = await bidsResponse.json();
        if (bidsData.success && bidsData.data.bids.length > 0) {
          const winningBid = bidsData.data.bids[0]; // Highest bid
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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'LIVE': return 'error';
      case 'SCHEDULED': return 'info';
      case 'ENDED': return 'default';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
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

  if (loading) {
    return (
      <Box p={3} maxWidth="1400px" mx="auto">
        <Skeleton variant="text" width={300} height={40} />
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box p={3} maxWidth="1400px" mx="auto">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Product not found'}
        </Alert>
        <Button onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    );
  }

  // Check if this product has auction functionality
  if (!product.auctionStatus) {
    return (
      <Box p={3} maxWidth="1400px" mx="auto">
        <Alert severity="info" sx={{ mb: 3 }}>
          This product is not available for auction.
        </Alert>
        <Button onClick={() => router.push(`/products/${product.id}`)}>
          View Product Details
        </Button>
      </Box>
    );
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [bidRefreshTrigger, setBidRefreshTrigger] = useState(0);
  const [liveCurrentBid, setLiveCurrentBid] = useState<number | null>(null);
  const [liveBidCount, setLiveBidCount] = useState<number | null>(null);

  // WebSocket connection for live updates
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

  // Countdown timer effect
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

  const handleBidPlaced = () => {
    setBidRefreshTrigger(prev => prev + 1);
  };

  const displayCurrentBid = liveCurrentBid ?? product?.currentBid ?? product?.startingBid ?? 0;
  const displayBidCount = liveBidCount ?? product?.bidCount ?? 0;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      py: 2
    }}>
      <Container maxWidth="xl">
        {/* Enhanced Breadcrumbs */}
        <Paper sx={{ 
          mb: 3, 
          p: 2, 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderRadius: 2
        }}>
          <Breadcrumbs separator="›" sx={{ 
            '& .MuiBreadcrumbs-separator': { color: '#CE0E2D', fontWeight: 'bold' }
          }}>
            <MuiLink href="/" sx={{ color: 'white', textDecoration: 'none', '&:hover': { color: '#CE0E2D' } }}>
              🏠 Home
            </MuiLink>
            <MuiLink href="/auctions" sx={{ color: 'white', textDecoration: 'none', '&:hover': { color: '#CE0E2D' } }}>
              🔨 Auctions
            </MuiLink>
            <Typography sx={{ color: '#CE0E2D', fontWeight: 'bold' }}>
              {product.title.length > 50 ? `${product.title.substring(0, 50)}...` : product.title}
            </Typography>
          </Breadcrumbs>
        </Paper>

        {/* MAIN LAYOUT - Responsive No-Scroll Design */}
        <Box sx={{ 
          height: { xs: 'auto', lg: 'calc(100vh - 140px)' }, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: { xs: '100vh', lg: 'calc(100vh - 140px)' }
        }}>
          
          {/* TOP SECTION - Auction Info + Image + Bidding */}
          <Grid container spacing={3} sx={{ 
            flex: { xs: 'none', lg: '1 1 auto' }, 
            minHeight: { xs: 'auto', lg: '60%' },
            mb: { xs: 3, lg: 0 }
          }}>
            
            {/* LEFT PANEL - Auction Information */}
            <Grid item xs={12} md={6} lg={3} sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              order: { xs: 1, lg: 1 }
            }}>
              
              {/* Auction Status & Timer */}
              <Card sx={{ 
                mb: 2,
                background: product.auctionStatus === 'LIVE' 
                  ? 'linear-gradient(135deg, #CE0E2D, #ff4444)' 
                  : product.auctionStatus === 'ENDED'
                    ? 'linear-gradient(135deg, #ffd700, #ffa500)'
                    : 'linear-gradient(135deg, #6c757d, #495057)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(206, 14, 45, 0.3)'
              }}>
                <CardContent>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                      {product.auctionStatus === 'LIVE' && '🔴 LIVE AUCTION'}
                      {product.auctionStatus === 'ENDED' && '👑 AUCTION ENDED'}
                      {product.auctionStatus === 'SCHEDULED' && '📅 UPCOMING'}
                    </Typography>
                    
                    {product.auctionStatus === 'LIVE' && timeLeft && (
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Time Remaining:</Typography>
                        <Typography variant="h6" fontWeight="bold">⏰ {timeLeft}</Typography>
                      </Box>
                    )}
                    
                    {product.auctionStatus === 'LIVE' && isConnected && (
                      <Chip 
                        label="🟢 CONNECTED" 
                        size="small" 
                        sx={{ mt: 1, bgcolor: 'rgba(76, 175, 80, 0.3)', color: 'white' }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Auction Title & Basic Info */}
              <Card sx={{ mb: 2, flex: '1 1 auto' }}>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" mb={2} color="#1a1a1a">
                    {product.title}
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon color="primary" />
                      <Typography variant="body2">{product.location}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        CONDITION
                      </Typography>
                      <Chip 
                        label={product.condition.replace('_', ' ')} 
                        color={getConditionColor(product.condition)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        ESTIMATED VALUE
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="#CE0E2D">
                        {formatCurrency(product.estimatedValueMin)} - {formatCurrency(product.estimatedValueMax)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Stack direction="row" spacing={1} justifyContent="center">
                <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                  <IconButton
                    onClick={() => setIsFavorite(!isFavorite)}
                    sx={{
                      color: isFavorite ? '#CE0E2D' : '#666',
                      border: '2px solid #e0e0e0',
                      '&:hover': { borderColor: '#CE0E2D', transform: 'scale(1.1)' }
                    }}
                  >
                    {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share auction">
                  <IconButton sx={{ border: '2px solid #e0e0e0', '&:hover': { borderColor: '#1976d2' } }}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>

            {/* CENTER - Product Image */}
            <Grid item xs={12} md={12} lg={6} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              order: { xs: 2, lg: 2 }
            }}>
              <Paper sx={{ 
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: { xs: '300px', md: '400px', lg: '500px' },
                overflow: 'hidden',
                borderRadius: 3,
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
              }}>
                <Box
                  component="img"
                  src={product.images?.[currentImageIndex] || '/placeholder-image.jpg'}
                  alt={product.title}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                
                {/* Image Navigation */}
                {product.images?.length > 1 && (
                  <>
                    <IconButton
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? product.images.length - 1 : prev - 1
                      )}
                      sx={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.95)',
                        '&:hover': { bgcolor: '#CE0E2D', color: 'white' }
                      }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                    
                    <IconButton
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === product.images.length - 1 ? 0 : prev + 1
                      )}
                      sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.95)',
                        '&:hover': { bgcolor: '#CE0E2D', color: 'white' }
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </>
                )}
                
                <Chip
                  label={`${currentImageIndex + 1} / ${product.images?.length || 1}`}
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    bgcolor: '#CE0E2D',
                    color: 'white'
                  }}
                />
              </Paper>
            </Grid>

            {/* RIGHT PANEL - Bidding Interface */}
            <Grid item xs={12} md={6} lg={3} sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              order: { xs: 3, lg: 3 }
            }}>
              
              {/* Current Bid Display */}
              <Card sx={{ 
                mb: 2,
                textAlign: 'center',
                border: '3px solid',
                borderColor: product.auctionStatus === 'LIVE' ? '#CE0E2D' : 
                            product.auctionStatus === 'ENDED' ? '#ffd700' : '#e0e0e0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }}>
                <CardContent>
                  <Typography variant="body1" color="text.secondary" fontWeight="bold" mb={1}>
                    {product.auctionStatus === 'ENDED' ? '👑 WINNING BID' : 
                     product.auctionStatus === 'LIVE' ? '💰 CURRENT BID' : '💵 STARTING BID'}
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="#CE0E2D" mb={2}>
                    {formatCurrency(displayCurrentBid)}
                  </Typography>
                  
                  {/* Bid Statistics */}
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box textAlign="center" p={1} bgcolor="#f5f5f5" borderRadius={1}>
                        <Typography variant="h6" color="#CE0E2D" fontWeight="bold">
                          {displayBidCount}
                        </Typography>
                        <Typography variant="caption">Total Bids</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center" p={1} bgcolor="#f5f5f5" borderRadius={1}>
                        <Typography variant="h6" color="#CE0E2D" fontWeight="bold">
                          {product.uniqueBidders}
                        </Typography>
                        <Typography variant="caption">Bidders</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Bid Increment & Starting Info */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        STARTING BID
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(product.startingBid || 0)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        BID INCREMENT
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(product.bidIncrement || 1)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Seller Information */}
              <Card sx={{ flex: '1 1 auto' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" /> Seller
                  </Typography>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar 
                      src={product.agent.logoUrl} 
                      alt={product.agent.displayName}
                      sx={{ width: 48, height: 48, mr: 2, border: '2px solid #e0e0e0' }}
                    />
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {product.agent.displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.agent.businessName}
                      </Typography>
                      {product.agent.rating && (
                        <Typography variant="caption" color="#ffa726">
                          ⭐ {Number(product.agent.rating).toFixed(1)} ({product.agent.reviewCount})
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* BOTTOM SECTION - Bidding History & Details */}
          <Grid container spacing={3} sx={{ 
            flex: { xs: 'none', lg: '0 0 40%' }, 
            mt: { xs: 0, lg: 2 },
            minHeight: { xs: 'auto', lg: '40%' }
          }}>
            
            {/* Left - Bid History */}
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: { xs: '300px', lg: 'auto' } }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssessmentIcon color="primary" /> Bidding History
                  </Typography>
                  <Box sx={{ height: { xs: 'auto', lg: '280px' }, minHeight: { xs: '200px', lg: '280px' }, overflow: 'auto' }}>
                    <BidHistory
                      auctionId={product.id}
                      currentBid={displayCurrentBid}
                      refreshTrigger={bidRefreshTrigger}
                      isLive={product.auctionStatus === 'LIVE'}
                      isConnected={isConnected}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Center - Product Description */}
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: { xs: '300px', lg: 'auto' } }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📝 Description
                  </Typography>
                  <Box sx={{ height: { xs: 'auto', lg: '280px' }, minHeight: { xs: '200px', lg: '280px' }, overflow: 'auto' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {product.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Right - Quick Bid Interface */}
            <Grid item xs={12} md={12} lg={4}>
              <Card sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: { xs: '300px', lg: 'auto' } }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BidIcon color="primary" /> Quick Bid
                  </Typography>
                  <Box sx={{ height: '280px' }}>
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
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Auction Not Started</Typography>
                        <Typography variant="body2">
                          This auction will begin on {product.startTime ? formatDate(product.startTime) : 'TBA'}
                        </Typography>
                      </Alert>
                    ) : (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Auction Ended</Typography>
                        <Typography variant="body2">
                          This auction ended on {product.endTime ? formatDate(product.endTime) : 'N/A'}
                        </Typography>
                        {winner && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Winner: {winner.isAnonymous ? '🕶️ Hidden User' : winner.name}
                          </Typography>
                        )}
                      </Alert>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}