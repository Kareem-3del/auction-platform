'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { alpha, styled } from '@mui/material/styles';
import {
  AppBar,
  Box,
  Toolbar,
  Container,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Stack,
  useScrollTrigger,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Tooltip,
  InputBase,
  Fade,
  Slide,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Favorite as FavoriteIcon,
  Dashboard as DashboardIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Gavel as AuctionIcon,
  Category as CategoryIcon,
  LanguageIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';

import { useAuth } from 'src/hooks/useAuth';
import { useLocale } from 'src/hooks/useLocale';
import { Logo } from 'src/components/logo';
import LanguageSwitcher from '../language-switcher/LanguageSwitcher';

// Ultra-modern styled components
const UltraModernAppBar = styled(AppBar)(({ theme, scrolled }: { theme: any; scrolled: boolean }) => ({
  background: scrolled 
    ? 'rgba(255, 255, 255, 0.98)'
    : 'rgba(255, 255, 255, 1)',
  backdropFilter: scrolled ? 'blur(20px)' : 'none',
  borderBottom: scrolled ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: scrolled 
    ? '0 2px 40px rgba(0, 0, 0, 0.08)' 
    : '0 1px 3px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: theme.zIndex.appBar,
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: 12,
  backgroundColor: alpha(theme.palette.grey[100], 0.8),
  border: `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.grey[100], 1),
    border: `1px solid ${alpha(theme.palette.grey[300], 0.8)}`,
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  '&:focus-within': {
    backgroundColor: '#ffffff',
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}, 0 8px 30px rgba(0, 0, 0, 0.12)`,
    transform: 'translateY(-2px)',
    '& input': {
      color: theme.palette.text.primary,
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.primary.main,
    },
  },
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  width: 'auto',
  minWidth: 280,
  maxWidth: 400,
  [theme.breakpoints.down('md')]: {
    minWidth: 200,
    maxWidth: 280,
  },
  [theme.breakpoints.down('sm')]: {
    minWidth: 160,
    maxWidth: 200,
  },
}));

const SearchInput = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.secondary,
  width: '100%',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: '0.95rem',
  fontWeight: 500,
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 1, 1.5, 0),
    paddingLeft: `calc(1em + ${theme.spacing(5)})`,
    paddingRight: theme.spacing(2),
    transition: theme.transitions.create(['width', 'color']),
    '&::placeholder': {
      opacity: 0.7,
      fontWeight: 400,
    },
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
  zIndex: 1,
}));

const NavButton = styled(Button)(({ theme, active }: { theme: any; active: boolean }) => ({
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
  fontWeight: active ? 700 : 500,
  borderRadius: 12,
  padding: '10px 20px',
  margin: '0 4px',
  textTransform: 'none',
  fontSize: '0.95rem',
  fontFamily: '"Inter", sans-serif',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}08)`,
    opacity: active ? 1 : 0,
    transition: 'opacity 0.2s ease',
  },
  '&:hover': {
    backgroundColor: active 
      ? alpha(theme.palette.primary.main, 0.12)
      : alpha(theme.palette.primary.main, 0.04),
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    '&::before': {
      opacity: 1,
    },
  },
  '& .MuiButton-startIcon': {
    marginRight: 8,
    fontSize: '1.1rem',
  },
}));

const UserChip = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.grey[100], 0.8),
  color: theme.palette.text.primary,
  border: `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
  borderRadius: 20,
  height: 44,
  fontSize: '0.9rem',
  fontWeight: 600,
  fontFamily: '"Inter", sans-serif',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '& .MuiChip-avatar': {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    border: 'none',
    fontWeight: 700,
    fontSize: '0.85rem',
  },
  '& .MuiChip-label': {
    paddingLeft: 12,
    paddingRight: 16,
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.grey[100], 1),
    borderColor: alpha(theme.palette.grey[300], 0.8),
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  },
}));

const ModernDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 300,
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(20px)',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    border: 'none',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    color: theme.palette.text.primary,
  },
}));

const LiveBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 20,
  background: `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.success.main}08)`,
  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
  color: theme.palette.success.main,
  fontSize: '0.8rem',
  fontWeight: 700,
  fontFamily: '"Inter", sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  '&::before': {
    content: '""',
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: theme.palette.success.main,
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
      '50%': { opacity: 0.6, transform: 'scale(1.2)' },
    },
  },
}));

const navigation = [
  { name: 'navigation.auctions', href: '/products', icon: AuctionIcon },
  { name: 'navigation.categories', href: '/categories', icon: CategoryIcon },
];

