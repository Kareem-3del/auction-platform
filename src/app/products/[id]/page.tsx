'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Grid,
  Card,
  Chip,
  Stack,
  Alert,
  Paper,
  Avatar,
  Button,
  Rating,
  Skeleton,
  Typography,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  LocationOn as LocationIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';

import { formatDate, formatCurrency } from 'src/lib/utils';

import BidHistory from 'src/components/bidding/BidHistory';
import QuickBidDialog from 'src/components/bidding/QuickBidDialog';
import { RealtimeBidding } from 'src/components/auction/RealtimeBidding';

interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  location: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  reservePrice?: number;
  provenance?: string;
  dimensions?: string;
  weight?: string;
  materials?: string;
  authenticity?: string;
  createdAt: string;
  // Unified auction fields (now part of Product)
  auctionStatus?: 'SCHEDULED' | 'LIVE' | 'ENDED';
  startTime?: string;
  endTime?: string;
  currentBid?: number;
  startingBid?: number;
  bidIncrement?: number;
  bidCount?: number;
  uniqueBidders?: number;
  auctionType?: string;
  category: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  agent: {
    id: string;
    displayName: string;
    businessName: string;
    bio?: string;
    logoUrl?: string;
    rating?: number;
    reviewCount: number;
    totalSales: number;
    totalAuctions: number;
    successfulAuctions: number;
  };
}

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidRefreshTrigger, setBidRefreshTrigger] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    params.then(p => {
      if (p.id) {
        loadProduct(p.id);
      }
    });
  }, [params]);

  // Countdown timer effect for main component
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

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products/${productId}`);
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
        setProduct(data.data.product || data.data);
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

  const handleBidPlaced = () => {
    setBidRefreshTrigger(prev => prev + 1);
    if (product) {
      loadProduct(product.id);
    }
  };

  const isAuctionActive = () => product?.auctionStatus === 'LIVE';

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'success';
      case 'EXCELLENT': return 'info';
      case 'GOOD': return 'secondary';
      case 'FAIR': return 'warning';
      case 'POOR': return 'error';
      default: return 'default';
    }
  };

  // Countdown component
  const CountdownTimer = ({ endTime, startTime, auctionStatus }: { 
    endTime?: string; 
    startTime?: string; 
    auctionStatus?: string; 
  }) => {
    const [timeUntilStart, setTimeUntilStart] = useState<string>('');

    useEffect(() => {
      if (!endTime && !startTime) return;

      const timer = setInterval(() => {
        const now = new Date().getTime();
        
        if (startTime && auctionStatus === 'SCHEDULED') {
          const start = new Date(startTime).getTime();
          const distance = start - now;
          
          if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            setTimeUntilStart(
              days > 0 
                ? `${days}d ${hours}h ${minutes}m ${seconds}s`
                : `${hours}h ${minutes}m ${seconds}s`
            );
          } else {
            setTimeUntilStart('');
          }
        }

        if (endTime && auctionStatus === 'LIVE') {
          const end = new Date(endTime).getTime();
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
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [endTime, startTime, auctionStatus]);

    if (auctionStatus === 'SCHEDULED' && timeUntilStart) {
      return (
        <Card sx={{ 
          p: 3, 
          mb: 2, 
          background: 'linear-gradient(135deg, #CE0E2D, #FF4444)', 
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 16px rgba(206, 14, 45, 0.3)',
          border: 'none'
        }}>
          <Typography variant="h6" textAlign="center" sx={{ fontWeight: 'bold', mb: 1 }}>
            🕐 Starts in: {timeUntilStart}
          </Typography>
          <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
            Auction begins on {formatDate(startTime!)}
          </Typography>
        </Card>
      );
    }

    if (auctionStatus === 'LIVE' && timeLeft && timeLeft !== 'Auction Ended') {
      return (
        <Card sx={{ 
          p: 3, 
          mb: 2, 
          background: 'linear-gradient(135deg, #CE0E2D, #FF4444)', 
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 16px rgba(206, 14, 45, 0.3)',
          border: 'none',
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.02)' },
            '100%': { transform: 'scale(1)' },
          },
        }}>
          <Typography variant="h6" textAlign="center" sx={{ fontWeight: 'bold', mb: 1 }}>
            ⏰ Time Left: {timeLeft}
          </Typography>
          <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
            Ends on {formatDate(endTime!)}
          </Typography>
        </Card>
      );
    }

    if (auctionStatus === 'ENDED') {
      return (
        <Card sx={{ 
          p: 3, 
          mb: 2, 
          background: 'linear-gradient(135deg, #6c757d, #495057)', 
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 16px rgba(108, 117, 125, 0.2)',
          border: 'none'
        }}>
          <Typography variant="h6" textAlign="center" sx={{ fontWeight: 'bold', mb: 1 }}>
            🏁 Auction Ended
          </Typography>
          <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
            Ended on {formatDate(endTime!)}
          </Typography>
        </Card>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Box p={3} maxWidth="1400px" mx="auto">
        <Skeleton variant="text" width={300} height={40} />
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={40} width="60%" />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
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

  return (
    <Box sx={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Box maxWidth="1400px" mx="auto" px={3} py={2}>
        {/* Enhanced Breadcrumbs */}
        <Box sx={{ 
          mb: 3,
          p: 2,
          backgroundColor: '#0F1419',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <Breadcrumbs 
            separator="›"
            sx={{ 
              fontSize: '0.95rem',
              '& .MuiBreadcrumbs-separator': {
                color: '#CE0E2D',
                fontWeight: 'bold',
                mx: 1
              }
            }}
          >
            <MuiLink 
              href="/" 
              underline="none"
              sx={{ 
                color: '#ffffff',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                transition: 'all 0.2s',
                '&:hover': { 
                  color: '#CE0E2D',
                  backgroundColor: 'rgba(206, 14, 45, 0.1)'
                }
              }}
            >
              🏠 Home
            </MuiLink>
            <MuiLink 
              href="/products" 
              underline="none"
              sx={{ 
                color: '#ffffff',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                transition: 'all 0.2s',
                '&:hover': { 
                  color: '#CE0E2D',
                  backgroundColor: 'rgba(206, 14, 45, 0.1)'
                }
              }}
            >
              🔨 Products
            </MuiLink>
            <Typography 
              sx={{ 
                color: '#CE0E2D',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                px: 1,
                py: 0.5
              }}
            >
              {product.title.length > 50 ? `${product.title.substring(0, 50)}...` : product.title}
            </Typography>
          </Breadcrumbs>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Image Gallery */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              position: 'relative', 
              aspectRatio: '4/3', 
              overflow: 'hidden', 
              mb: 2,
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e0e0e0'
            }}>
            <Box
              component="img"
              src={product.images[currentImageIndex] || '/placeholder-image.jpg'}
              alt={product.title}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            
            {/* Image Navigation */}
            {product.images.length > 1 && (
              <>
                <IconButton
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255,255,255,0.95)',
                    color: '#CE0E2D',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      bgcolor: '#CE0E2D',
                      color: 'white',
                    }
                  }}
                  onClick={() => setCurrentImageIndex(prev => 
                    prev === 0 ? product.images.length - 1 : prev - 1
                  )}
                >
                  <ChevronLeftIcon />
                </IconButton>
                
                <IconButton
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255,255,255,0.95)',
                    color: '#CE0E2D',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      bgcolor: '#CE0E2D',
                      color: 'white',
                    }
                  }}
                  onClick={() => setCurrentImageIndex(prev => 
                    prev === product.images.length - 1 ? 0 : prev + 1
                  )}
                >
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}

            <Chip
              label={`${currentImageIndex + 1} / ${product.images.length}`}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                bgcolor: '#CE0E2D',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
              }}
            />
          </Paper>

          {/* Thumbnail Navigation */}
          {product.images.length > 1 && (
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
              {product.images.map((image, index) => (
                <Box
                  key={index}
                  component="img"
                  src={image}
                  alt={`${product.title} ${index + 1}`}
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: 2,
                    borderColor: index === currentImageIndex ? '#CE0E2D' : '#e0e0e0',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    opacity: index === currentImageIndex ? 1 : 0.7,
                    '&:hover': {
                      opacity: 1,
                      borderColor: '#CE0E2D',
                    }
                  }}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </Stack>
          )}

          {/* Quick Bid Dialog */}
          {product.auctionStatus === 'LIVE' && (
            <QuickBidDialog
              productId={product.id}
              currentBid={product.currentBid || 0}
              bidIncrement={product.bidIncrement || 1}
              timeLeft={timeLeft}
              auctionStatus={product.auctionStatus}
              onBidPlaced={handleBidPlaced}
            />
          )}
        </Grid>

        {/* Right Column - Product Info & Bidding */}
        <Grid item xs={12} md={6}>
          {/* Product Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box flex={1}>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  color: '#0F1419',
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  lineHeight: 1.3,
                  mb: 1
                }}
              >
                {product.title}
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <IconButton 
                onClick={() => setIsFavorite(!isFavorite)}
                sx={{
                  color: isFavorite ? '#CE0E2D' : '#6c757d',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: isFavorite ? '#CE0E2D' : '#f8f9fa',
                    color: isFavorite ? 'white' : '#CE0E2D',
                  }
                }}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              <IconButton
                sx={{
                  color: '#6c757d',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                    color: '#CE0E2D',
                  }
                }}
              >
                <ShareIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Current Bid and Condition */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={3}
            p={3}
            sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                Current Bid
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#CE0E2D', 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.25rem', md: '1.5rem' }
                }}
              >
                {formatCurrency(product.currentBid || product.startingBid || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mt: 0.5 }}>
                {product.bidCount || 0} bid{(product.bidCount || 0) !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Chip 
              label={product.condition.replace('_', ' ')} 
              sx={{
                backgroundColor: '#f8f9fa',
                color: '#0F1419',
                fontWeight: 600,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
              }}
            />
          </Box>

          {/* Location */}
          <Box display="flex" alignItems="center" mb={3} color="text.secondary">
            <LocationIcon sx={{ fontSize: 20, mr: 1 }} />
            <Typography>{product.location}</Typography>
          </Box>

          {/* Countdown Timer */}
          {product.auctionStatus && (
            <CountdownTimer 
              endTime={product.endTime}
              startTime={product.startTime}
              auctionStatus={product.auctionStatus}
            />
          )}

          {/* Real-time Bidding Component */}
          {product.auctionStatus === 'LIVE' && (
            <RealtimeBidding
              productId={product.id}
              productTitle={product.title}
              initialBid={product.currentBid || product.startingBid || 0}
              initialBidCount={product.bidCount || 0}
              bidIncrement={product.bidIncrement || 5}
              estimatedValueMin={product.estimatedValueMin || 0}
              estimatedValueMax={product.estimatedValueMax || 0}
            />
          )}

          {/* Current Bid Display - only show for non-live or no auctions */}
          {product.auctionStatus && product.auctionStatus !== 'LIVE' && (
            <Card sx={{ 
              mb: 3, 
              p: 3, 
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
            }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  color: '#0F1419', 
                  fontWeight: 'bold',
                  mb: 2,
                  fontSize: '1.1rem'
                }}
              >
                Auction Status
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: 2,
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                      {product.auctionStatus === 'ENDED' ? 'Final Bid' : 'Starting Bid'}
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#CE0E2D', 
                        fontWeight: 'bold',
                        fontSize: '1.5rem'
                      }}
                    >
                      {formatCurrency(product.currentBid || product.startingBid || 0)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: 2,
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                      Total Bids
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#CE0E2D', 
                        fontWeight: 'bold',
                        fontSize: '1.5rem'
                      }}
                    >
                      {product.bidCount || 0} bid{(product.bidCount || 0) !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          )}


          {/* Seller Information */}
          <Card sx={{ 
            p: 3,
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
          }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: '#0F1419', 
                fontWeight: 'bold',
                mb: 2,
                fontSize: '1.1rem'
              }}
            >
              Seller Information
            </Typography>
            
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar 
                src={product.agent.logoUrl} 
                alt={product.agent.displayName}
                sx={{ 
                  width: 60, 
                  height: 60, 
                  mr: 2,
                  border: '2px solid #e0e0e0'
                }}
              />
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#0F1419', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                >
                  {product.agent.displayName}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: '0.9rem' }}
                >
                  {product.agent.businessName}
                </Typography>
                {product.agent.rating && (
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <Rating 
                      value={product.agent.rating} 
                      readOnly 
                      size="small"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#CE0E2D',
                        }
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        ml: 1,
                        color: '#6c757d',
                        fontSize: '0.75rem'
                      }}
                    >
                      ({product.agent.reviewCount} reviews)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    textAlign: 'center'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#CE0E2D',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}
                  >
                    {product.agent.totalSales}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Total Sales
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    textAlign: 'center'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#CE0E2D',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}
                  >
                    {product.agent.totalAuctions}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Total Auctions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    textAlign: 'center'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#CE0E2D',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}
                  >
                    {product.agent.successfulAuctions}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Successful
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section - Bid History and Product Details */}
      <Box mt={4}>
        <Grid container spacing={4}>
          {/* Bid History - only show if product has auction status */}
          {product.auctionStatus && (
            <Grid item xs={12} md={8}>
              <BidHistory
                auctionId={product.id}
                currentBid={product.currentBid || product.startingBid || 0}
                refreshTrigger={bidRefreshTrigger}
              />
            </Grid>
          )}
          
          {/* Product Details - adjust width based on whether auction exists */}
          <Grid item xs={12} md={product.auctionStatus ? 4 : 12}>
            {/* Product Details */}
            <Card sx={{ 
              p: 3,
              backgroundColor: '#0F1419',
              border: '1px solid #0F1419',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(15, 20, 25, 0.3)'
            }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    mb: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  Product Details
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#CE0E2D', fontWeight: 'bold' }}>
                      Category
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>
                      {product.category.parent && `${product.category.parent.name} > `}
                      {product.category.name}
                    </Typography>
                  </Box>
                  
                  {product.dimensions && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#CE0E2D', fontWeight: 'bold' }}>
                        Dimensions
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>{product.dimensions}</Typography>
                    </Box>
                  )}
                  
                  {product.weight && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#CE0E2D', fontWeight: 'bold' }}>
                        Weight
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>{product.weight}</Typography>
                    </Box>
                  )}
                  
                  {product.materials && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#CE0E2D', fontWeight: 'bold' }}>
                        Materials
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>{product.materials}</Typography>
                    </Box>
                  )}
                  
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#CE0E2D', fontWeight: 'bold' }}>
                      Listed
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>
                      {formatDate(product.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
                
                <Box mt={3}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      color: '#ffffff', 
                      fontWeight: 'bold',
                      mb: 2,
                      fontSize: '1rem'
                    }}
                  >
                    Description
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: 'pre-line',
                      color: '#ffffff',
                      lineHeight: 1.6,
                      fontSize: '0.9rem',
                      opacity: 0.9
                    }}
                  >
                    {product.description}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}