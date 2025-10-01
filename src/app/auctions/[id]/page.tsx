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
  TrendingUp as TrendingUpIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
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
  Divider,
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
      <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 2 }} />
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh', py: 4 }}>
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

  // Check if this product has auction functionality
  if (!product.auctionStatus) {
    return (
      <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh', py: 4 }}>
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

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'grey.100',
    }}>
      <Container maxWidth="xl" sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: 3, md: 4 }
      }}>
        {/* Breadcrumbs */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 2,
            bgcolor: 'grey.800',
            borderRadius: 2,
          }}
        >
          <Breadcrumbs
            separator="›"
            sx={{
              '& .MuiBreadcrumbs-separator': {
                color: 'primary.main',
                fontWeight: 'bold',
                mx: 1,
              }
            }}
          >
            <MuiLink
              href="/"
              sx={{
                color: 'common.white',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': {
                  color: 'primary.light',
                }
              }}
            >
              Home
            </MuiLink>
            <MuiLink
              href="/auctions"
              sx={{
                color: 'common.white',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': {
                  color: 'primary.light',
                }
              }}
            >
              Auctions
            </MuiLink>
            <Typography
              sx={{
                color: 'primary.main',
                fontWeight: 'bold',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: { xs: '200px', sm: '400px' }
              }}
            >
              {product.title}
            </Typography>
          </Breadcrumbs>
        </Paper>

        {/* Main Content Grid */}
        <Grid container spacing={3}>

          {/* Left Sidebar - Auction Status & Info */}
          <Grid item xs={12} lg={3}>
            <Stack spacing={3}>
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
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      mb: 2
                    }}
                  >
                    Quick Actions
                  </Typography>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                      <IconButton
                        onClick={() => setIsFavorite(!isFavorite)}
                        sx={{
                          color: isFavorite ? 'primary.main' : 'text.secondary',
                          bgcolor: isFavorite ? 'primary.lighter' : 'grey.200',
                          width: 48,
                          height: 48,
                          transition: 'all 0.3s',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'common.white',
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share auction">
                      <IconButton
                        sx={{
                          color: 'text.secondary',
                          bgcolor: 'grey.200',
                          width: 48,
                          height: 48,
                          transition: 'all 0.3s',
                          '&:hover': {
                            bgcolor: 'info.main',
                            color: 'common.white',
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Center - Product Image */}
          <Grid item xs={12} lg={6}>
            <AuctionImageGallery images={product.images} title={product.title} />
          </Grid>

          {/* Right Sidebar - Bidding Info */}
          <Grid item xs={12} lg={3}>
            <Stack spacing={3}>

              <AuctionBidCard
                currentBid={displayCurrentBid}
                bidCount={displayBidCount}
                uniqueBidders={product.uniqueBidders}
                auctionStatus={product.auctionStatus}
              />

              {/* Bid Details Card */}
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <TrendingUpIcon fontSize="small" color="success" />
                    Bid Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: 'success.lighter',
                      border: '1px solid',
                      borderColor: 'success.light'
                    }}>
                      <Typography variant="caption" color="success.dark" fontWeight={700} sx={{ mb: 0.5, display: 'block' }}>
                        STARTING BID
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="text.primary">
                        {formatCurrency(product.startingBid || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: 'secondary.lighter',
                      border: '1px solid',
                      borderColor: 'secondary.light'
                    }}>
                      <Typography variant="caption" color="secondary.dark" fontWeight={700} sx={{ mb: 0.5, display: 'block' }}>
                        BID INCREMENT
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="text.primary">
                        {formatCurrency(product.bidIncrement || 1)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Seller Information Card */}
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <PersonIcon fontSize="small" color="primary" />
                    Seller
                  </Typography>

                  {product.agent ? (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}>
                      <Avatar
                        src={product.agent.logoUrl}
                        alt={product.agent.displayName}
                        sx={{
                          width: 56,
                          height: 56,
                          border: '3px solid',
                          borderColor: 'primary.main',
                        }}
                      />
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" gutterBottom>
                          {product.agent.displayName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
                          {product.agent.businessName}
                        </Typography>
                        {product.agent.rating && (
                          <Box sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: 'warning.lighter',
                          }}>
                            <Typography variant="caption" fontWeight={600} color="warning.dark">
                              ★ {Number(product.agent.rating).toFixed(1)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({product.agent.reviewCount})
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: 'grey.400',
                        }}
                      >
                        ?
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                          Unknown Seller
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Information not available
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* Bottom Section - Details & Bidding */}
        <Grid container spacing={3} sx={{ mt: 1 }}>

          {/* Product Description */}
          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={2} sx={{
              borderRadius: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{
                p: 2.5,
                bgcolor: 'success.main',
                color: 'common.white',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <DescriptionIcon />
                <Typography variant="h6" fontWeight="bold">
                  Description
                </Typography>
              </Box>
              <CardContent sx={{
                p: 3,
                flex: 1,
                maxHeight: 450,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'grey.400',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'grey.500',
                  }
                }
              }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary' }}>
                  {product.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Bid History */}
          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={2} sx={{
              borderRadius: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{
                p: 2.5,
                bgcolor: 'grey.800',
                color: 'common.white',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <AssessmentIcon />
                <Typography variant="h6" fontWeight="bold">
                  Bid History
                </Typography>
              </Box>
              <Box sx={{
                flex: 1,
                maxHeight: 450,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'grey.100',
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'grey.400',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'grey.500',
                  }
                }
              }}>
                <BidHistory
                  auctionId={product.id}
                  currentBid={displayCurrentBid}
                  refreshTrigger={bidRefreshTrigger}
                  isLive={product.auctionStatus === 'LIVE'}
                  isConnected={isConnected}
                />
              </Box>
            </Card>
          </Grid>

          {/* Quick Bid Interface */}
          <Grid item xs={12} lg={4}>
            <Card elevation={2} sx={{
              borderRadius: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              border: '2px solid',
              borderColor: product.auctionStatus === 'LIVE' ? 'primary.main' : 'divider'
            }}>
              <Box sx={{
                p: 2.5,
                bgcolor: 'primary.main',
                color: 'common.white',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <GavelIcon />
                <Typography variant="h6" fontWeight="bold">
                  Place Your Bid
                </Typography>
              </Box>
              <CardContent sx={{ p: 3, flex: 1 }}>
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
                  <Alert severity="info">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Auction Not Started
                    </Typography>
                    <Typography variant="body2">
                      This auction will begin on {product.startTime ? formatDate(product.startTime) : 'TBA'}
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="warning">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Auction Ended
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      This auction ended on {product.endTime ? formatDate(product.endTime) : 'N/A'}
                    </Typography>
                    {winner && (
                      <>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="body2" fontWeight="bold" color="success.dark">
                          Winner: {winner.isAnonymous ? 'Anonymous Bidder' : winner.name}
                        </Typography>
                      </>
                    )}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Seller Information (if available) */}
          {product.showSellerInfo && (
            product.sellerName ||
            product.sellerContact ||
            product.sellerEmail ||
            product.sellerLocation ||
            product.sellerNotes
          ) && (
            <Grid item xs={12}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <Box sx={{
                  p: 2.5,
                  bgcolor: 'info.main',
                  color: 'common.white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}>
                  <PersonIcon />
                  <Typography variant="h6" fontWeight="bold">
                    Additional Seller Information
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {product.sellerName && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                          Name
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {product.sellerName}
                        </Typography>
                      </Grid>
                    )}

                    {product.sellerLocation && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                          Location
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {product.sellerLocation}
                        </Typography>
                      </Grid>
                    )}

                    {product.sellerContact && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                          Contact
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {product.sellerContact}
                        </Typography>
                      </Grid>
                    )}

                    {product.sellerEmail && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                          Email
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {product.sellerEmail}
                        </Typography>
                      </Grid>
                    )}

                    {product.sellerNotes && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                          Additional Notes
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6, color: 'text.secondary' }}>
                          {product.sellerNotes}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
