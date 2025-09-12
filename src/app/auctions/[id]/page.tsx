'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Gavel as AuctionIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
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
} from '@mui/material';

import { formatDate, formatCurrency, formatTimeRemaining } from 'src/lib/utils';

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

  return (
    <Box p={3} maxWidth="1400px" mx="auto">
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink href="/" underline="hover" color="inherit">
          Home
        </MuiLink>
        <MuiLink href="/auctions" underline="hover" color="inherit">
          Auctions
        </MuiLink>
        <Typography color="text.primary">{product.title}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Product Images */}
          {product.images.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <Box
                component="img"
                src={product.images[0]}
                alt={product.title}
                sx={{
                  width: '100%',
                  height: 400,
                  objectFit: 'cover',
                }}
              />
            </Card>
          )}

          {/* Auction Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {product.description}
              </Typography>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Condition
                  </Typography>
                  <Chip 
                    label={product.condition.replace('_', ' ')} 
                    color={getConditionColor(product.condition)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2">
                      {product.location}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estimated Value
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(product.estimatedValueMin)} - {formatCurrency(product.estimatedValueMax)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Auction Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Typography variant="h6">
                  {product.title}
                </Typography>
                <Chip 
                  label={product.auctionStatus?.replace('_', ' ') || 'Not Available'}
                  color={getStatusColor(product.auctionStatus)}
                />
              </Box>

              {/* Current Bid */}
              <Typography variant="h4" color="primary.main" gutterBottom>
                {formatCurrency(product.currentBid)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Bid
              </Typography>

              {/* Winner Information for Ended Auctions */}
              {product.auctionStatus === 'ENDED' && winner && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    🎉 Auction Winner
                  </Typography>
                  <Typography variant="body2">
                    Won by: {winner.isAnonymous ? '🕶️ Hidden User' : winner.name}
                  </Typography>
                  <Typography variant="body2">
                    Winning bid: {formatCurrency(product.currentBid)}
                  </Typography>
                </Alert>
              )}

              {/* Bid Stats */}
              <Stack spacing={1} mb={3}>
                {product.startingBid && (
                  <Typography variant="body2">
                    Starting Bid: {formatCurrency(product.startingBid)}
                  </Typography>
                )}
                {product.bidIncrement && (
                  <Typography variant="body2">
                    Bid Increment: {formatCurrency(product.bidIncrement)}
                  </Typography>
                )}
                <Typography variant="body2">
                  {product.bidCount} bid{product.bidCount !== 1 ? 's' : ''} from {product.uniqueBidders} bidder{product.uniqueBidders !== 1 ? 's' : ''}
                </Typography>
              </Stack>

              {/* Timing */}
              {(product.startTime || product.endTime) && (
                <Box display="flex" alignItems="center" mb={2} color="text.secondary">
                  <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">
                    {product.auctionStatus === 'SCHEDULED' && product.startTime
                      ? `Starts ${formatTimeRemaining(product.startTime)}`
                      : product.auctionStatus === 'LIVE' && product.endTime
                      ? `Ends ${formatTimeRemaining(product.endTime)}`
                      : product.auctionStatus === 'ENDED' && product.endTime
                      ? `Ended ${formatDate(product.endTime)}`
                      : 'Time not available'
                    }
                  </Typography>
                </Box>
              )}

              {/* Bid Button */}
              {product.auctionStatus === 'LIVE' && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<AuctionIcon />}
                  sx={{ mb: 2 }}
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  Place Bid
                </Button>
              )}

              {product.auctionStatus === 'SCHEDULED' && (
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  disabled
                >
                  Auction Not Started
                </Button>
              )}

              {product.auctionStatus === 'ENDED' && !winner && (
                <Alert severity="info">
                  This auction has ended
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seller Information
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar 
                  src={product.agent.logoUrl} 
                  alt={product.agent.displayName}
                  sx={{ width: 50, height: 50, mr: 2 }}
                >
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">
                    {product.agent.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.agent.businessName}
                  </Typography>
                  {product.agent.rating && (
                    <Typography variant="caption" color="text.secondary">
                      ⭐ {Number(product.agent.rating).toFixed(1)} ({product.agent.reviewCount} reviews)
                    </Typography>
                  )}
                </Box>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => router.push(`/products/${product.id}`)}
              >
                View Product Details
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}