'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { styled } from '@mui/material/styles';
import {
  Box,
  Menu,
  List,
  alpha,
  AppBar,
  Button,
  Avatar,
  Drawer,
  Toolbar,
  Divider,
  MenuItem,
  ListItem,
  useTheme,
  InputBase,
  Typography,
  IconButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  ListItemButton,
} from '@mui/material';
import {
  AccountCircle,
  Add as AddIcon,
  Menu as MenuIcon,
  Gavel as AuctionIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon,
  Favorite as FavoriteIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ProductIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';

import { useAuth } from 'src/hooks/useAuth';

import { formatCurrency } from 'src/lib/utils';

import NotificationBell from 'src/components/notifications/NotificationBell';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
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
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '30ch',
    },
  },
}));

const navigationItems = [
  { label: 'Auctions', path: '/products', icon: AuctionIcon, public: true },
  { label: 'Categories', path: '/categories', icon: CategoryIcon, public: true },
];

const userMenuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
  { label: 'Profile', path: '/profile', icon: PersonIcon },
  { label: 'Wallet', path: '/wallet', icon: WalletIcon },
  { label: 'Watchlist', path: '/watchlist', icon: FavoriteIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];

const agentMenuItems = [
  { label: 'Create Auction', path: '/products/create', icon: AddIcon },
  { label: 'My Auctions', path: '/agent/products', icon: AuctionIcon },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, logout } = useAuth();
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setMobileDrawerOpen(false);
    handleUserMenuClose();
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const renderDesktopNavigation = () => (
    <>
      {/* Logo - Flexible but minimum width */}
      <Box sx={{ 
        minWidth: 160, 
        flex: '0 0 auto',
        display: 'flex', 
        alignItems: 'center' 
      }}>
        <Typography variant="h6" component="div">
          <Button 
            color="inherit" 
            onClick={() => navigateTo('/')}
            sx={{ 
              fontSize: '1.5rem', 
              fontWeight: 800,
              textTransform: 'none',
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              p: 0,
              minWidth: 'auto',
              color: isScrolled ? 'text.primary' : 'white',
              '&:hover': {
                backgroundColor: 'transparent',
              }
            }}
          >
            Sassy.
          </Button>
        </Typography>
      </Box>

      {/* Navigation Links - Centered with proper flex */}
      <Box sx={{ 
        display: { xs: 'none', md: 'flex' }, 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 4,
        flex: '1 1 auto',
        maxWidth: 600, // Prevent over-expansion
        mx: 'auto', // Center within available space
      }}>
        {navigationItems.map((item) => (
          <Button
            key={item.path}
            color="inherit"
            onClick={() => navigateTo(item.path)}
            sx={{
              fontWeight: 500,
              fontSize: '0.95rem',
              textTransform: 'none',
              color: isScrolled ? 'text.primary' : 'white',
              borderRadius: 0,
              px: 2,
              py: 1,
              position: 'relative',
              whiteSpace: 'nowrap', // Prevent text wrapping
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'primary.main',
                '&::after': {
                  width: '100%',
                  opacity: 1,
                }
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                width: '0%',
                height: 2,
                backgroundColor: 'primary.main',
                transform: 'translateX(-50%)',
                transition: 'all 0.3s ease-in-out',
                opacity: 0,
              }
            }}
          >
            {item.label}
          </Button>
        ))}
      </Box>

      {/* User Area - Flexible with minimum width */}
      <Box sx={{ 
        minWidth: 200, 
        flex: '0 0 auto',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end', 
        gap: 2 
      }}>
        {user ? (
          <>
            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              sx={{ p: 0 }}
            >
              <Avatar
                alt={user.firstName}
                src={user.isAnonymousDisplay ? user.anonymousDisplayName : undefined}
                sx={{ width: 32, height: 32 }}
              >
                {user.firstName?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </>
        ) : (
          <>
            <Button
              color="inherit"
              onClick={() => navigateTo('/auth/login')}
              sx={{
                fontWeight: 500,
                textTransform: 'none',
                color: isScrolled ? 'text.primary' : 'white',
                px: 2,
                py: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              onClick={() => navigateTo('/auth/register')}
              sx={{ 
                backgroundColor: 'error.main',
                color: 'error.contrastText',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                py: 1,
                '&:hover': {
                  backgroundColor: 'error.dark',
                },
              }}
            >
              Get Started
            </Button>
          </>
        )}
      </Box>
    </>
  );

  const renderMobileNavigation = () => (
    <>
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ mr: 2 }}
      >
        <MenuIcon />
      </IconButton>

      <Typography 
        variant="h6" 
        component="div" 
        sx={{ 
          flexGrow: 1,
          fontSize: '1.25rem', 
          fontWeight: 800,
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
        }}
      >
        Sassy.
      </Typography>

      {user && (
        <IconButton
          color="inherit"
          onClick={handleUserMenuOpen}
          sx={{ p: 0 }}
        >
          <Avatar
            alt={user.firstName}
            sx={{ width: 32, height: 32 }}
          >
            {user.firstName?.charAt(0) || 'U'}
          </Avatar>
        </IconButton>
      )}
    </>
  );

  const renderMobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={handleDrawerToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          🎯 AuctionPlatform
        </Typography>
        
        {/* Search in mobile */}
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
          <StyledInputBase
            placeholder="Search..."
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              bgcolor: 'grey.100',
              borderRadius: 1,
              px: 2,
              py: 1,
              color: 'text.primary',
            }}
          />
        </Box>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path}>
            <ListItemButton
              onClick={() => navigateTo(item.path)}
              selected={isActivePath(item.path)}
            >
              <ListItemIcon>
              <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {user && (
        <>
          <Divider />
          
          {/* User Balance */}
          {user.balanceReal !== undefined && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Balance: {formatCurrency(user.balanceReal)}
              </Typography>
            </Box>
          )}

          {/* User Menu Items */}
          <List>
            {userMenuItems.map((item) => (
              <ListItem key={item.path}>
                <ListItemButton
                  onClick={() => navigateTo(item.path)}
                  selected={isActivePath(item.path)}
                >
                  <ListItemIcon>
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {/* Agent Items */}
          {user.userType === 'AGENT' && (
            <>
              <Divider />
              <List>
                {agentMenuItems.map((item) => (
                  <ListItem key={item.path}>
                    <ListItemButton
                      onClick={() => navigateTo(item.path)}
                      selected={isActivePath(item.path)}
                    >
                      <ListItemIcon>
                        <item.icon />
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}

          <Divider />
          
          <ListItem>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </>
      )}

      {!user && (
        <>
          <Divider />
          <List>
            <ListItem>
              <ListItemButton onClick={() => navigateTo('/auth/login')}>
                <ListItemIcon>
                  <AccountCircle />
                </ListItemIcon>
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton onClick={() => navigateTo('/auth/register')}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Sign Up" />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Drawer>
  );

  const renderUserMenu = () => (
    <Menu
      anchorEl={userMenuAnchor}
      open={Boolean(userMenuAnchor)}
      onClose={handleUserMenuClose}
      onClick={handleUserMenuClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* User Info */}
      <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" fontWeight="medium">
          {user?.isAnonymousDisplay 
            ? user.anonymousDisplayName 
            : `${user?.firstName} ${user?.lastName}`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.email}
        </Typography>
        <Typography variant="caption" display="block" color="primary.main">
          {user?.userType}
        </Typography>
      </Box>

      {/* User Menu Items */}
      {userMenuItems.map((item) => (
        <MenuItem key={item.path} onClick={() => navigateTo(item.path)}>
          <ListItemIcon>
            <item.icon fontSize="small" />
          </ListItemIcon>
          {item.label}
        </MenuItem>
      ))}

      {/* Agent Menu Items */}
      {user?.userType === 'AGENT' && (
        <>
          <Divider />
          {agentMenuItems.map((item) => (
            <MenuItem key={item.path} onClick={() => navigateTo(item.path)}>
              <ListItemIcon>
                <item.icon fontSize="small" />
              </ListItemIcon>
              {item.label}
            </MenuItem>
          ))}
        </>
      )}

      <Divider />
      
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: isScrolled 
            ? (theme) => `${theme.palette.background.paper}CC`
            : 'transparent',
          borderBottom: isScrolled 
            ? (theme) => `1px solid ${theme.palette.divider}`
            : 'none',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          transition: 'all 0.3s ease-in-out',
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          {isMobile ? renderMobileNavigation() : renderDesktopNavigation()}
        </Toolbar>
      </AppBar>

      {isMobile && renderMobileDrawer()}
      {user && renderUserMenu()}
    </>
  );
}