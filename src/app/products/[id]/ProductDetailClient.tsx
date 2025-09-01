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
import { useLocale } from 'src/hooks/useLocale';

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
  reservePrice?: number;
  provenance?: string;
  dimensions?: string;
  weight?: string;
  materials?: string;
  authenticity?: string;
  createdAt: string;
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

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidRefreshTrigger, setBidRefreshTrigger] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [liveCurrentBid, setLiveCurrentBid] = useState<number | null>(null);
  const [liveBidCount, setLiveBidCount] = useState<number | null>(null);
  const [bidButtonDisabled, setBidButtonDisabled] = useState(false);
  const [bidCooldownTime, setBidCooldownTime] = useState(0);

  // WebSocket connection for live updates (only when auction is live)
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
      console.log('💰 Product page received bid update:', update);
      setLiveCurrentBid(update.currentBid);
      setLiveBidCount(update.bidCount);
      setBidRefreshTrigger(prev => prev + 1);
      // Force a slight delay to ensure state updates are processed
      setTimeout(() => setBidRefreshTrigger(prev => prev + 1), 100);
    },
    onError: (error) => {
      console.error('WebSocket error in product page:', error);
    }
  });

  // Share functionality
  const handleShare = async () => {
    const shareData = {
      title: `${product.title} - ${t('auction.platform')}`,
      text: `Check out this ${product.auctionStatus === 'LIVE' ? 'live auction' : 'auction'}: ${product.title}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    const url = window.location.href;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        // You could add a toast notification here
        alert(t('share.linkCopied', 'Link copied to clipboard!'));
      }).catch(() => {
        // Fallback to opening a popup
        openSharePopup(url);
      });
    } else {
      openSharePopup(url);
    }
  };

  const openSharePopup = (url: string) => {
    const encodedUrl = encodeURIComponent(url);
    const title = encodeURIComponent(`${product.title} - ${t('auction.platform')}`);
    
    // Create a simple share dialog
    const shareOptions = [
      { name: 'Twitter', url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${title}` },
      { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
      { name: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
      { name: 'WhatsApp', url: `https://wa.me/?text=${title}%20${encodedUrl}` },
    ];

    const selectedOption = shareOptions[0]; // Default to Twitter
    window.open(selectedOption.url, '_blank', 'width=600,height=400');
  };

  // Sync WebSocket values to local state when they change
  useEffect(() => {
    if (wsCurrentBid !== undefined && wsCurrentBid > 0) {
      setLiveCurrentBid(wsCurrentBid);
    }
    if (wsBidCount !== undefined && wsBidCount >= 0) {
      setLiveBidCount(wsBidCount);
    }
  }, [wsCurrentBid, wsBidCount]);

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
        setTimeLeft(t('auction.ended'));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [product, t]);

  const handleBidPlaced = () => {
    setBidRefreshTrigger(prev => prev + 1);
    
    // Start 5-second bid button freeze
    setBidButtonDisabled(true);
    setBidCooldownTime(5);
    
    const cooldownInterval = setInterval(() => {
      setBidCooldownTime(prev => {
        if (prev <= 1) {
          clearInterval(cooldownInterval);
          setBidButtonDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Get the display values (live updates if available, otherwise product values)
  const displayCurrentBid = liveCurrentBid ?? product?.currentBid ?? product?.startingBid ?? 0;
  const displayBidCount = liveBidCount ?? product?.bidCount ?? 0;

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Box maxWidth="1400px" mx="auto" px={{ xs: 2, md: 3 }} py={{ xs: 2, md: 3 }}>
        {/* Enhanced Breadcrumbs */}
        <Box sx={{ 
          mb: 3,
          p: 3,
          backgroundColor: '#0F1419',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <Breadcrumbs 
            separator="›"
            sx={{ 
              fontSize: '0.9rem',
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
              🏠 {t('navigation.home')}
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
              🔨 {t('navigation.products')}
            </MuiLink>
            <Typography 
              sx={{ 
                color: '#CE0E2D',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                px: 1,
                py: 0.5
              }}
            >
              {product.title.length > 40 ? `${product.title.substring(0, 40)}...` : product.title}
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* MAIN LAYOUT: LEFT SIDEBAR + RIGHT CONTENT */}
        <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', lg: 'row' } }}>
          
          {/* LEFT SIDEBAR: Auction Status, Bidding, and Actions */}
          <Box sx={{ width: { xs: '100%', lg: '350px' }, flexShrink: 0 }}>
            
            {/* AUCTION STATUS CARD */}
            <Card sx={{ 
              mb: 3,
              background: product.auctionStatus === 'LIVE' 
                ? 'linear-gradient(135deg, #CE0E2D, #FF4444)' 
                : product.auctionStatus === 'ENDED' 
                  ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                  : 'linear-gradient(135deg, #6c757d, #495057)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(206, 14, 45, 0.3)',
            }}>
              <Box p={3}>
                <Typography variant="h5" fontWeight="bold" mb={2} sx={{ textAlign: 'center' }}>
                  {product.auctionStatus === 'LIVE' && '🔴 LIVE AUCTION'}
                  {product.auctionStatus === 'ENDED' && '👑 AUCTION ENDED'}  
                  {product.auctionStatus === 'SCHEDULED' && '📅 UPCOMING'}
                </Typography>
                
                {/* Timer Display */}
                {product.auctionStatus === 'LIVE' && timeLeft && (
                  <Box textAlign="center" mb={2}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Time Remaining:
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      ⏰ {timeLeft}
                    </Typography>
                  </Box>
                )}
                {product.auctionStatus === 'SCHEDULED' && product.startTime && (
                  <Box textAlign="center" mb={2}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Starts:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatDate(product.startTime)}
                    </Typography>
                  </Box>
                )}
                {product.auctionStatus === 'ENDED' && product.endTime && (
                  <Box textAlign="center" mb={2}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Ended:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatDate(product.endTime)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>

            {/* CURRENT BID CARD */}
            <Card sx={{ 
              mb: 3,
              p: 3, 
              backgroundColor: '#ffffff',
              border: '3px solid',
              borderColor: product.auctionStatus === 'LIVE' ? '#CE0E2D' : 
                          product.auctionStatus === 'ENDED' ? '#FFD700' : '#e0e0e0',
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              {/* Live Connection Status */}
              {product.auctionStatus === 'LIVE' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 15,
                    right: 15,
                    backgroundColor: isConnected ? '#4CAF50' : '#f44336',
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    cursor: !isConnected ? 'pointer' : 'default'
                  }}
                  onClick={!isConnected ? reconnect : undefined}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'white',
                    }}
                  />
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </Box>
              )}
              
              <Typography 
                variant="body1" 
                color="text.secondary" 
                mb={2} 
                sx={{ 
                  fontSize: '1rem', 
                  fontWeight: 'bold',
                  mt: product.auctionStatus === 'LIVE' ? 3 : 0
                }}
              >
                {product.auctionStatus === 'ENDED' ? '👑 WINNING BID' : 
                 product.auctionStatus === 'LIVE' ? '💰 CURRENT BID' : '💵 STARTING BID'}
              </Typography>
              <Typography 
                variant="h2" 
                sx={{ 
                  color: product.auctionStatus === 'ENDED' ? '#FFD700' : '#CE0E2D', 
                  fontWeight: 'bold',
                  fontSize: { xs: '2.5rem', md: '3rem' },
                  mb: 2
                }}
              >
                {formatCurrency(displayCurrentBid)}
              </Typography>
            </Card>

            {/* TOTAL BIDS CARD */}
            <Card sx={{ 
              mb: 3,
              p: 3, 
              backgroundColor: '#f8f9fa',
              border: '2px solid #1976d2',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              textAlign: 'center'
            }}>
              <Typography variant="h2" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
                {displayBidCount}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                TOTAL BIDS
              </Typography>
              {product.auctionStatus === 'LIVE' && lastBid && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '2px solid #e9ecef' }}>
                  <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    Last: {lastBid.bidderName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(lastBid.bidTime).toLocaleTimeString()}
                  </Typography>
                </Box>
              )}
            </Card>

            {/* QUICK BID INTERFACE */}
            {product.auctionStatus === 'LIVE' && (
              <Card sx={{
                p: 3,
                backgroundColor: '#ffffff',
                border: '2px solid #CE0E2D',
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(206, 14, 45, 0.2)',
                mb: 3
              }}>
                <QuickBidDialog
                  productId={product.id}
                  currentBid={displayCurrentBid}
                  bidIncrement={product.bidIncrement || 1}
                  timeLeft={timeLeft}
                  auctionStatus={product.auctionStatus}
                  onBidPlaced={handleBidPlaced}
                  isConnected={isConnected}
                  connectionError={connectionError}
                  onReconnect={reconnect}
                  bidButtonDisabled={bidButtonDisabled}
                  bidCooldownTime={bidCooldownTime}
                  lastBidUpdate={lastBid ? {
                    id: lastBid.id || 'unknown',
                    amount: lastBid.amount,
                    bidderName: lastBid.bidderName,
                    bidTime: lastBid.bidTime
                  } : undefined}
                  liveCurrentBid={liveCurrentBid}
                  liveBidCount={liveBidCount}
                />
              </Card>
            )}

            {/* Quick Actions */}
            <Stack direction="row" spacing={2} mb={3} justifyContent="center">
              <IconButton
                onClick={() => setIsFavorite(!isFavorite)}
                sx={{
                  color: isFavorite ? '#CE0E2D' : '#666',
                  backgroundColor: '#f8f9fa',
                  border: '2px solid #e0e0e0',
                  borderRadius: 2,
                  padding: '12px',
                  '&:hover': {
                    backgroundColor: isFavorite ? '#CE0E2D' : '#f8f9fa',
                    color: isFavorite ? 'white' : '#CE0E2D',
                    borderColor: '#CE0E2D',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(206, 14, 45, 0.3)',
                  },
                  transition: 'all 0.2s ease'
                }}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              <IconButton
                onClick={() => handleShare()}
                sx={{
                  color: '#666',
                  backgroundColor: '#f8f9fa',
                  border: '2px solid #e0e0e0',
                  borderRadius: 2,
                  padding: '12px',
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                    color: '#1976d2',
                    borderColor: '#1976d2',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  },
                  transition: 'all 0.2s ease'
                }}
                title="Share this auction"
              >
                <ShareIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* RIGHT CONTENT: Images and Details */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            
            {/* PRODUCT IMAGES */}
            <Paper sx={{ 
              position: 'relative', 
              aspectRatio: '4/3', 
              overflow: 'hidden', 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e0e0e0'
            }}>
              <Box
                component="img"
                src={(product.images || [])[currentImageIndex] || '/placeholder-image.jpg'}
                alt={product.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              
              {/* Image Navigation */}
              {(product.images || []).length > 1 && (
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
                      prev === 0 ? (product.images || []).length - 1 : prev - 1
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
                      prev === (product.images || []).length - 1 ? 0 : prev + 1
                    )}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </>
              )}

              <Chip
                label={`${currentImageIndex + 1} / ${(product.images || []).length}`}
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
            {(product.images || []).length > 1 && (
              <Stack direction="row" spacing={1} sx={{ 
                overflowX: 'auto', 
                pb: 1,
                mb: 3,
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { backgroundColor: '#CE0E2D', borderRadius: 2 }
              }}>
                {(product.images || []).map((image, index) => (
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

            {/* PRODUCT TITLE & INFO */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h3" 
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  color: '#0F1419',
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                  lineHeight: 1.2,
                  mb: 2
                }}
              >
                {product.title}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Chip 
                  label={product.condition} 
                  size="medium"
                  variant="outlined"
                  sx={{ 
                    borderColor: '#CE0E2D',
                    color: '#CE0E2D',
                    fontWeight: 'bold'
                  }}
                />
                <Typography variant="h6" color="text.secondary" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 0.5 
                }}>
                  <LocationIcon fontSize="small" /> {product.location}
                </Typography>
              </Stack>
            </Box>

            {/* ADDITIONAL INFO GRID */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {/* Seller Information */}
                <Card sx={{ 
                  mb: 3,
                  p: 3,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      color: '#0F1419', 
                      fontWeight: 'bold',
                      mb: 2
                    }}
                  >
                    🏢 Seller Info
                  </Typography>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar 
                      src={product.agent.logoUrl} 
                      alt={product.agent.displayName}
                      sx={{ 
                        width: 50, 
                        height: 50, 
                        mr: 2,
                        border: '2px solid #e0e0e0'
                      }}
                    />
                    <Box>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#0F1419', 
                          fontWeight: 'bold'
                        }}
                      >
                        {product.agent.displayName}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                      >
                        {product.agent.businessName}
                      </Typography>
                    </Box>
                  </Box>

                  {product.agent.rating && (
                    <Box display="flex" alignItems="center" mb={2}>
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
                        variant="body2" 
                        sx={{ 
                          ml: 1,
                          color: '#6c757d'
                        }}
                      >
                        ({product.agent.reviewCount} reviews)
                      </Typography>
                    </Box>
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center" p={1}>
                        <Typography variant="h6" sx={{ color: '#CE0E2D', fontWeight: 'bold' }}>
                          {product.agent.totalSales}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sales
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center" p={1}>
                        <Typography variant="h6" sx={{ color: '#CE0E2D', fontWeight: 'bold' }}>
                          {product.agent.totalAuctions}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Auctions
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center" p={1}>
                        <Typography variant="h6" sx={{ color: '#CE0E2D', fontWeight: 'bold' }}>
                          {product.agent.successfulAuctions}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Success
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                {/* Auction Information */}
                <Card sx={{ 
                  mb: 3,
                  p: 3,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      color: '#0F1419', 
                      fontWeight: 'bold',
                      mb: 2
                    }}
                  >
                    📈 Auction Info
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        ESTIMATED VALUE
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#0F1419', fontWeight: 'bold' }}>
                        {product.estimatedValueMin && product.estimatedValueMax 
                          ? `${formatCurrency(product.estimatedValueMin)} - ${formatCurrency(product.estimatedValueMax)}`
                          : 'Contact Agent'
                        }
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        BID INCREMENT
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#0F1419', fontWeight: 'bold' }}>
                        {formatCurrency(product.bidIncrement || 1)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        RESERVE PRICE
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#0F1419', fontWeight: 'bold' }}>
                        {product.reservePrice ? formatCurrency(product.reservePrice) : 'Not disclosed'}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>

            {/* BID HISTORY */}
            {product.auctionStatus && (
              <Card sx={{
                mb: 3,
                backgroundColor: '#ffffff',
                borderRadius: 2,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e0e0e0',
                maxHeight: '400px',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  p: 2,
                  backgroundColor: '#0F1419',
                  color: 'white'
                }}>
                  <Typography variant="h6" fontWeight="bold">
                    📊 Recent Bids
                  </Typography>
                </Box>
                <Box sx={{ maxHeight: '350px', overflow: 'auto' }}>
                  <BidHistory
                    auctionId={product.id}
                    currentBid={displayCurrentBid}
                    refreshTrigger={bidRefreshTrigger}
                    isLive={product.auctionStatus === 'LIVE'}
                    isConnected={isConnected}
                  />
                </Box>
              </Card>
            )}

            {/* PRODUCT DESCRIPTION */}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                📝 Product Description
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-line',
                  color: '#0F1419',
                  lineHeight: 1.6
                }}
              >
                {product.description}
              </Typography>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}