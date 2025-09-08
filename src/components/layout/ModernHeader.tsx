'use client';

import { useState, useEffect } from 'react';
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
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  InputBase,
  Chip,
  Fade,
  Backdrop,
  useScrollTrigger,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme, styled } from '@mui/material/styles';

import {
  Search as SearchIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  Gavel as AuctionIcon,
  Category as CategoryIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Wallet as WalletIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
} from '@mui/icons-material';

import { useAuth } from 'src/hooks/useAuth';
import { useLocale } from 'src/hooks/useLocale';
import { Logo } from 'src/components/logo';
import { formatCurrency } from 'src/lib/utils';
import LanguageSwitcher from '../language-switcher/LanguageSwitcher';

// Styled components for modern design
const StyledAppBar = styled(AppBar)(({ theme, scrolled }: { theme: any; scrolled: boolean }) => ({
  background: scrolled 
    ? 'rgba(255, 255, 255, 0.9)' 
    : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  backdropFilter: scrolled ? 'blur(20px)' : 'none',
  borderBottom: scrolled ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
  boxShadow: scrolled 
    ? '0 8px 32px rgba(0, 0, 0, 0.08)' 
    : '0 4px 20px rgba(25, 118, 210, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: scrolled 
      ? 'none' 
      : 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.1,
    pointerEvents: 'none',
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: 50,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
    border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
  },
  '&:focus-within': {
    backgroundColor: alpha(theme.palette.common.white, 0.9),
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
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
  [theme.breakpoints.down('md')]: {
    minWidth: 200,
  },
  [theme.breakpoints.down('sm')]: {
    minWidth: 150,
  },
}));

const SearchInput = styled(InputBase)(({ theme }) => ({
  color: 'white',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.25, 1, 1.25, 0),
    paddingLeft: `calc(1em + ${theme.spacing(5)})`,
    paddingRight: theme.spacing(2),
    transition: theme.transitions.create(['width', 'color']),
    fontSize: '0.9rem',
    '&::placeholder': {
      opacity: 0.7,
    },
  },
}));

const NavButton = styled(Button)(({ theme, active }: { theme: any; active: boolean }) => ({
  color: active ? theme.palette.primary.main : 'white',
  backgroundColor: active ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
  fontWeight: active ? 600 : 500,
  borderRadius: 25,
  padding: '8px 20px',
  margin: '0 4px',
  textTransform: 'none',
  fontSize: '0.9rem',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: active 
      ? 'rgba(255, 255, 255, 1)' 
      : 'rgba(255, 255, 255, 0.15)',
    transform: 'translateY(-1px)',
  },
}));

const UserChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  '& .MuiChip-avatar': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: theme.palette.primary.main,
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  transition: 'all 0.2s ease-in-out',
}));

const ModernDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 300,
    background: 'linear-gradient(180deg, #1976d2 0%, #1565c0 100%)',
    color: 'white',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
}));

const navigation = [
  { name: 'navigation.auctions', href: '/products', icon: AuctionIcon },
  { name: 'navigation.categories', href: '/categories', icon: CategoryIcon },
];

const userMenuItems = [
  { name: 'navigation.dashboard', href: '/dashboard', icon: DashboardIcon },
  { name: 'profile.profile', href: '/profile', icon: PersonIcon },
  { name: 'wallet.balance', href: '/wallet', icon: WalletIcon },
  { name: 'dashboard.watchlist', href: '/watchlist', icon: FavoriteIcon },
  { name: 'navigation.settings', href: '/settings', icon: SettingsIcon },
];

const agentMenuItems = [
  { name: 'navigation.createAuction', href: '/products/create', icon: AddIcon },
  { name: 'navigation.bids', href: '/agent/products', icon: AuctionIcon },
];

