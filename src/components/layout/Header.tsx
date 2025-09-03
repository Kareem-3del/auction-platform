'use client';

import type { Breakpoint } from '@mui/material/styles';

import { useState } from 'react';
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

import { useAuth } from 'src/hooks/useAuth';

import { _notifications } from 'src/_mock';
import { LanguagePopover } from 'src/layouts/components/language-popover';
import NotificationCenter from 'src/components/notifications/NotificationCenter';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';
import SearchDialog from 'src/components/search/SearchDialog';

import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';

const navigationItems = [
  { label: 'Art & Collectibles', path: '/categories/art-collectibles', count: 9 },
  { label: 'Electronics', path: '/categories/electronics', count: 2 },
  { label: 'Vehicles', path: '/categories/vehicles', count: 1 },
  { label: 'Watches & Jewelry', path: '/categories/watches-jewelry', count: 2 },
];

const utilityLinks = [
  { label: 'About EA', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Help', path: '/help' },
];

interface HeaderProps {
  isDashboard?: boolean;
  transparent?: boolean;
  layoutQuery?: Breakpoint;
}

export default function Header({ 
  isDashboard = false, 
  transparent = false, 
  layoutQuery = 'lg' 
}: HeaderProps) {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

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

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        minHeight: { xs: 70, md: 80 },
        zIndex: 109,
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
        <Toolbar 
          disableGutters 
          sx={{ 
            minHeight: { xs: 70, md: 80 },
            gap: { xs: 2, md: 4 },
          }}
        >
          {/* Logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => navigateTo('/')}
          >
            <Logo
              sx={{ 
                width: { xs: 120, md: 140 },
                height: { xs: 35, md: 40 },
              }}
              isSingle={false}
            />
          </Box>

          {/* Navigation - Desktop */}
          <Box sx={{ 
            display: { xs: 'none', lg: 'flex' },
            flex: 1,
            justifyContent: 'center',
            gap: 1,
          }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  minWidth: 'auto',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(206, 14, 45, 0.1)',
                    color: '#CE0E2D',
                    transform: 'translateY(-1px)',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    width: 0,
                    height: '2px',
                    backgroundColor: '#CE0E2D',
                    transition: 'all 0.3s ease',
                    transform: 'translateX(-50%)',
                  },
                  '&:hover::after': {
                    width: '80%',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography component="span" sx={{ fontSize: 'inherit' }}>
                    {item.label}
                  </Typography>
                  <Typography 
                    component="span" 
                    sx={{ 
                      fontSize: '0.75rem',
                      opacity: 0.7,
                      backgroundColor: 'rgba(206, 14, 45, 0.2)',
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 1,
                      minWidth: '18px',
                      textAlign: 'center',
                    }}
                  >
                    {item.count}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>

          {/* Right Actions */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: { xs: 1, md: 2 },
          }}>
            {/* Utility Links - Desktop */}
            <Box sx={{ 
              display: { xs: 'none', xl: 'flex' },
              alignItems: 'center',
              gap: 1,
              mr: 2,
            }}>
              {utilityLinks.map((link) => (
                <Button
                  key={link.path}
                  onClick={() => navigateTo(link.path)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.8rem',
                    fontWeight: 400,
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.5,
                    minWidth: 'auto',
                    borderRadius: 1,
                    '&:hover': {
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}
              <Box sx={{ width: 1, height: 16, bgcolor: 'rgba(255, 255, 255, 0.2)', mx: 1 }} />
              <LanguagePopover
                data={[
                  { value: 'en', label: 'English', countryCode: 'GB' },
                  { value: 'ar', label: 'العربية', countryCode: 'SA' },
                ]}
              />
            </Box>

            {/* Search */}
            <IconButton 
              onClick={() => setSearchDialogOpen(true)}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                p: 1,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                },
              }}
            >
              <SearchIcon sx={{ fontSize: 20 }} />
            </IconButton>

            {/* Auth Section */}
            {loading ? (
              <Box sx={{ width: 200, height: 40 }} />
            ) : user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationCenter />
                
                <IconButton
                  onClick={handleMenuOpen}
                  sx={{
                    p: 0.5,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <Avatar
                    src={user?.photoURL}
                    alt={user?.displayName || user?.firstName || 'User'}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: '#CE0E2D',
                      fontSize: '0.875rem',
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
                      backgroundColor: '#1a1a1a',
                      color: 'white',
                      minWidth: 220,
                      mt: 1,
                      borderRadius: 3,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                      {user?.displayName || `${user?.firstName} ${user?.lastName}` || 'User'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {user?.email}
                    </Typography>
                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'rgba(206, 14, 45, 0.1)', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                        Balance
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#CE0E2D', fontWeight: 600 }}>
                        ${user?.balanceReal?.toFixed(2) || '0.00'}
                      </Typography>
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
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                    },
                  }}
                >
                  Sign Up
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
                    px: { xs: 2.5, sm: 3 },
                    py: 1,
                    borderRadius: 2,
                    minWidth: 'auto',
                    boxShadow: '0 4px 12px rgba(206, 14, 45, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #b00c26, #e63939)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(206, 14, 45, 0.4)',
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
                color: 'rgba(255, 255, 255, 0.8)',
                p: 1,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                },
              }}
            >
              <MenuIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Search Dialog */}
      <SearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
      />
    </AppBar>
  );
}