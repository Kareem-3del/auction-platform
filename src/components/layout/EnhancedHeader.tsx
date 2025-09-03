'use client';

import type { Breakpoint } from '@mui/material/styles';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { alpha, useTheme } from '@mui/material/styles';

import { useAuth } from 'src/hooks/useAuth';

import { LanguagePopover } from 'src/layouts/components/language-popover';
import NotificationCenter from 'src/components/notifications/NotificationCenter';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';
import SearchDialog from 'src/components/search/SearchDialog';

import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const navigationItems = [
  { 
    label: 'Art & Collectibles', 
    path: '/categories/art-collectibles', 
    count: 11,
    icon: 'solar:palette-round-bold-duotone',
    description: 'Paintings, sculptures, and rare collectibles'
  },
  { 
    label: 'Electronics', 
    path: '/categories/electronics', 
    count: 4,
    icon: 'solar:smartphone-bold-duotone',
    description: 'Latest gadgets and electronics'
  },
  { 
    label: 'Vehicles', 
    path: '/categories/vehicles', 
    count: 2,
    icon: 'solar:car-bold-duotone',
    description: 'Cars, motorcycles, and boats'
  },
  { 
    label: 'Watches & Jewelry', 
    path: '/categories/watches-jewelry', 
    count: 4,
    icon: 'solar:crown-bold-duotone',
    description: 'Luxury timepieces and fine jewelry'
  },
];

const utilityLinks = [
  { label: 'About EA', path: '/about', icon: 'solar:info-circle-bold-duotone' },
  { label: 'Contact', path: '/contact', icon: 'solar:phone-bold-duotone' },
  { label: 'Help', path: '/help', icon: 'solar:question-circle-bold-duotone' },
];

const quickActions = [
  { label: 'Watchlist', path: '/watchlist', icon: 'solar:heart-bold-duotone', color: '#FF4081' },
  { label: 'Cart', path: '/cart', icon: 'solar:cart-large-2-bold-duotone', color: '#2196F3', badge: 0 },
  { label: 'Wallet', path: '/wallet', icon: 'solar:wallet-2-bold-duotone', color: '#4CAF50' },
];

interface HeaderProps {
  isDashboard?: boolean;
  transparent?: boolean;
  layoutQuery?: Breakpoint;
  hideCategories?: boolean;
  compact?: boolean;
}

interface HideOnScrollProps {
  children: React.ReactElement;
}