interface ModernHeaderProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export default function ModernHeader({ maxWidth = 'xl' }: ModernHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, isAuthenticated, logout } = useAuth();
  const { t, isRTL } = useLocale();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
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

  const handleLogout = async () => {
    try {
      await logout();
      handleUserMenuClose();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  };

  const isActivePath = (href: string) => {
    if (href === '/products') return pathname.startsWith('/products') || pathname.startsWith('/auctions');
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderDesktopNav = () => (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
      {navigation.map((item) => (
        <NavButton
          key={item.name}
          active={isActivePath(item.href)}
          onClick={() => handleNavigation(item.href)}
          startIcon={<item.icon sx={{ fontSize: '1.1rem' }} />}
        >
          {t(item.name)}
        </NavButton>
      ))}
    </Box>
  );

  const renderUserSection = () => {
    if (!isAuthenticated) {
      return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => handleNavigation('/auth/login')}
            startIcon={<LoginIcon />}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.5)',
              minWidth: '120px !important',
              width: '120px !important',
              height: '40px !important',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              padding: '8px 16px',
              lineHeight: 1.2,
              '& .MuiButton-startIcon': {
                marginRight: '6px',
              },
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {t('auth.login')}
          </Button>
          <Button
            variant="contained"
            onClick={() => handleNavigation('/auth/register')}
            startIcon={<RegisterIcon />}
            sx={{
              backgroundColor: 'white',
              color: theme.palette.primary.main,
              minWidth: '120px !important',
              width: '120px !important',
              height: '40px !important',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              padding: '8px 16px',
              lineHeight: 1.2,
              '& .MuiButton-startIcon': {
                marginRight: '6px',
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            {t('auth.createAccount')}
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Notifications */}
        <IconButton
          color="inherit"
          sx={{
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
          }}
        >
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* Watchlist */}
        <IconButton
          color="inherit"
          onClick={() => handleNavigation('/watchlist')}
          sx={{
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
          }}
        >
          <Badge badgeContent={2} color="secondary">
            <FavoriteIcon />
          </Badge>
        </IconButton>

        {/* Balance Display */}
        {user?.balance !== undefined && (
          <Chip
            label={formatCurrency(user.balance)}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        )}

        {/* User Menu */}
        <UserChip
          avatar={
            <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 28, height: 28 }}>
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          }
          label={user?.firstName || 'User'}
          onClick={handleUserMenuOpen}
          clickable
        />

        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          PaperProps={{
            elevation: 8,
            sx: {
              mt: 1.5,
              minWidth: 200,
              borderRadius: 2,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User Info Header */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
            {user?.userType === 'AGENT' && (
              <Chip label="Agent" size="small" color="primary" sx={{ mt: 0.5 }} />
            )}
          </Box>

          {/* Navigation Items */}
          {userMenuItems.map((item) => (
            <MenuItem key={item.name} onClick={() => handleNavigation(item.href)}>
              <ListItemIcon>
                <item.icon fontSize="small" />
              </ListItemIcon>
              {t(item.name)}
            </MenuItem>
          ))}

          {/* Agent Items */}
          {user?.userType === 'AGENT' && (
            <>
              <Divider />
              {agentMenuItems.map((item) => (
                <MenuItem key={item.name} onClick={() => handleNavigation(item.href)}>
                  <ListItemIcon>
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  {t(item.name)}
                </MenuItem>
              ))}
            </>
          )}

          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            {t('auth.logout')}
          </MenuItem>
        </Menu>
      </Box>
    );
  };

  const renderMobileDrawer = () => (
    <ModernDrawer
      variant="temporary"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Logo sx={{ height: 32 }} />
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* User Section */}
        {isAuthenticated ? (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                {user?.firstName?.[0] || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" color="white">
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {user?.email}
                </Typography>
              </Box>
            </Box>
            {user?.balance !== undefined && (
              <Chip
                label={`Balance: ${formatCurrency(user.balance)}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.75rem',
                }}
              />
            )}
          </Box>
        ) : (
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleNavigation('/auth/login')}
              startIcon={<LoginIcon />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                height: '44px !important',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                padding: '10px 16px',
                lineHeight: 1.2,
                '& .MuiButton-startIcon': {
                  marginRight: '8px',
                },
              }}
            >
              {t('auth.login')}
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleNavigation('/auth/register')}
              startIcon={<RegisterIcon />}
              sx={{
                backgroundColor: 'white',
                color: theme.palette.primary.main,
                height: '44px !important',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                padding: '10px 16px',
                lineHeight: 1.2,
                '& .MuiButton-startIcon': {
                  marginRight: '8px',
                },
              }}
            >
              {t('auth.createAccount')}
            </Button>
          </Box>
        )}

        {/* Language Switcher */}
        <Box sx={{ mb: 2, px: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1, display: 'block' }}>
            {t('common.language')}
          </Typography>
          <LanguageSwitcher />
        </Box>

        <List>
          {/* Main Navigation */}
          {navigation.map((item) => (
            <ListItem key={item.name} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.href)}
                selected={isActivePath(item.href)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white' }}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText primary={t(item.name)} />
              </ListItemButton>
            </ListItem>
          ))}

          {/* User Menu Items */}
          {isAuthenticated && (
            <>
              <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
              {userMenuItems.map((item) => (
                <ListItem key={item.name} disablePadding>
                  <ListItemButton
                    onClick={() => handleNavigation(item.href)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemIcon sx={{ color: 'white' }}>
                      <item.icon />
                    </ListItemIcon>
                    <ListItemText primary={t(item.name)} />
                  </ListItemButton>
                </ListItem>
              ))}

              {/* Agent Items */}
              {user?.userType === 'AGENT' && (
                <>
                  <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                  {agentMenuItems.map((item) => (
                    <ListItem key={item.name} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigation(item.href)}
                        sx={{ borderRadius: 1, mb: 0.5 }}
                      >
                        <ListItemIcon sx={{ color: 'white' }}>
                          <item.icon />
                        </ListItemIcon>
                        <ListItemText primary={t(item.name)} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </>
              )}

              <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, color: '#ffcdd2' }}>
                  <ListItemIcon sx={{ color: '#ffcdd2' }}>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('auth.logout')} />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </ModernDrawer>
  );

  return (
    <>
      {/* Announcement Bar */}
      {showAnnouncement && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar + 1,
            background: 'linear-gradient(90deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            py: 0.5,
            px: 2,
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          <Container maxWidth={maxWidth}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                🔥 <strong>{t('auction.liveBiddingActive')}:</strong> {isRTL ? 'ساعات نادرة من مجموعة فينتج تنتهي خلال ساعتين!' : 'Rare vintage watch collection ending in 2 hours!'}
              </Typography>
              <Button
                size="small"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.75rem',
                  py: 0.25,
                  px: 1,
                  ml: isRTL ? 0 : 1,
                  mr: isRTL ? 1 : 0,
                }}
                variant="outlined"
                onClick={() => router.push('/categories/watches-jewelry')}
              >
                {t('common.view')} {t('navigation.auctions')}
              </Button>
              <IconButton
                size="small"
                onClick={() => setShowAnnouncement(false)}
                sx={{ color: 'white', ml: 'auto', p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Container>
        </Box>
      )}

      <StyledAppBar 
        position="fixed" 
        scrolled={scrollTrigger} 
        elevation={0}
        sx={{ top: showAnnouncement ? 40 : 0, transition: 'top 0.3s ease-in-out' }}
      >
        <Container maxWidth={maxWidth}>
          <Toolbar sx={{ px: { xs: 0, sm: 2 }, py: 1 }}>
            {/* Mobile Menu Button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { md: 'none' },
                color: scrollTrigger ? 'primary.main' : 'white',
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
              }}
              onClick={() => handleNavigation('/')}
            >
              <Logo sx={{ height: { xs: 32, md: 40 } }} />
            </Box>

            {/* Desktop Navigation */}
            {renderDesktopNav()}

            {/* Search */}
            <Box sx={{ flexGrow: 1, maxWidth: { md: 400 }, mx: { md: 3 } }}>
              <SearchContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                  }}
                >
                  <SearchIcon sx={{ fontSize: '1.25rem' }} />
                </Box>
                <form onSubmit={handleSearch}>
                  <SearchInput
                    placeholder={t('forms.placeholders.searchProducts')}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                  />
                </form>
                
                {/* Search Suggestions */}
                {searchFocused && searchValue.length > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      mt: 1,
                      backgroundColor: 'white',
                      borderRadius: 2,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                      border: '1px solid',
                      borderColor: 'divider',
                      zIndex: 1300,
                      maxHeight: 300,
                      overflow: 'auto',
                    }}
                  >
                    <List sx={{ py: 1 }}>
                      <ListItem
                        button
                        onClick={() => {
                          setSearchValue('vintage watches');
                          handleSearch({ preventDefault: () => {} } as any);
                        }}
                      >
                        <ListItemIcon>
                          <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="vintage watches"
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItem>
                      <ListItem
                        button
                        onClick={() => {
                          setSearchValue('luxury cars');
                          handleSearch({ preventDefault: () => {} } as any);
                        }}
                      >
                        <ListItemIcon>
                          <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="luxury cars"
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItem>
                      <ListItem
                        button
                        onClick={() => {
                          setSearchValue('art collectibles');
                          handleSearch({ preventDefault: () => {} } as any);
                        }}
                      >
                        <ListItemIcon>
                          <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="art collectibles"
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItem>
                    </List>
                  </Box>
                )}
              </SearchContainer>
            </Box>

            {/* Desktop User Section */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
              <LanguageSwitcher />
              {renderUserSection()}
            </Box>

            {/* Mobile User Section */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
              {isAuthenticated && (
                <>
                  <IconButton
                    color="inherit"
                    sx={{ color: scrollTrigger ? 'primary.main' : 'white' }}
                  >
                    <Badge badgeContent={3} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                  
                  <IconButton
                    color="inherit"
                    onClick={() => handleNavigation('/watchlist')}
                    sx={{ color: scrollTrigger ? 'primary.main' : 'white' }}
                  >
                    <Badge badgeContent={2} color="secondary">
                      <FavoriteIcon />
                    </Badge>
                  </IconButton>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>

      {/* Mobile Drawer */}
      {renderMobileDrawer()}

      {/* Toolbar Spacer */}
      <Toolbar />
      {showAnnouncement && <Box sx={{ height: 40 }} />}
    </>
  );
}