export default function UltraModernHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, isAuthenticated, logout } = useAuth();
  const { t, currentLang, isRTL } = useLocale();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const scrollTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setMobileOpen(false);
    handleUserMenuClose();
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleUserMenuClose();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActivePath = (href: string) => {
    if (href === '/products') return pathname.startsWith('/products') || pathname.startsWith('/auctions');
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Live Auction Announcement Bar */}
      <Slide direction="down" in mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar + 1,
            background: 'linear-gradient(135deg, #CE0E2D 0%, #D32F2F 100%)',
            color: 'white',
            py: 1,
            px: 2,
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <LiveBadge>
                🔴 Live Auctions
              </LiveBadge>
              <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                🏆 <strong>Featured Collection:</strong> Premium Watches & Luxury Cars
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => router.push('/products')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  fontSize: '0.8rem',
                  py: 0.5,
                  px: 2,
                  borderRadius: 20,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                View Auctions
              </Button>
            </Box>
          </Container>
        </Box>
      </Slide>

      <UltraModernAppBar position="fixed" scrolled={scrollTrigger} sx={{ top: 48 }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 0, sm: 2 }, py: 1.5, minHeight: '80px !important' }}>
            {/* Mobile Menu Button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { md: 'none' },
                color: 'text.primary',
                p: 1.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo & Brand */}
            <Box 
              sx={{ 
                flexGrow: 0, 
                mr: { xs: 2, md: 4 },
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1,
                px: 1,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  transform: 'translateY(-1px)',
                },
              }}
              onClick={() => handleNavigation('/')}
            >
              <Logo sx={{ height: { xs: 36, md: 40 } }} />
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'text.primary',
                    fontWeight: 800,
                    fontSize: { xs: '1.1rem', md: '1.2rem' },
                    fontFamily: '"Inter", sans-serif',
                    letterSpacing: '-0.02em',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Lebanon Auction
                </Typography>
              </Box>
            </Box>

            {/* Desktop Navigation */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              flexGrow: 0,
              mr: 2,
            }}>
              {navigation.map((item) => (
                <NavButton
                  key={item.name}
                  active={isActivePath(item.href)}
                  onClick={() => handleNavigation(item.href)}
                  startIcon={<item.icon />}
                >
                  {t(item.name)}
                </NavButton>
              ))}
            </Box>

            {/* Search Bar */}
            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              justifyContent: 'center',
              maxWidth: 400,
              mx: 'auto',
            }}>
              <SearchContainer>
                <SearchIconWrapper>
                  <SearchIcon sx={{ fontSize: 20 }} />
                </SearchIconWrapper>
                <form onSubmit={handleSearch} style={{ width: '100%' }}>
                  <SearchInput
                    placeholder={t('homepage.hero.searchPlaceholder')}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    inputProps={{ 'aria-label': 'search' }}
                  />
                </form>
              </SearchContainer>
            </Box>

            {/* Right Actions */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              ml: 2,
            }}>
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Notifications */}
              {isAuthenticated && (
                <Tooltip title="Notifications">
                  <IconButton
                    sx={{
                      color: 'text.secondary',
                      borderRadius: 2,
                      p: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: 'primary.main',
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Badge badgeContent={3} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}

              {/* User Section */}
              {isAuthenticated ? (
                <UserChip
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                      {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  }
                  label={`${user?.firstName || 'User'}`}
                  onClick={handleUserMenuOpen}
                  deleteIcon={<ArrowDownIcon />}
                  onDelete={handleUserMenuOpen}
                  clickable
                />
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => handleNavigation('/auth/login')}
                    startIcon={<LoginIcon />}
                    sx={{
                      color: 'text.primary',
                      borderColor: alpha(theme.palette.grey[300], 0.6),
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 3,
                      py: 1.2,
                      borderRadius: 3,
                      fontFamily: '"Inter", sans-serif',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleNavigation('/auth/register')}
                    startIcon={<RegisterIcon />}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 3,
                      py: 1.2,
                      borderRadius: 3,
                      fontFamily: '"Inter", sans-serif',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
                      },
                    }}
                  >
                    Sign up
                  </Button>
                </Stack>
              )}

              {/* User Menu */}
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    mt: 1.5,
                    minWidth: 240,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                    '& .MuiMenuItem-root': {
                      borderRadius: 2,
                      mx: 1,
                      my: 0.5,
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 500,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* User Info */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Typography variant="subtitle2" fontWeight={700} fontFamily='"Inter", sans-serif'>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"Inter", sans-serif' }}>
                    {user?.email}
                  </Typography>
                </Box>

                <MenuItem onClick={() => handleNavigation('/profile')}>
                  <ListItemIcon sx={{ color: 'text.secondary' }}>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>

                <MenuItem onClick={() => handleNavigation('/watchlist')}>
                  <ListItemIcon sx={{ color: 'text.secondary' }}>
                    <FavoriteIcon fontSize="small" />
                  </ListItemIcon>
                  Watchlist
                </MenuItem>

                {(user?.userType === 'AGENT' || user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN') && (
                  <MenuItem onClick={() => handleNavigation('/dashboard')}>
                    <ListItemIcon sx={{ color: 'primary.main' }}>
                      <DashboardIcon fontSize="small" />
                    </ListItemIcon>
                    Dashboard
                  </MenuItem>
                )}

                <MenuItem onClick={() => handleNavigation('/settings')}>
                  <ListItemIcon sx={{ color: 'text.secondary' }}>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>

                <Divider sx={{ my: 1, borderColor: alpha(theme.palette.divider, 0.1) }} />

                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon sx={{ color: 'error.main' }}>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Log out
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>

        {/* Mobile Drawer */}
        <ModernDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' } }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Logo sx={{ height: 32 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: '"Inter", sans-serif' }}>
                  Lebanon Auction
                </Typography>
              </Box>
              <IconButton 
                onClick={handleDrawerToggle} 
                sx={{ 
                  color: 'text.secondary',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: alpha(theme.palette.grey[200], 0.6) },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* User Info in Mobile */}
            {isAuthenticated && (
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                bgcolor: alpha(theme.palette.primary.main, 0.04), 
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                    {user?.firstName?.[0] || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} fontFamily='"Inter", sans-serif'>
                      {user?.firstName} {user?.lastName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"Inter", sans-serif' }}>
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <List>
              {navigation.map((item) => (
                <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.href)}
                    selected={isActivePath(item.href)}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        '& .MuiListItemIcon-root': {
                          color: 'primary.main',
                        },
                        '& .MuiListItemText-primary': {
                          color: 'primary.main',
                          fontWeight: 700,
                        },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <item.icon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t(item.name)} 
                      primaryTypographyProps={{
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 600,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}

              {isAuthenticated && (
                <>
                  <Divider sx={{ my: 2, borderColor: alpha(theme.palette.divider, 0.1) }} />
                  
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton onClick={() => handleNavigation('/watchlist')} sx={{ borderRadius: 3, py: 1.5 }}>
                      <ListItemIcon>
                        <FavoriteIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Watchlist" 
                        primaryTypographyProps={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}
                      />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton onClick={() => handleNavigation('/profile')} sx={{ borderRadius: 3, py: 1.5 }}>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Profile" 
                        primaryTypographyProps={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}
                      />
                    </ListItemButton>
                  </ListItem>

                  {(user?.userType === 'AGENT' || user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN') && (
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton onClick={() => handleNavigation('/dashboard')} sx={{ borderRadius: 3, py: 1.5 }}>
                        <ListItemIcon sx={{ color: 'primary.main' }}>
                          <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Dashboard" 
                          primaryTypographyProps={{ 
                            fontFamily: '"Inter", sans-serif',
                            color: 'primary.main',
                            fontWeight: 700,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  )}

                  <Divider sx={{ my: 2, borderColor: alpha(theme.palette.divider, 0.1) }} />
                  
                  <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout} sx={{ borderRadius: 3, py: 1.5 }}>
                      <ListItemIcon sx={{ color: 'error.main' }}>
                        <LogoutIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Log out" 
                        primaryTypographyProps={{ 
                          fontFamily: '"Inter", sans-serif',
                          color: 'error.main',
                          fontWeight: 600,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </>
              )}

              {!isAuthenticated && (
                <>
                  <Divider sx={{ my: 2, borderColor: alpha(theme.palette.divider, 0.1) }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleNavigation('/auth/login')}
                      startIcon={<LoginIcon />}
                      sx={{
                        borderColor: alpha(theme.palette.grey[300], 0.6),
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      Log in
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleNavigation('/auth/register')}
                      startIcon={<RegisterIcon />}
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontFamily: '"Inter", sans-serif',
                        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        },
                      }}
                    >
                      Sign up
                    </Button>
                  </Box>
                </>
              )}
            </List>
          </Box>
        </ModernDrawer>
      </UltraModernAppBar>

      {/* Spacer for fixed header */}
      <Box sx={{ height: 128 }} />
    </>
  );
}