'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  Box,
  TextField,
  Typography,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  Avatar,
  Badge,
  Grid,
  Paper,
  InputAdornment,
  Fade,
  Skeleton,
  Container,
} from '@mui/material';

import {
  Close as CloseIcon,
  Search as SearchIcon,
  TrendingUp as TrendingIcon,
  History as HistoryIcon,
  Category as CategoryIcon,
  Gavel as AuctionIcon,
  ShoppingBag as ProductIcon,
  Star as StarIcon,
  ArrowForward as ArrowIcon,
  Clear as ClearIcon,
  Schedule as TimeIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

import { useAuth } from 'src/hooks/useAuth';
import { useLocale } from 'src/hooks/useLocale';
import { formatCurrency, formatTimeRemaining } from 'src/lib/utils';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'product' | 'auction' | 'category' | 'brand';
  image?: string;
  price?: number;
  category?: string;
  location?: string;
  endTime?: string;
  isLive?: boolean;
  agent?: string;
  rating?: number;
  count?: number;
  description?: string;
}

interface QuickCategory {
  name: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  path: string;
}

export default function SearchDialog({ open, onClose }: SearchDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocale();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mock data for quick categories
  const quickCategories: QuickCategory[] = [
    {
      name: 'Cars & Motors',
      icon: <CategoryIcon />,
      count: 1247,
      color: '#1976D2',
      path: '/search?categories=Cars'
    },
    {
      name: 'Jewelry',
      icon: <StarIcon />,
      count: 856,
      color: '#9C27B0',
      path: '/search?categories=Jewelry'
    },
    {
      name: 'Art & Collectibles',
      icon: <CategoryIcon />,
      count: 642,
      color: '#FF9800',
      path: '/search?categories=Art,Collectibles'
    },
    {
      name: 'Electronics',
      icon: <CategoryIcon />,
      count: 423,
      color: '#4CAF50',
      path: '/search?categories=Electronics'
    },
  ];

  // Mock trending searches
  const trendingSearches = [
    'Rolex watches',
    'Vintage cars',
    'Diamond rings',
    'Modern art',
    'Luxury bags',
    'Antique furniture'
  ];

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }
  }, []);

  // Focus search input when dialog opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=6`);
      
      if (!response.ok) {
        console.error('Search API error:', response.status, response.statusText);
        setSuggestions([]);
        return;
      }
      
      const data = await response.json();
      console.log('Search suggestions response:', data);

      if (data.success && data.data && data.data.suggestions) {
        setSuggestions(data.data.suggestions || []);
      } else {
        console.warn('No suggestions found or invalid response format');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Search suggestions error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search queries
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    // Save to recent searches
    const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));

    // Navigate to search page
    router.push(`/search?q=${encodeURIComponent(query)}`);
    onClose();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    let path = '';
    
    switch (suggestion.type) {
      case 'product':
      case 'auction':
        path = `/products/${suggestion.id}`;
        break;
      case 'category':
        path = `/search?categories=${encodeURIComponent(suggestion.title)}`;
        break;
      case 'brand':
        path = `/search?search=${encodeURIComponent(suggestion.title)}`;
        break;
      default:
        path = `/products/${suggestion.id}`;
    }
    
    router.push(path);
    onClose();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: { xs: '100%', sm: '600px', md: '700px' },
          height: { xs: '100%', sm: 'auto' },
          maxHeight: { xs: '100%', sm: '80vh' },
          m: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 3 },
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        },
      }}
      TransitionComponent={Fade}
    >
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              p: 3,
              pb: 2,
              background: 'linear-gradient(135deg, #CE0E2D 0%, #B00C24 100%)',
              color: 'white',
              position: 'relative',
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <SearchIcon sx={{ fontSize: 28, opacity: 0.9 }} />
              <Typography variant="h5" fontWeight="bold" flex={1}>
                {t('search.title', 'Search Everything')}
              </Typography>
              <IconButton
                onClick={onClose}
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            {/* Search Input */}
            <TextField
              ref={searchInputRef}
              fullWidth
              placeholder={t('search.placeholder', 'Search products, auctions, categories...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: '2px solid #CE0E2D' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#CE0E2D', ml: 1 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      sx={{ color: 'text.secondary' }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {searchQuery.length >= 2 ? (
              // Search Suggestions
              <Box sx={{ p: 2 }}>
                {loading ? (
                  <Stack spacing={1}>
                    {[...Array(4)].map((_, index) => (
                      <Paper key={index} sx={{ p: 2, display: 'flex', gap: 2 }}>
                        <Skeleton variant="rectangular" width={60} height={60} />
                        <Box flex={1}>
                          <Skeleton variant="text" width="70%" height={24} />
                          <Skeleton variant="text" width="50%" height={20} />
                          <Skeleton variant="text" width="30%" height={16} />
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                ) : suggestions.length > 0 ? (
                  <Stack spacing={1}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {t('search.results', 'Search Results')}
                    </Typography>
                    {suggestions.map((suggestion) => (
                      <Paper
                        key={suggestion.id}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-1px)',
                          },
                        }}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Box display="flex" gap={2} alignItems="center">
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 2,
                              overflow: 'hidden',
                              backgroundColor: '#f5f5f5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                            }}
                          >
                            {suggestion.image ? (
                              <img
                                src={suggestion.image}
                                alt={suggestion.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <CategoryIcon color="disabled" />
                            )}
                            {suggestion.isLive && (
                              <Chip
                                label="LIVE"
                                size="small"
                                color="error"
                                sx={{
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  fontSize: '0.65rem',
                                  height: 16,
                                }}
                              />
                            )}
                          </Box>
                          
                          <Box flex={1} minWidth={0}>
                            <Typography
                              variant="subtitle1"
                              fontWeight={600}
                              noWrap
                              sx={{ color: 'text.primary' }}
                            >
                              {suggestion.title}
                            </Typography>
                            
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Chip
                                icon={
                                  suggestion.type === 'auction' ? <AuctionIcon /> :
                                  suggestion.type === 'product' ? <ProductIcon /> :
                                  suggestion.type === 'category' ? <CategoryIcon /> :
                                  <StarIcon />
                                }
                                label={
                                  suggestion.type === 'auction' ? t('search.types.auction', 'Auction') :
                                  suggestion.type === 'product' ? t('search.types.product', 'Product') :
                                  suggestion.type === 'category' ? t('search.types.category', 'Category') :
                                  t('search.types.brand', 'Brand')
                                }
                                size="small"
                                color={
                                  suggestion.type === 'auction' ? 'error' :
                                  suggestion.type === 'product' ? 'primary' :
                                  suggestion.type === 'category' ? 'secondary' :
                                  'warning'
                                }
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                              
                              {suggestion.category && (suggestion.type === 'product' || suggestion.type === 'auction') && (
                                <Typography variant="caption" color="text.secondary">
                                  {suggestion.category}
                                </Typography>
                              )}

                              {suggestion.description && (suggestion.type === 'category' || suggestion.type === 'brand') && (
                                <Typography variant="caption" color="text.secondary">
                                  {suggestion.description}
                                </Typography>
                              )}
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                              <Box display="flex" alignItems="center" gap={2}>
                                {(suggestion.type === 'product' || suggestion.type === 'auction') && (
                                  <Typography
                                    variant="h6"
                                    color="primary.main"
                                    fontWeight={700}
                                  >
                                    {formatCurrency(suggestion.price || 0)}
                                  </Typography>
                                )}

                                {(suggestion.type === 'category' || suggestion.type === 'brand') && suggestion.count && (
                                  <Typography
                                    variant="h6"
                                    color="secondary.main"
                                    fontWeight={700}
                                  >
                                    {suggestion.count.toLocaleString()} {t('search.items', 'items')}
                                  </Typography>
                                )}
                                
                                {suggestion.location && (
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {suggestion.location}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              {suggestion.type === 'auction' && suggestion.endTime && (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <TimeIcon sx={{ fontSize: 14, color: 'error.main' }} />
                                  <Typography variant="caption" color="error.main" fontWeight={500}>
                                    {formatTimeRemaining(suggestion.endTime)}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>

                          <ArrowIcon color="action" />
                        </Box>
                      </Paper>
                    ))}
                    
                    {/* View All Results Button */}
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: '#f8f9fa',
                        '&:hover': { backgroundColor: '#e9ecef' },
                      }}
                      onClick={() => handleSearch(searchQuery)}
                    >
                      <Typography color="primary" fontWeight={600}>
                        {t('search.viewAll', 'View all results for')} "{searchQuery}" →
                      </Typography>
                    </Paper>
                  </Stack>
                ) : searchQuery.length >= 2 && !loading ? (
                  <Box textAlign="center" py={4}>
                    <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {t('search.noResults', 'No results found')}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('search.tryDifferent', 'Try different keywords or browse categories below')}
                    </Typography>
                  </Box>
                ) : null}
              </Box>
            ) : (
              // Default Content
              <Box sx={{ p: 3 }}>
                {/* Quick Categories */}
                <Box mb={4}>
                  <Typography variant="h6" gutterBottom fontWeight={600} color="text.primary">
                    {t('search.browseCategories', 'Browse Categories')}
                  </Typography>
                  <Grid container spacing={2}>
                    {quickCategories.map((category) => (
                      <Grid item xs={6} sm={6} key={category.name}>
                        <Paper
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-2px)',
                            },
                          }}
                          onClick={() => {
                            router.push(category.path);
                            onClose();
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              backgroundColor: `${category.color}20`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mx: 'auto',
                              mb: 1,
                              color: category.color,
                            }}
                          >
                            {category.icon}
                          </Box>
                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                            {category.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {category.count.toLocaleString()} {t('search.items', 'items')}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <Box mb={4}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="h6" fontWeight={600} color="text.primary">
                        {t('search.recentSearches', 'Recent Searches')}
                      </Typography>
                      <IconButton size="small" onClick={clearRecentSearches}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {recentSearches.map((search, index) => (
                        <Chip
                          key={index}
                          icon={<HistoryIcon />}
                          label={search}
                          onClick={() => handleSearch(search)}
                          sx={{
                            mb: 1,
                            '&:hover': { backgroundColor: 'primary.light', color: 'white' },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Trending Searches */}
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600} color="text.primary">
                    <TrendingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {t('search.trendingSearches', 'Trending Searches')}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {trendingSearches.map((search, index) => (
                      <Chip
                        key={index}
                        icon={<TrendingIcon />}
                        label={search}
                        variant="outlined"
                        onClick={() => handleSearch(search)}
                        sx={{
                          mb: 1,
                          '&:hover': { 
                            backgroundColor: 'secondary.light', 
                            color: 'white',
                            borderColor: 'secondary.light',
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}