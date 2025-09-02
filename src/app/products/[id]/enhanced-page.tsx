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
  Typography,
  IconButton,
  Breadcrumbs,
  CardContent,
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

import { ProductAuctionCard } from 'src/components/product-card';
import { BidHistory, BiddingInterface } from 'src/components/bidding';

interface AuctionDetails {
  id: string;
  title: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  startTime: string;
  endTime: string;
  currentBid: number;
  minimumBid: number;
  bidIncrement: number;
  bidCount: number;
  uniqueBidders: number;
  reserveMet: boolean;
  createdAt: string;
}

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
  auction?: AuctionDetails | null;
}

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EnhancedProductPage({ params }: ProductPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidRefreshTrigger, setBidRefreshTrigger] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    params.then(p => {
      if (p.id) {
        loadProduct(p.id);
      }
    });
  }, [params]);

  // Live countdown timer
  useEffect(() => {
    if (!product?.auction?.endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(product.auction!.endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [product?.auction?.endTime]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products/${productId}?includeAuction=true`);
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
        setProduct(data.data);
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
    // Refresh bid history and product data
    setBidRefreshTrigger(prev => prev + 1);
    if (product) {
      loadProduct(product.id);
    }
  };

  const isAuctionActive = () => product?.auction?.status === 'LIVE';

  const getStatusColor = (status: string) => {
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
        <Typography>Loading...</Typography>
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
    <Box p={3} maxWidth="1400px" mx="auto">
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink href="/" underline="hover" color="inherit">
          Home
        </MuiLink>
        <MuiLink href="/products" underline="hover" color="inherit">
          Products
        </MuiLink>
        <Typography color="text.primary">{product.title}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Left Column - Image Gallery */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', mb: 2 }}>
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
                    bgcolor: 'rgba(255,255,255,0.9)',
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
                    bgcolor: 'rgba(255,255,255,0.9)',
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
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
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
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: index === currentImageIndex ? 2 : 1,
                    borderColor: index === currentImageIndex ? 'primary.main' : 'divider',
                    flexShrink: 0,
                  }}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </Stack>
          )}
        </Grid>

        {/* Right Column - Product Info & Bidding */}
        <Grid item xs={12} md={6}>
          {/* Product Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h4" component="h1">
              {product.title}
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <IconButton onClick={() => setIsFavorite(!isFavorite)}>
                {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              </IconButton>
              <IconButton>
                <ShareIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Price and Condition */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              {formatCurrency(product.estimatedValueMin)} - {formatCurrency(product.estimatedValueMax)}
            </Typography>
            <Chip 
              label={product.condition.replace('_', ' ')} 
              color={getConditionColor(product.condition)}
            />
          </Box>

          {/* Location */}
          <Box display="flex" alignItems="center" mb={3} color="text.secondary">
            <LocationIcon sx={{ fontSize: 20, mr: 1 }} />
            <Typography>{product.location}</Typography>
          </Box>

          {/* Live Auction Card */}
          {product.auction && (
            <Card sx={{ mb: 3, overflow: 'visible' }}>
              <CardContent sx={{ p: 0 }}>
                <ProductAuctionCard
                  id={product.auction.id}
                  title={product.auction.title}
                  subtitle={`${product.auction.bidCount} bids from ${product.auction.uniqueBidders} bidders`}
                  image={product.images[0] || '/placeholder-image.jpg'}
                  auctionType={product.auction.status === 'LIVE' ? 'live' : 'sealed'}
                  endTime={product.auction.status === 'LIVE' ? product.auction.endTime : undefined}
                  currentBid={product.auction.currentBid}
                  bidsCount={product.auction.bidCount}
                  onClick={() => router.push(`/products/${product.auction!.id}`)}
                />
              </CardContent>
            </Card>
          )}

          {/* Bidding Interface */}
          {product.auction && isAuctionActive() && (
            <Box mb={3}>
              <BiddingInterface
                auctionId={product.auction.id}
                currentBid={product.auction.currentBid}
                minimumBid={product.auction.minimumBid}
                bidIncrement={product.auction.bidIncrement}
                endTime={product.auction.endTime}
                isActive={isAuctionActive()}
                onBidPlaced={handleBidPlaced}
              />
            </Box>
          )}

          {/* Seller Information */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Seller Information
            </Typography>
            
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar 
                src={product.agent.logoUrl} 
                alt={product.agent.displayName}
                sx={{ width: 60, height: 60, mr: 2 }}
              />
              <Box>
                <Typography variant="h6">
                  {product.agent.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.agent.businessName}
                </Typography>
                {product.agent.rating && (
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <Rating value={product.agent.rating} readOnly size="small" />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      ({product.agent.reviewCount} reviews)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="h6" color="primary.main">
                  {product.agent.totalSales}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Sales
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" color="primary.main">
                  {product.agent.totalAuctions}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Auctions
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" color="primary.main">
                  {product.agent.successfulAuctions}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Successful
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Section - Bid History */}
      {product.auction && (
        <Box mt={4}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <BidHistory
                auctionId={product.auction.id}
                currentBid={product.auction.currentBid}
                refreshTrigger={bidRefreshTrigger}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              {/* Product Details */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Product Details
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body2">
                      {product.category.parent && `${product.category.parent.name} > `}
                      {product.category.name}
                    </Typography>
                  </Box>
                  
                  {product.dimensions && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Dimensions
                      </Typography>
                      <Typography variant="body2">{product.dimensions}</Typography>
                    </Box>
                  )}
                  
                  {product.weight && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Weight
                      </Typography>
                      <Typography variant="body2">{product.weight}</Typography>
                    </Box>
                  )}
                  
                  {product.materials && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Materials
                      </Typography>
                      <Typography variant="body2">{product.materials}</Typography>
                    </Box>
                  )}
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Listed
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(product.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
                
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {product.description}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}