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
        if (bidsData.success && bidsData.data?.bids?.length > 0) {
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

  const handleBidPlaced = () => {
    setBidRefreshTrigger(prev => prev + 1);
  };

  const displayCurrentBid = liveCurrentBid ?? product?.currentBid ?? product?.startingBid ?? 0;
  const displayBidCount = liveBidCount ?? product?.bidCount ?? 0;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8fafc'
    }}>
      <Container maxWidth="1200px" sx={{ 
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 2.5, md: 3 }
      }}>
        {/* Breadcrumbs */}
        <Paper sx={{ 
          mb: { xs: 2, md: 2.5 }, 
          p: { xs: 1.5, md: 2 }, 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: 1.5,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <Breadcrumbs separator="›" sx={{ 
            '& .MuiBreadcrumbs-separator': { 
              color: '#CE0E2D', 
              fontWeight: 'bold',
              mx: 1.5,
              fontSize: '1.1rem'
            }
          }}>
            <MuiLink href="/" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              textDecoration: 'none', 
              fontSize: '0.95rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': { 
                color: '#CE0E2D',
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease'
              }
            }}>
              🏠 Home
            </MuiLink>
            <MuiLink href="/auctions" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              textDecoration: 'none', 
              fontSize: '0.95rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': { 
                color: '#CE0E2D',
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease'
              }
            }}>
              🔨 Auctions
            </MuiLink>
            <Typography sx={{ 
              color: '#CE0E2D', 
              fontWeight: 'bold',
              fontSize: '0.95rem',
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {product.title}
            </Typography>
          </Breadcrumbs>
        </Paper>

        {/* MAIN LAYOUT - Ultra Compact Design */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: { xs: 1.5, md: 2 },
          maxHeight: 'calc(100vh - 120px)',
          overflow: 'hidden'
        }}>
          
          {/* TOP SECTION - Main Content */}
          <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: { xs: 1, md: 1.5 } }}>
            
            {/* LEFT PANEL - Auction Information */}
            <Grid item xs={12} lg={3} sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: { xs: 1.5, md: 2 }
            }}>
              
              {/* Auction Status & Timer */}
              <Card sx={{ 
                background: product.auctionStatus === 'LIVE' 
                  ? 'linear-gradient(135deg, #CE0E2D, #dc2626)' 
                  : product.auctionStatus === 'ENDED'
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #475569, #334155)',
                color: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold" mb={1.5} sx={{ 
                      fontSize: { xs: '1.1rem', md: '1.25rem' }
                    }}>
                      {product.auctionStatus === 'LIVE' && '🔴 LIVE AUCTION'}
                      {product.auctionStatus === 'ENDED' && '👑 AUCTION ENDED'}
                      {product.auctionStatus === 'SCHEDULED' && '📅 UPCOMING AUCTION'}
                    </Typography>
                    
                    {product.auctionStatus === 'LIVE' && timeLeft && (
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(255, 255, 255, 0.15)'
                      }}>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontSize: '0.8rem' }}>Time Remaining:</Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ 
                          fontSize: { xs: '1.1rem', md: '1.25rem' }
                        }}>⏰ {timeLeft}</Typography>
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
              <Card sx={{ 
                mb: 3, 
                flex: '1 1 auto',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}>
                <CardContent sx={{ p: { xs: 2.5, lg: 3 } }}>
                  <Typography variant="h4" fontWeight="bold" mb={3} sx={{
                    color: '#0f172a',
                    fontSize: { xs: '1.5rem', md: '1.75rem', lg: '2rem' },
                    lineHeight: 1.3,
                    letterSpacing: '-0.025em'
                  }}>
                    {product.title}
                  </Typography>
                  
                  <Stack spacing={3}>
                    <Box display="flex" alignItems="center" gap={1.5} sx={{
                      p: 2,
                      bgcolor: '#f8fafc',
                      borderRadius: 2,
                      border: '1px solid #e2e8f0'
                    }}>
                      <LocationIcon sx={{ color: '#CE0E2D', fontSize: '1.25rem' }} />
                      <Typography variant="body1" fontWeight={500} color="#334155">{product.location}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="#64748b" fontWeight={600} mb={1} sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '0.75rem'
                      }}>
                        CONDITION
                      </Typography>
                      <Chip 
                        label={product.condition.replace('_', ' ')} 
                        color={getConditionColor(product.condition)}
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          height: '36px',
                          borderRadius: 2,
                          '& .MuiChip-label': {
                            px: 2
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{
                      p: 2.5,
                      bgcolor: 'linear-gradient(135deg, #fef7f0 0%, #fed7aa 100%)',
                      borderRadius: 2,
                      border: '2px solid #CE0E2D20'
                    }}>
                      <Typography variant="body2" color="#92400e" fontWeight={700} mb={1} sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '0.75rem'
                      }}>
                        💰 ESTIMATED VALUE
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{
                        color: '#CE0E2D',
                        fontSize: { xs: '1.1rem', md: '1.25rem' }
                      }}>
                        {formatCurrency(product.estimatedValueMin)} - {formatCurrency(product.estimatedValueMax)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Stack direction="row" spacing={2} justifyContent="center">
                <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                  <IconButton
                    onClick={() => setIsFavorite(!isFavorite)}
                    sx={{
                      color: isFavorite ? '#CE0E2D' : '#64748b',
                      bgcolor: isFavorite ? 'rgba(206, 14, 45, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      border: '2px solid',
                      borderColor: isFavorite ? '#CE0E2D' : '#e2e8f0',
                      borderRadius: 2,
                      width: 48,
                      height: 48,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        borderColor: '#CE0E2D', 
                        transform: 'translateY(-2px) scale(1.05)',
                        boxShadow: '0 10px 20px rgba(206, 14, 45, 0.2)'
                      }
                    }}
                  >
                    {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share auction">
                  <IconButton sx={{ 
                    color: '#64748b',
                    bgcolor: 'rgba(100, 116, 139, 0.1)',
                    border: '2px solid #e2e8f0',
                    borderRadius: 2,
                    width: 48,
                    height: 48,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      transform: 'translateY(-2px) scale(1.05)',
                      boxShadow: '0 10px 20px rgba(25, 118, 210, 0.2)'
                    }
                  }}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>

            {/* CENTER - Product Image */}
            <Grid item xs={12} lg={6} sx={{ 
              display: 'flex', 
              alignItems: 'stretch'
            }}>
              <Paper sx={{ 
                position: 'relative',
                width: '100%',
                aspectRatio: '4/3',
                maxHeight: { xs: '220px', md: '280px', lg: '320px' },
                overflow: 'hidden',
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
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
                
                {/* Enhanced Image Navigation */}
                {product.images?.length > 1 && (
                  <>
                    <IconButton
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? (product.images?.length || 1) - 1 : prev - 1
                      )}
                      sx={{
                        position: 'absolute',
                        left: 20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        width: 52,
                        height: 52,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                          bgcolor: '#CE0E2D', 
                          color: 'white',
                          transform: 'translateY(-50%) scale(1.1)',
                          boxShadow: '0 12px 40px rgba(206, 14, 45, 0.4)'
                        }
                      }}
                    >
                      <ChevronLeftIcon sx={{ fontSize: '1.5rem' }} />
                    </IconButton>
                    
                    <IconButton
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === (product.images?.length || 1) - 1 ? 0 : prev + 1
                      )}
                      sx={{
                        position: 'absolute',
                        right: 20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        width: 52,
                        height: 52,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                          bgcolor: '#CE0E2D', 
                          color: 'white',
                          transform: 'translateY(-50%) scale(1.1)',
                          boxShadow: '0 12px 40px rgba(206, 14, 45, 0.4)'
                        }
                      }}
                    >
                      <ChevronRightIcon sx={{ fontSize: '1.5rem' }} />
                    </IconButton>
                  </>
                )}
                
                <Box sx={{
                  position: 'absolute',
                  bottom: 20,
                  right: 20,
                  display: 'flex',
                  gap: 1
                }}>
                  <Chip
                    label={`${currentImageIndex + 1} / ${product.images?.length || 1}`}
                    sx={{
                      bgcolor: 'rgba(15, 23, 42, 0.9)',
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      '& .MuiChip-label': {
                        px: 2
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* RIGHT PANEL - Bidding Interface */}
            <Grid item xs={12} lg={3} sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: { xs: 3, md: 4 }
            }}>
              
              {/* Current Bid Display */}
              <Card sx={{ 
                mb: 3,
                textAlign: 'center',
                borderRadius: 3,
                border: '3px solid',
                borderColor: product.auctionStatus === 'LIVE' ? '#CE0E2D' : 
                            product.auctionStatus === 'ENDED' ? '#f59e0b' : '#e2e8f0',
                boxShadow: product.auctionStatus === 'LIVE' 
                  ? '0 20px 40px rgba(206, 14, 45, 0.15)' 
                  : '0 8px 32px rgba(0,0,0,0.08)',
                background: product.auctionStatus === 'LIVE' 
                  ? 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)'
                  : product.auctionStatus === 'ENDED'
                    ? 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: product.auctionStatus === 'LIVE' 
                    ? 'linear-gradient(90deg, #CE0E2D 0%, #dc2626 100%)'
                    : product.auctionStatus === 'ENDED'
                      ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(90deg, #64748b 0%, #475569 100%)'
                }
              }}>
                <CardContent sx={{ p: { xs: 2.5, lg: 3 }, pt: 4 }}>
                  <Typography variant="h6" fontWeight={700} mb={2} sx={{
                    color: product.auctionStatus === 'LIVE' ? '#dc2626' : 
                           product.auctionStatus === 'ENDED' ? '#d97706' : '#64748b',
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    letterSpacing: '0.5px'
                  }}>
                    {product.auctionStatus === 'ENDED' ? '👑 WINNING BID' : 
                     product.auctionStatus === 'LIVE' ? '💰 CURRENT BID' : '💵 STARTING BID'}
                  </Typography>
                  <Typography variant="h2" fontWeight="bold" mb={3} sx={{
                    color: '#0f172a',
                    fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                    lineHeight: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {formatCurrency(displayCurrentBid)}
                  </Typography>
                  
                  {/* Enhanced Bid Statistics */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 2, 
                        bgcolor: 'rgba(206, 14, 45, 0.05)',
                        borderRadius: 2,
                        border: '2px solid rgba(206, 14, 45, 0.1)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(206, 14, 45, 0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ 
                          color: '#CE0E2D',
                          fontSize: { xs: '1.25rem', md: '1.5rem' }
                        }}>
                          {displayBidCount}
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={600} sx={{
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Total Bids</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 2, 
                        bgcolor: 'rgba(59, 130, 246, 0.05)',
                        borderRadius: 2,
                        border: '2px solid rgba(59, 130, 246, 0.1)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(59, 130, 246, 0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ 
                          color: '#3b82f6',
                          fontSize: { xs: '1.25rem', md: '1.5rem' }
                        }}>
                          {product.uniqueBidders}
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={600} sx={{
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Bidders</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Enhanced Bid Increment & Starting Info */}
              <Card sx={{ 
                mb: 3,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2.5}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(34, 197, 94, 0.05)',
                      border: '2px solid rgba(34, 197, 94, 0.1)'
                    }}>
                      <Typography variant="body2" color="#15803d" fontWeight={700} mb={1} sx={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        💰 STARTING BID
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="#0f172a">
                        {formatCurrency(product.startingBid || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(168, 85, 247, 0.05)',
                      border: '2px solid rgba(168, 85, 247, 0.1)'
                    }}>
                      <Typography variant="body2" color="#7c3aed" fontWeight={700} mb={1} sx={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        📈 BID INCREMENT
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="#0f172a">
                        {formatCurrency(product.bidIncrement || 1)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Enhanced Seller Information */}
              <Card sx={{ 
                flex: '1 1 auto',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" mb={3} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    color: '#0f172a',
                    fontSize: '1.1rem'
                  }}>
                    <PersonIcon sx={{ color: '#CE0E2D', fontSize: '1.4rem' }} /> Seller Information
                  </Typography>
                  
                  {product.agent ? (
                    <Box sx={{
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 3,
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      border: '2px solid rgba(0, 0, 0, 0.05)'
                    }}>
                      <Avatar 
                        src={product.agent.logoUrl} 
                        alt={product.agent.displayName}
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          mr: 2.5,
                          border: '3px solid #CE0E2D',
                          boxShadow: '0 4px 12px rgba(206, 14, 45, 0.2)'
                        }}
                      />
                      <Box>
                        <Typography variant="h6" fontWeight="bold" color="#0f172a" mb={0.5}>
                          {product.agent.displayName}
                        </Typography>
                        <Typography variant="body2" color="#64748b" mb={0.5} fontWeight={500}>
                          {product.agent.businessName}
                        </Typography>
                        {product.agent.rating && (
                          <Box sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                          }}>
                            <Typography variant="body2" fontWeight={600} color="#f59e0b">
                              ⭐ {Number(product.agent.rating).toFixed(1)}
                            </Typography>
                            <Typography variant="caption" color="#92400e">
                              ({product.agent.reviewCount} reviews)
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 3,
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(100, 116, 139, 0.05)',
                      border: '2px solid rgba(100, 116, 139, 0.1)'
                    }}>
                      <Avatar 
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          mr: 2.5,
                          bgcolor: '#64748b',
                          border: '3px solid #64748b'
                        }}
                      >
                        ?
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" color="#0f172a" mb={0.5}>
                          Unknown Seller
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={500}>
                          Seller information not available
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* BOTTOM SECTION - Bidding History & Details */}
          <Grid container spacing={{ xs: 1.5, md: 2 }}>
            
            {/* Bid History */}
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ 
                height: { xs: '250px', md: '280px' },
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                bgcolor: '#ffffff',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{
                  p: 2,
                  bgcolor: '#1e293b',
                  color: 'white'
                }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    fontSize: '1.1rem'
                  }}>
                    <AssessmentIcon sx={{ color: '#CE0E2D' }} /> Bidding History
                  </Typography>
                </Box>
                <CardContent sx={{ p: 0 }}>
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

            {/* Product Description */}
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ 
                height: { xs: '250px', md: '280px' },
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                bgcolor: '#ffffff',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{
                  p: 3,
                  pb: 2,
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: 'white'
                }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    fontSize: '1.1rem'
                  }}>
                    📝 Product Description
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ height: { xs: 'auto', lg: '280px' }, minHeight: { xs: '200px', lg: '280px' }, overflow: 'auto' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {product.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Bid Interface */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ 
                height: { xs: '250px', md: '280px' },
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(206, 14, 45, 0.15)',
                border: '1px solid rgba(206, 14, 45, 0.1)',
                bgcolor: '#ffffff',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{
                  p: { xs: 3, md: 4 },
                  bgcolor: '#CE0E2D',
                  color: 'white'
                }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2
                  }}>
                    <BidIcon /> Quick Bid Interface
                  </Typography>
                </Box>
                <CardContent sx={{ p: { xs: 3, md: 4 }, flex: 1 }}>
                  <Box sx={{ height: '100%' }}>
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