'use client';

import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography
} from '@mui/material';
import { Iconify } from '@/components/iconify';
import { useLocale } from '@/hooks/useLocale';

const languages = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    direction: 'ltr'
  },
  {
    code: 'ar',
    name: 'العربية',
    flag: '🇸🇦',
    direction: 'rtl'
  }
];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    setLocale(languageCode);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          color: 'text.secondary',
          p: 1.5,
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            color: 'primary.main',
            backgroundColor: 'rgba(206, 14, 45, 0.08)',
            transform: 'translateY(-1px)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.9rem', fontWeight: 500 }}>
          {currentLanguage.flag}
          <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
            {currentLanguage.code.toUpperCase()}
          </Typography>
          <Iconify icon="eva:chevron-down-fill" width={12} />
        </Box>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 140,
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              color: 'text.primary',
              borderRadius: 3,
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            },
          },
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === locale}
            sx={{
              typography: 'body2',
              px: 2,
              py: 1,
              mx: 1,
              my: 0.5,
              borderRadius: 2,
              color: 'text.primary',
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: 'rgba(206, 14, 45, 0.08)',
                color: 'primary.main',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(206, 14, 45, 0.12)',
                color: 'primary.main',
                fontWeight: 600,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
              <Typography variant="body2" sx={{ fontSize: '16px', color: 'inherit' }}>
                {language.flag}
              </Typography>
            </ListItemIcon>
            <ListItemText 
              primary={language.name} 
              sx={{ color: 'inherit' }}
              primaryTypographyProps={{ sx: { color: 'inherit' } }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default LanguageSwitcher;