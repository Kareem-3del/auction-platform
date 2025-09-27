'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  Fade,
  Slide,
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
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Favorite as FavoriteIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Gavel as AuctionIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

import { useAuth } from 'src/hooks/useAuth';
import { useLocale } from 'src/hooks/useLocale';
import { Logo } from 'src/components/logo';

interface SpotifyNavbarProps {
  transparent?: boolean;
}

function HideOnScroll({ children }: { children: React.ReactElement }) {
  const trigger = useScrollTrigger({
    threshold: 100,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const navigation = [
  { name: 'Auctions', href: '/auctions', icon: AuctionIcon },
  { name: 'Categories', href: '/categories', icon: CategoryIcon },
];

export function SpotifyNavbar({ transparent = false }: SpotifyNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLocale();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [showNav, setShowNav] = useState(!transparent);
  
  const scrollTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: transparent ? 80 : 0,
  });

  useEffect(() => {
    if (transparent) {
      setShowNav(scrollTrigger);
    }
  }, [scrollTrigger, transparent]);

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
    if (href === '/auctions') return pathname.startsWith('/auctions') || pathname.startsWith('/products');
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Don't show anything if it's transparent and user hasn't scrolled
  if (transparent && !showNav) {
    return null;
  }

  const navContent = (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: transparent && showNav 
          ? 'rgba(0, 0, 0, 0.9)'
          : 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: theme.zIndex.appBar,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ px: { xs: 0, sm: 2 }, py: 1, minHeight: '72px !important' }}>
          {/* Mobile Menu Button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: 'white',
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Box 
            sx={{ 
              flexGrow: 0, 
              mr: { xs: 1, md: 4 },
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
            onClick={() => handleNavigation('/')}
          >
            <Logo sx={{ height: { xs: 32, md: 36 } }} />
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  fontFamily: '"Inter", sans-serif',
                  letterSpacing: '-0.02em',
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
            gap: 1,
            flexGrow: 1,
            ml: 4,
          }}>
            {navigation.map((item) => (
              <Button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                startIcon={<item.icon sx={{ fontSize: '1.1rem' }} />}
                sx={{
                  color: isActivePath(item.href) ? '#1DB954' : 'rgba(255, 255, 255, 0.9)',
                  fontWeight: isActivePath(item.href) ? 700 : 500,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                  borderRadius: '50px',
                  fontFamily: '"Inter", sans-serif',
                  transition: 'all 0.2s ease',
                  background: isActivePath(item.href) ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                  '&:hover': {
                    color: '#1DB954',
                    backgroundColor: 'rgba(29, 185, 84, 0.1)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>

          {/* Search Button */}
          <IconButton
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              mx: 1,
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
            onClick={() => handleNavigation('/search')}
          >
            <SearchIcon />
          </IconButton>

          {/* User Section */}
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Favorites (Desktop only) */}
              <IconButton
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    color: '#ff4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                  },
                }}
                onClick={() => handleNavigation('/watchlist')}
              >
                <FavoriteIcon />
              </IconButton>

              {/* User Avatar */}
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{
                  p: 0.5,
                  ml: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: '#1DB954',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>

              {/* User Menu */}
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  elevation: 8,
                  sx: {
                    mt: 1.5,
                    minWidth: 220,
                    borderRadius: '12px',
                    background: 'rgba(40, 40, 40, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    '& .MuiMenuItem-root': {
                      borderRadius: '8px',
                      mx: 1,
                      my: 0.5,
                      fontFamily: '"Inter", sans-serif',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* User Info */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {user?.email}
                  </Typography>
                </Box>

                <MenuItem onClick={() => handleNavigation('/profile')}>
                  <ListItemIcon sx={{ color: 'white' }}>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>

                <MenuItem onClick={() => handleNavigation('/watchlist')}>
                  <ListItemIcon sx={{ color: 'white' }}>
                    <FavoriteIcon fontSize="small" />
                  </ListItemIcon>
                  Watchlist
                </MenuItem>

                {(user?.userType === 'AGENT' || user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN') && (
                  <MenuItem onClick={() => handleNavigation('/dashboard')}>
                    <ListItemIcon sx={{ color: '#1DB954' }}>
                      <DashboardIcon fontSize="small" />
                    </ListItemIcon>
                    Dashboard
                  </MenuItem>
                )}

                <MenuItem onClick={() => handleNavigation('/settings')}>
                  <ListItemIcon sx={{ color: 'white' }}>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

                <MenuItem onClick={handleLogout} sx={{ color: '#ff4444' }}>
                  <ListItemIcon sx={{ color: '#ff4444' }}>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Log out
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
              <Button
                variant="text"
                onClick={() => handleNavigation('/auth/login')}
                startIcon={<LoginIcon />}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: '50px',
                  fontFamily: '"Inter", sans-serif',
                  display: { xs: 'none', sm: 'flex' },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                  background: '#1DB954',
                  color: '#000000',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: { xs: 2, sm: 3 },
                  py: 1,
                  borderRadius: '50px',
                  fontFamily: '"Inter", sans-serif',
                  boxShadow: 'none',
                  '&:hover': {
                    background: '#1ed760',
                    boxShadow: 'none',
                    transform: 'scale(1.02)',
                  },
                }}
              >
                Sign up
              </Button>
            </Stack>
          )}
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            background: 'rgba(20, 20, 20, 0.98)',
            backdropFilter: 'blur(20px)',
            color: 'white',
            border: 'none',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Logo sx={{ height: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                Lebanon Auction
              </Typography>
            </Box>
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* User Info in Mobile */}
          {isAuthenticated && (
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#1DB954', width: 40, height: 40 }}>
                  {user?.firstName?.[0] || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
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
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(29, 185, 84, 0.2)',
                      '& .MuiListItemIcon-root': {
                        color: '#1DB954',
                      },
                      '& .MuiListItemText-primary': {
                        color: '#1DB954',
                        fontWeight: 700,
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'white' }}>
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name} 
                    primaryTypographyProps={{
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}

            {isAuthenticated && (
              <>
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton onClick={() => handleNavigation('/watchlist')} sx={{ borderRadius: 2 }}>
                    <ListItemIcon sx={{ color: 'white' }}>
                      <FavoriteIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Watchlist" 
                      primaryTypographyProps={{ fontFamily: '"Inter", sans-serif' }}
                    />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton onClick={() => handleNavigation('/profile')} sx={{ borderRadius: 2 }}>
                    <ListItemIcon sx={{ color: 'white' }}>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Profile" 
                      primaryTypographyProps={{ fontFamily: '"Inter", sans-serif' }}
                    />
                  </ListItemButton>
                </ListItem>

                {(user?.userType === 'AGENT' || user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN') && (
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton onClick={() => handleNavigation('/dashboard')} sx={{ borderRadius: 2 }}>
                      <ListItemIcon sx={{ color: '#1DB954' }}>
                        <DashboardIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Dashboard" 
                        primaryTypographyProps={{ 
                          fontFamily: '"Inter", sans-serif',
                          color: '#1DB954',
                          fontWeight: 600,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )}

                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <ListItem disablePadding>
                  <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
                    <ListItemIcon sx={{ color: '#ff4444' }}>
                      <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Log out" 
                      primaryTypographyProps={{ 
                        fontFamily: '"Inter", sans-serif',
                        color: '#ff4444',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleNavigation('/auth/login')}
                    startIcon={<LoginIcon />}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      py: 1.5,
                      borderRadius: '50px',
                      textTransform: 'none',
                      fontFamily: '"Inter", sans-serif',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
                      background: '#1DB954',
                      color: '#000000',
                      py: 1.5,
                      borderRadius: '50px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontFamily: '"Inter", sans-serif',
                      '&:hover': {
                        background: '#1ed760',
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
      </Drawer>
    </AppBar>
  );

  if (transparent) {
    return (
      <Fade in={showNav} timeout={300}>
        <Box>{navContent}</Box>
      </Fade>
    );
  }

  return navContent;
}