function HideOnScroll({ children }: HideOnScrollProps) {
  const trigger = useScrollTrigger({
    threshold: 100,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function EnhancedHeader({ 
  isDashboard = false, 
  transparent = false, 
  layoutQuery = 'lg',
  hideCategories = false,
  compact = false
}: HeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout, loading } = useAuth();
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path: string) => {
    handleMenuClose();
    navigateTo(path);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const headerBackground = isScrolled || !transparent
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`
    : transparent
    ? 'transparent'
    : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)';

  const textColor = isScrolled && transparent ? theme.palette.text.primary : 'white';

  return (
    <>
      {/* Top Utility Bar */}
      {!compact && (
        <HideOnScroll>
          <Box
            sx={{
              background: 'linear-gradient(90deg, #CE0E2D 0%, #FF4444 100%)',
              color: 'white',
              py: 0.5,
              fontSize: '0.75rem',
              position: 'relative',
              zIndex: 1101,
            }}
          >
            <Container maxWidth="xl">
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                minHeight: 28
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption">+961 1 234 567</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption">info@lebanon-auction.com</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption">
                    🏆 Premium Auction House in Lebanon
                  </Typography>
                  {!user && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => navigateTo('/auth/register')}
                      sx={{
                        color: 'white',
                        fontSize: '0.7rem',
                        textTransform: 'none',
                        minWidth: 'auto',
                        p: 0.5,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      Join Now - Free!
                    </Button>
                  )}
                </Box>
              </Box>
            </Container>
          </Box>
        </HideOnScroll>
      )}

      {/* Main Header */}
      <AppBar 
        position="sticky" 
        elevation={isScrolled ? 1 : 0}
        sx={{
          background: headerBackground,
          backdropFilter: isScrolled ? 'blur(20px)' : transparent ? 'blur(10px)' : 'none',
          borderBottom: isScrolled 
            ? `1px solid ${alpha(theme.palette.divider, 0.1)}` 
            : transparent 
            ? 'none'
            : '1px solid rgba(255, 255, 255, 0.08)',
          minHeight: { xs: 64, md: 72 },
          zIndex: 1100,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isScrolled 
            ? '0 8px 32px rgba(0, 0, 0, 0.12)'
            : 'none',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 1.5, md: 3 } }}>
          <Toolbar 
            disableGutters 
            sx={{ 
              minHeight: { xs: 64, md: 72 },
              gap: { xs: 1.5, md: 3 },
              py: 1,
            }}
          >
            {/* Logo */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
            onClick={() => navigateTo('/')}
            >
              <Logo
                sx={{ 
                  width: { xs: 130, md: 150 },
                  height: { xs: 38, md: 44 },
                  filter: isScrolled && transparent ? 'none' : 'brightness(0) invert(1)',
                }}
                isSingle={false}
              />
              <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: textColor,
                    opacity: 0.8,
                    fontSize: '0.7rem',
                    fontWeight: 300,
                    display: 'block',
                    lineHeight: 1
                  }}
                >
                  Lebanon
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#CE0E2D',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    display: 'block',
                    lineHeight: 1
                  }}
                >
                  AUCTION
                </Typography>
              </Box>
            </Box>

            {/* Navigation - Desktop */}
            {!hideCategories && (
              <Box sx={{ 
                display: { xs: 'none', lg: 'flex' },
                flex: 1,
                justifyContent: 'center',
                gap: 0.5,
                mx: 4,
              }}>
                {navigationItems.map((item) => (
                  <Box
                    key={item.path}
                    sx={{ position: 'relative' }}
                    onMouseEnter={() => setHoveredCategory(item.path)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <Button
                      onClick={() => navigateTo(item.path)}
                      sx={{
                        color: alpha(textColor, 0.9),
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        px: 2,
                        py: 1.5,
                        borderRadius: 3,
                        minWidth: 'auto',
                        position: 'relative',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          backgroundColor: alpha('#CE0E2D', 0.1),
                          color: '#CE0E2D',
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 25px ${alpha('#CE0E2D', 0.15)}`,
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 6,
                          left: '50%',
                          width: 0,
                          height: '3px',
                          backgroundColor: '#CE0E2D',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: 'translateX(-50%)',
                          borderRadius: '2px',
                        },
                        '&:hover::after': {
                          width: '70%',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Iconify 
                          icon={item.icon} 
                          sx={{ 
                            fontSize: 18,
                            transition: 'transform 0.2s ease',
                          }} 
                        />
                        <Typography component="span" sx={{ fontSize: 'inherit' }}>
                          {item.label}
                        </Typography>
                        <Chip
                          label={item.count}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: alpha('#CE0E2D', 0.15),
                            color: '#CE0E2D',
                            minWidth: 24,
                            '& .MuiChip-label': {
                              px: 0.75
                            }
                          }}
                        />
                      </Box>
                    </Button>

                    {/* Category Tooltip */}
                    {hoveredCategory === item.path && (
                      <Paper
                        sx={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          mt: 1,
                          p: 2,
                          minWidth: 200,
                          zIndex: 1200,
                          borderRadius: 3,
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Right Actions */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: { xs: 1, md: 1.5 },
            }}>
              {/* Quick Actions - Desktop */}
              {user && (
                <Box sx={{ 
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  gap: 0.5,
                  mr: 1,
                }}>
                  {quickActions.map((action) => (
                    <IconButton
                      key={action.path}
                      onClick={() => navigateTo(action.path)}
                      sx={{
                        color: alpha(textColor, 0.7),
                        p: 1,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(action.color, 0.1),
                          color: action.color,
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      {action.badge !== undefined ? (
                        <Badge badgeContent={action.badge} color="error">
                          <Iconify icon={action.icon} sx={{ fontSize: 20 }} />
                        </Badge>
                      ) : (
                        <Iconify icon={action.icon} sx={{ fontSize: 20 }} />
                      )}
                    </IconButton>
                  ))}
                </Box>
              )}

              {/* Language & Utility - Desktop */}
              <Box sx={{ 
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center',
                gap: 1,
                mr: 1,
              }}>
                <LanguagePopover
                  data={[
                    { value: 'en', label: 'English', countryCode: 'GB' },
                    { value: 'ar', label: 'العربية', countryCode: 'SA' },
                  ]}
                />
                <Box sx={{ width: 1, height: 16, bgcolor: alpha(textColor, 0.2), mx: 1 }} />
                {utilityLinks.map((link) => (
                  <IconButton
                    key={link.path}
                    onClick={() => navigateTo(link.path)}
                    size="small"
                    sx={{
                      color: alpha(textColor, 0.6),
                      p: 0.75,
                      '&:hover': {
                        color: '#CE0E2D',
                        backgroundColor: alpha('#CE0E2D', 0.1),
                      },
                    }}
                  >
                    <Iconify icon={link.icon} sx={{ fontSize: 16 }} />
                  </IconButton>
                ))}
              </Box>

              {/* Search */}
              <IconButton 
                onClick={() => setSearchDialogOpen(true)}
                sx={{ 
                  color: alpha(textColor, 0.8),
                  p: 1.25,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha('#CE0E2D', 0.1),
                    color: '#CE0E2D',
                    borderColor: alpha('#CE0E2D', 0.3),
                    transform: 'scale(1.05)',
                    boxShadow: `0 4px 12px ${alpha('#CE0E2D', 0.2)}`,
                  },
                }}
              >
                <SearchIcon sx={{ fontSize: 20 }} />
              </IconButton>

              {/* Auth Section */}
              {loading ? (
                <Box sx={{ 
                  width: 200, 
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
              ) : user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <NotificationCenter />
                  
                  {/* User Balance Display */}
                  <Box sx={{ 
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha('#CE0E2D', 0.1)}, ${alpha('#FF4444', 0.1)})`,
                    border: `1px solid ${alpha('#CE0E2D', 0.2)}`,
                  }}>
                    <AccountBalanceWalletIcon sx={{ fontSize: 16, color: '#CE0E2D' }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#CE0E2D',
                        fontSize: '0.875rem',
                      }}
                    >
                      ${user?.balanceReal?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>

                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{
                      p: 0.5,
                      borderRadius: 3,
                      border: `2px solid ${alpha('#CE0E2D', 0.2)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#CE0E2D',
                        transform: 'scale(1.05)',
                        boxShadow: `0 4px 12px ${alpha('#CE0E2D', 0.2)}`,
                      },
                    }}
                  >
                    <Avatar
                      src={user?.photoURL}
                      alt={user?.displayName || user?.firstName || 'User'}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: '#CE0E2D',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      {(user?.displayName || user?.firstName || user?.email)?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    onClick={handleMenuClose}
                    sx={{
                      '& .MuiPaper-root': {
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        minWidth: 280,
                        mt: 1.5,
                        borderRadius: 4,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
                        backdropFilter: 'blur(20px)',
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar
                          src={user?.photoURL}
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: '#CE0E2D',
                          }}
                        >
                          {(user?.displayName || user?.firstName || user?.email)?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {user?.displayName || `${user?.firstName} ${user?.lastName}` || 'User'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                            {user?.email}
                          </Typography>
                          <Chip
                            label={user?.userType}
                            size="small"
                            sx={{
                              mt: 0.5,
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha('#CE0E2D', 0.1),
                              color: '#CE0E2D'
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1,
                        p: 2, 
                        bgcolor: alpha('#CE0E2D', 0.05), 
                        borderRadius: 2,
                        border: `1px solid ${alpha('#CE0E2D', 0.1)}`
                      }}>
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Real Balance
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#CE0E2D', fontWeight: 700, fontSize: '1.1rem' }}>
                            ${user?.balanceReal?.toFixed(2) || '0.00'}
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Virtual Balance
                          </Typography>
                          <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 700, fontSize: '1.1rem' }}>
                            ${user?.balanceVirtual?.toFixed(2) || '0.00'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <MenuItem onClick={() => handleMenuItemClick('/profile')}>
                      <ListItemIcon>
                        <Iconify icon="solar:user-bold-duotone" sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                      </ListItemIcon>
                      My Profile
                    </MenuItem>

                    <MenuItem onClick={() => handleMenuItemClick('/profile')}>
                      <ListItemIcon>
                        <Iconify icon="solar:auction-bold-duotone" sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                      </ListItemIcon>
                      My Bids
                    </MenuItem>
                    
                    <MenuItem onClick={() => handleMenuItemClick('/profile')}>
                      <ListItemIcon>
                        <Iconify icon="solar:settings-bold-duotone" sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                      </ListItemIcon>
                      Settings
                    </MenuItem>

                    <MenuItem onClick={() => handleMenuItemClick('/profile?tab=charge')}>
                      <ListItemIcon>
                        <Iconify icon="solar:wallet-money-bold-duotone" sx={{ color: '#22C55E' }} />
                      </ListItemIcon>
                      <Typography sx={{ color: '#22C55E' }}>Charge Account</Typography>
                    </MenuItem>

                    {(user?.userType === 'AGENT' || user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN') && (
                      <>
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                        <MenuItem onClick={() => handleMenuItemClick('/dashboard')}>
                          <ListItemIcon>
                            <Iconify icon="solar:widget-4-bold-duotone" sx={{ color: '#1976D2' }} />
                          </ListItemIcon>
                          <Typography sx={{ color: '#1976D2' }}>Dashboard</Typography>
                        </MenuItem>
                      </>
                    )}

                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                    
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <Iconify icon="solar:logout-2-bold-duotone" sx={{ color: '#CE0E2D' }} />
                      </ListItemIcon>
                      <Typography sx={{ color: '#CE0E2D' }}>Sign Out</Typography>
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Button
                    variant="text"
                    onClick={() => navigateTo('/auth/register')}
                    sx={{
                      display: { xs: 'none', sm: 'flex' },
                      color: alpha(textColor, 0.9),
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      px: 2.5,
                      py: 1.25,
                      borderRadius: 3,
                      minWidth: 'auto',
                      border: `1px solid ${alpha(textColor, 0.2)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(textColor, 0.1),
                        borderColor: '#CE0E2D',
                        color: '#CE0E2D',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Create Account
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={() => navigateTo('/auth/login')}
                    sx={{
                      background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      px: { xs: 2.5, sm: 3.5 },
                      py: 1.25,
                      borderRadius: 3,
                      minWidth: 'auto',
                      boxShadow: `0 8px 24px ${alpha('#CE0E2D', 0.3)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #b00c26, #e63939)',
                        transform: 'translateY(-2px) scale(1.02)',
                        boxShadow: `0 12px 32px ${alpha('#CE0E2D', 0.4)}`,
                      },
                    }}
                  >
                    Login
                  </Button>
                </Box>
              )}

              {/* Mobile Menu */}
              <IconButton
                onClick={handleDrawerToggle}
                sx={{ 
                  display: { xs: 'flex', lg: 'none' },
                  color: alpha(textColor, 0.8),
                  p: 1.25,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha('#CE0E2D', 0.1),
                    borderColor: alpha('#CE0E2D', 0.3),
                    color: '#CE0E2D',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                {mobileDrawerOpen ? (
                  <CloseIcon sx={{ fontSize: 22 }} />
                ) : (
                  <MenuIcon sx={{ fontSize: 22 }} />
                )}
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: 320,
            background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
            backdropFilter: 'blur(20px)',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          },
        }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Logo sx={{ width: 120, height: 35 }} isSingle={false} />
            <Box sx={{ ml: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1, color: 'text.secondary' }}>
                Lebanon
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1, color: '#CE0E2D', fontWeight: 600 }}>
                AUCTION
              </Typography>
            </Box>
          </Box>
          
          {user && (
            <Box sx={{ 
              p: 2,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha('#CE0E2D', 0.05)}, ${alpha('#FF4444', 0.05)})`,
              border: `1px solid ${alpha('#CE0E2D', 0.1)}`,
              mb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Avatar
                  src={user?.photoURL}
                  sx={{ width: 40, height: 40, bgcolor: '#CE0E2D' }}
                >
                  {(user?.displayName || user?.firstName || user?.email)?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {user?.displayName || `${user?.firstName} ${user?.lastName}` || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Balance</Typography>
                  <Typography variant="h6" color="#CE0E2D" sx={{ fontWeight: 700 }}>
                    ${user?.balanceReal?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    navigateTo('/profile?tab=charge');
                    setMobileDrawerOpen(false);
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
                    fontSize: '0.75rem',
                    px: 2
                  }}
                >
                  Charge
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* Categories */}
        <List>
          <ListItem>
            <ListItemButton
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              sx={{
                borderRadius: 2,
                mx: 1,
                '&:hover': {
                  bgcolor: alpha('#CE0E2D', 0.1)
                }
              }}
            >
              <ListItemIcon>
                <Iconify icon="solar:widget-4-bold-duotone" sx={{ color: '#CE0E2D' }} />
              </ListItemIcon>
              <ListItemText primary="Categories" />
              {categoriesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          
          <Collapse in={categoriesExpanded} timeout="auto" unmountOnExit>
            {navigationItems.map((item) => (
              <ListItem key={item.path} sx={{ pl: 4 }}>
                <ListItemButton
                  onClick={() => {
                    navigateTo(item.path);
                    setMobileDrawerOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.5)
                    }
                  }}
                >
                  <ListItemIcon>
                    <Iconify icon={item.icon} sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography>{item.label}</Typography>
                        <Chip
                          label={item.count}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: alpha('#CE0E2D', 0.1),
                            color: '#CE0E2D'
                          }}
                        />
                      </Box>
                    }
                    secondary={item.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </Collapse>
        </List>

        <Divider sx={{ mx: 2 }} />

        {/* Utility Links */}
        <List>
          {utilityLinks.map((link) => (
            <ListItem key={link.path}>
              <ListItemButton
                onClick={() => {
                  navigateTo(link.path);
                  setMobileDrawerOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&:hover': {
                    bgcolor: alpha('#CE0E2D', 0.1)
                  }
                }}
              >
                <ListItemIcon>
                  <Iconify icon={link.icon} sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {!user && (
          <>
            <Divider sx={{ mx: 2 }} />
            <Box sx={{ p: 2, mt: 'auto' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  navigateTo('/auth/login');
                  setMobileDrawerOpen(false);
                }}
                sx={{
                  background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
                  mb: 1,
                  py: 1.5,
                  borderRadius: 3,
                }}
              >
                Login
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  navigateTo('/auth/register');
                  setMobileDrawerOpen(false);
                }}
                sx={{
                  borderColor: '#CE0E2D',
                  color: '#CE0E2D',
                  py: 1.5,
                  borderRadius: 3,
                  '&:hover': {
                    borderColor: '#CE0E2D',
                    bgcolor: alpha('#CE0E2D', 0.1)
                  }
                }}
              >
                Create Account
              </Button>
            </Box>
          </>
        )}
      </Drawer>

      {/* Search Dialog */}
      <SearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
      />
    </>
  );
}