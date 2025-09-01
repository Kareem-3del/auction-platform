'use client';

import type { ReactNode } from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useTheme } from '@mui/material/styles';
import { 
  Box, 
  Menu, 
  Avatar, 
  Divider, 
  MenuItem, 
  Typography, 
  IconButton,
  ListItemIcon 
} from '@mui/material';

import { useAuth } from 'src/hooks/useAuth';
import { useLocale } from 'src/hooks/useLocale';
import { useNotificationContext } from 'src/contexts/NotificationContext';

import { NotificationsDrawer } from 'src/layouts/components/notifications-drawer';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';
import SearchDialog from 'src/components/search/SearchDialog';
import { LanguageSwitcher } from 'src/components/language-switcher';

import SearchIcon from '@mui/icons-material/Search';

import Footer from './Footer';
import CursorTrail from '../animations/CursorTrail';
import ScrollAnimations from '../animations/ScrollAnimations';

interface HomepageLayoutProps {
  children: ReactNode;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export default function HomepageLayout({ children }: HomepageLayoutProps) {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout, loading } = useAuth();
  const { t } = useLocale();
  const { notifications, unreadCount } = useNotificationContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Fetch categories for navigation
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?flat=true');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Filter to show only parent categories (no parentId) with products > 0
            const parentCategoriesWithProducts = result.data
              .filter((cat: Category & { parentId: string | null }) => 
                cat.parentId === null && cat.productCount > 0
              )
              .slice(0, 5); // Get first 5 categories for header
            
            setCategories(parentCategoriesWithProducts);
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path: string) => {
    handleMenuClose();
    router.push(path);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const renderHeader = () => (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        bgcolor: '#0F1419', // Match footer background
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        py: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: '1200px',
          mx: 'auto',
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Logo
            onClick={handleLogoClick}
            sx={{ 
              cursor: 'pointer',
              width: 140,
              height: 50,
            }}
            isSingle={false}
          />
        </Box>

        {/* Navigation - Dynamic Categories */}
        <Box sx={{ 
          display: { xs: 'none', lg: 'flex' }, 
          alignItems: 'center', 
          gap: 1,
          flex: 1,
          justifyContent: 'center',
          ml: 4,
        }}>
          {categories.map((category) => (
            <Box
              key={category.id}
              onClick={() => router.push(`/categories/${category.slug}`)}
              sx={{
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500,
                px: 2,
                py: 1,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#CE0E2D',
                },
              }}
            >
              {category.name} ({category.productCount})
              <Box sx={{ fontSize: '10px', ml: 0.5 }}>▼</Box>
            </Box>
          ))}
        </Box>

        {/* Right Side - Utility Links + Search + Auth */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Utility Links */}
          <Box sx={{ 
            display: { xs: 'none', xl: 'flex' }, 
            alignItems: 'center', 
            gap: 2.5 
          }}>
            <Box
              onClick={() => router.push('/about')}
              sx={{
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                fontWeight: 400,
                transition: 'color 0.3s ease',
                '&:hover': { 
                  color: '#CE0E2D',
                },
              }}
            >
              {t('navigation.aboutEA', 'About EA')}
            </Box>
            <Box
              onClick={() => router.push('/contact')}
              sx={{
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                fontWeight: 400,
                transition: 'color 0.3s ease',
                '&:hover': { 
                  color: '#CE0E2D',
                },
              }}
            >
              {t('navigation.contact', 'Contact')}
            </Box>
            <Box
              onClick={() => router.push('/help')}
              sx={{
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                fontWeight: 400,
                transition: 'color 0.3s ease',
                '&:hover': { 
                  color: '#CE0E2D',
                },
              }}
            >
              {t('navigation.help', 'Help')}
            </Box>
            <LanguageSwitcher />
          </Box>

          {/* Search Icon */}
          <Box
            onClick={() => setSearchDialogOpen(true)}
            sx={{
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.7)',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.3s ease',
              '&:hover': { 
                color: '#CE0E2D',
              },
            }}
          >
            <SearchIcon sx={{ fontSize: 18 }} />
          </Box>

          {/* Auth Buttons */}
          {loading ? (
            // Show loading placeholder to prevent layout shift
            <Box sx={{ width: 140, height: 32 }} />
          ) : user ? (
            <>
              <NotificationsDrawer data={notifications.map(notif => ({
                id: notif.id,
                title: notif.title,
                description: notif.message,
                type: notif.notificationType || notif.type,
                avatarUrl: '/logo.png',
                isUnRead: !notif.isRead,
                postedAt: notif.createdAt,
              }))} />
              
              {/* User Profile Dropdown Menu */}
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
                    width: 32,
                    height: 32,
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
                    minWidth: 220,
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
                      {t('wallet.balance')}
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
                  {t('navigation.profile', 'My Profile')}
                </MenuItem>

                <MenuItem onClick={() => handleMenuItemClick('/profile')}>
                  <ListItemIcon>
                    <Iconify icon="solar:auction-bold-duotone" sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  </ListItemIcon>
                  {t('navigation.bids')}
                </MenuItem>
                
                <MenuItem onClick={() => handleMenuItemClick('/profile')}>
                  <ListItemIcon>
                    <Iconify icon="solar:settings-bold-duotone" sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  </ListItemIcon>
                  {t('navigation.settings', 'Settings')}
                </MenuItem>

                <MenuItem onClick={() => handleMenuItemClick('/profile?tab=charge')}>
                  <ListItemIcon>
                    <Iconify icon="solar:wallet-money-bold-duotone" sx={{ color: '#22C55E' }} />
                  </ListItemIcon>
                  <Typography sx={{ color: '#22C55E' }}>{t('wallet.recharge')}</Typography>
                </MenuItem>

                {/* Dashboard for Agent/Admin */}
                {(user?.userType === 'AGENT' || user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN') && (
                  <>
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                    <MenuItem onClick={() => handleMenuItemClick('/dashboard')}>
                      <ListItemIcon>
                        <Iconify icon="solar:widget-4-bold-duotone" sx={{ color: '#1976D2' }} />
                      </ListItemIcon>
                      <Typography sx={{ color: '#1976D2' }}>{t('navigation.dashboard')}</Typography>
                    </MenuItem>
                  </>
                )}

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Iconify icon="solar:logout-2-bold-duotone" sx={{ color: '#CE0E2D' }} />
                  </ListItemIcon>
                  <Typography sx={{ color: '#CE0E2D' }}>{t('auth.signOut')}</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                onClick={() => router.push('/auth/register')}
                sx={{
                  cursor: 'pointer',
                  px: 2.5,
                  py: 1,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 1,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#CE0E2D',
                    color: '#CE0E2D',
                  },
                }}
              >
                {t('auth.createAccount')}
              </Box>
              <Box
                onClick={() => router.push('/auth/login')}
                sx={{
                  cursor: 'pointer',
                  px: 2.5,
                  py: 1,
                  bgcolor: '#CE0E2D',
                  borderRadius: 1,
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: '#B00C24',
                  },
                }}
              >
                {t('auth.login')}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollAnimations />
      <CursorTrail />
      
      {renderHeader()}
      
      <Box component="main" sx={{ flexGrow: 1, pt: '82px' }}>
        {children}
      </Box>
      
      <Footer />

      {/* Search Dialog */}
      <SearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
      />
    </Box>
  );
}