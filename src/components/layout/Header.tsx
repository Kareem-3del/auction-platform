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
  { label: 'Motors', path: '/categories/cars', count: 889 },
  { label: 'Prestigious Numbers', path: '/categories/plates', count: 430 },
  { label: 'Properties', path: '/categories/properties', count: 42 },
  { label: 'Jewelry', path: '/categories/jewelry', count: 156 },
  { label: 'Collectibles', path: '/categories/collectibles', count: 85 },
];

const utilityLinks = [
  { label: 'Auction Calendar', path: '/products' },
  { label: 'About', path: '/about' },
  { label: 'Help', path: '/help' },
  { label: 'Contact Us', path: '/contact' },
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
        background: '#000000',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        minHeight: { xs: 70, md: 80, lg: 120 },
        zIndex: 109,
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 0, lg: 6, xl: 8 } }}>
        {/* Top utility bar - hidden on mobile */}
        <Box sx={{ 
          display: { xs: 'none', lg: 'block' },
          py: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {/* Contact Info */}
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <PhoneIcon sx={{ fontSize: 14 }} />
                +961 1 234 567
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <EmailIcon sx={{ fontSize: 14 }} />
                info@lebanonauction.com
              </Typography>
            </Box>

            {/* Utility Links */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
              {utilityLinks.map((link) => (
                <Button
                  key={link.path}
                  color="inherit"
                  onClick={() => navigateTo(link.path)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.75rem',
                    fontWeight: 400,
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.5,
                    minWidth: 'auto',
                    '&:hover': {
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
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
          </Box>
        </Box>

        {/* Main header content */}
        <Toolbar 
          disableGutters 
          sx={{ 
            minHeight: { xs: 70, md: 80, lg: 80 },
            px: { xs: 4, lg: 0 },
            py: { xs: 1.5, lg: 2 },
          }}
        >
          {/* Logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: { xs: 130, lg: 160 },
            height: { xs: 45, lg: 60 },
            mr: { xs: 3, lg: 6 },
          }}>
            <Logo
              sx={{ 
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
              onClick={() => navigateTo('/')}
              isSingle={false}
            />
          </Box>

          {/* Navigation Items - Desktop */}
          <Box sx={{ 
            display: { xs: 'none', xl: 'flex' },
            flex: 1,
            gap: 2,
            alignItems: 'center',
          }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigateTo(item.path)}
                sx={{
                  color: 'white',
                  fontWeight: 500,
                  fontSize: { lg: '0.8rem', xl: '0.875rem' },
                  textTransform: 'none',
                  px: { lg: 2.5, xl: 3 },
                  py: 2,
                  minWidth: 'auto',
                  borderRadius: 2,
                  display: 'flex',
                  gap: 2,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: 'rgba(107, 107, 107, 0.4)',
                  },
                }}
              >
                <Typography component="span" sx={{ fontWeight: 'inherit' }}>
                  {item.label}
                </Typography>
                <Typography 
                  component="span" 
                  sx={{ 
                    fontWeight: 'inherit',
                    opacity: 0.8,
                  }}
                >
                  ({item.count})
                </Typography>
                <KeyboardArrowDownIcon 
                  sx={{ 
                    fontSize: 16,
                    opacity: 0.7 
                  }}
                />
              </Button>
            ))}
          </Box>

          {/* Right side actions */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: { xs: 2, md: 3 },
            ml: 'auto',
          }}>
            {/* Search Icon */}
            <IconButton 
              onClick={() => setSearchDialogOpen(true)}
              sx={{ 
                color: 'white',
                p: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <SearchIcon sx={{ fontSize: 24 }} />
            </IconButton>

            {/* Auth Buttons */}
            {loading ? (
              // Show loading placeholder to prevent layout shift
              <Box sx={{ width: { xs: 80, md: 220 }, height: 40 }} />
            ) : user ? (
              <>
                <NotificationCenter />
                
                {/* User Profile Menu */}
                <IconButton
                  onClick={handleMenuOpen}
                  sx={{
                    p: 0.5,
                    ml: 1,
                  }}
                >
                  <Avatar
                    src={user?.photoURL}
                    alt={user?.displayName || user?.firstName || 'User'}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: '#CE0E2D',
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
                      backgroundColor: '#0F1419',
                      color: 'white',
                      minWidth: 200,
                      mt: 1,
                      borderRadius: 2,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  {/* User Info */}
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                      {user?.displayName || `${user?.firstName} ${user?.lastName}` || 'User'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {user?.email}
                    </Typography>
                    {/* Account Balance */}
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(206, 14, 45, 0.1)', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                        Balance
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#CE0E2D', fontWeight: 600 }}>
                        ${user?.balanceReal?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Account Management */}
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

                  {/* Dashboard for Agent/Admin */}
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
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => navigateTo('/auth/register')}
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    color: 'white',
                    borderColor: 'white',
                    fontSize: { xs: '0.8rem', lg: '0.875rem' },
                    fontWeight: 500,
                    textTransform: 'none',
                    px: { xs: 2, md: 3, lg: 3.5 },
                    py: { xs: 1, md: 1.25, lg: 1.5 },
                    borderRadius: { xs: 1.5, lg: 2 },
                    minWidth: { xs: 120, md: 150, lg: 170 },
                    mr: { xs: 1, md: 2 },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'white',
                    },
                  }}
                >
                  Create Account
                </Button>
                
                <Button
                  variant="contained"
                  onClick={() => navigateTo('/auth/login')}
                  sx={{
                    backgroundColor: '#CE0E2D',
                    color: 'white',
                    fontSize: { xs: '0.8rem', lg: '0.875rem' },
                    fontWeight: 500,
                    textTransform: 'none',
                    px: { xs: 2, md: 3, lg: 3.5 },
                    py: { xs: 1, md: 1.25, lg: 1.5 },
                    borderRadius: { xs: 1.5, lg: 2 },
                    minWidth: { xs: 120, md: 150, lg: 170 },
                    '&:hover': {
                      backgroundColor: '#b00c26',
                    },
                  }}
                >
                  Login
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <IconButton
              onClick={handleDrawerToggle}
              sx={{ 
                display: { xs: 'flex', xl: 'none' },
                color: 'white',
                p: 1.5,
              }}
            >
              <MenuIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Box>
        </Toolbar>

        {/* Bottom separator line */}
        <Box sx={{
          width: '100%',
          height: '0.5px',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          display: { xs: 'none', lg: 'block' },
        }} />
      </Container>

      {/* Search Dialog */}
      <SearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
      />
    </AppBar>
  );
}