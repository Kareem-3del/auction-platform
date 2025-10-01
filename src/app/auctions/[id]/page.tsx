'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Person as PersonIcon,
  MonetizationOn as BidIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Assessment as AssessmentIcon,
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
  Paper,
  IconButton,
  Tooltip,
  Container,
} from '@mui/material';

import { formatDate, formatCurrency } from 'src/lib/utils';
import BidHistory from 'src/components/bidding/BidHistory';
import QuickBidDialog from 'src/components/bidding/QuickBidDialog';
import { useRealtimeBidding } from 'src/hooks/useRealtimeBidding';
import AuctionStatusCard from 'src/components/auction/AuctionStatusCard';
import AuctionInfoCard from 'src/components/auction/AuctionInfoCard';
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

        {/* MAIN LAYOUT - Spacious Design */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: { xs: 3, md: 4 }
        }}>
          
          {/* TOP SECTION - Main Content */}
          <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: { xs: 1, md: 1.5 } }}>
            
            {/* LEFT PANEL - Auction Information */}
            <Grid item xs={12} lg={3} sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: { xs: 2.5, md: 3 }
            }}>
              
              <AuctionStatusCard
                auctionStatus={product.auctionStatus}
                timeLeft={timeLeft}
                startTime={product.startTime}
                endTime={product.endTime}
                isConnected={isConnected}
              />

              <AuctionInfoCard
                title={product.title}
                location={product.location}
                condition={product.condition}
                estimatedValueMin={product.estimatedValueMin}
                estimatedValueMax={product.estimatedValueMax}
              />

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
              <AuctionImageGallery images={product.images} title={product.title} />
            </Grid>

            {/* RIGHT PANEL - Bidding Interface */}
            <Grid item xs={12} lg={3} sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: { xs: 3.5, md: 4.5 }
            }}>
              
              <AuctionBidCard
                currentBid={displayCurrentBid}
                bidCount={displayBidCount}
                uniqueBidders={product.uniqueBidders}
                auctionStatus={product.auctionStatus}
              />

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
                minHeight: { xs: '350px', md: '400px' },
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
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
                  <Box sx={{ height: { xs: 'auto', lg: '350px' }, minHeight: { xs: '280px', lg: '350px' }, overflow: 'auto' }}>
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
                minHeight: { xs: '350px', md: '400px' },
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
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
                  <Box sx={{ height: { xs: 'auto', lg: '350px' }, minHeight: { xs: '280px', lg: '350px' }, overflow: 'auto' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {product.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Seller Information */}
            {product.showSellerInfo && (
              product.sellerName || 
              product.sellerContact || 
              product.sellerEmail || 
              product.sellerLocation || 
              product.sellerNotes
            ) && (
              <Grid item xs={12} lg={4}>
                <Card sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(25, 118, 210, 0.15)',
                  border: '2px solid rgba(25, 118, 210, 0.2)',
                  bgcolor: '#ffffff',
                }}>
                  <Box sx={{
                    p: { xs: 3, md: 4 },
                    bgcolor: '#1976d2',
                    color: 'white'
                  }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2
                    }}>
                      <PersonIcon /> Seller Information
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack spacing={3}>
                      {product.sellerName && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Name
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {product.sellerName}
                          </Typography>
                        </Box>
                      )}
                      
                      {product.sellerLocation && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Location
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {product.sellerLocation}
                          </Typography>
                        </Box>
                      )}
                      
                      {product.sellerContact && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Contact
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {product.sellerContact}
                          </Typography>
                        </Box>
                      )}
                      
                      {product.sellerEmail && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Email
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {product.sellerEmail}
                          </Typography>
                        </Box>
                      )}
                      
                      {product.sellerNotes && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Additional Notes
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                            {product.sellerNotes}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Quick Bid Interface */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ 
                minHeight: { xs: '350px', md: '400px' },
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(206, 14, 45, 0.15)',
                border: '2px solid rgba(206, 14, 45, 0.2)',
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