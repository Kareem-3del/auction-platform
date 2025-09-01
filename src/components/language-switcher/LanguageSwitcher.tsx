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
      <Box
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '11px',
          fontWeight: 400,
          transition: 'color 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          '&:hover': { 
            color: '#CE0E2D',
          },
        }}
      >
        {currentLanguage.name}
        <Iconify icon="eva:chevron-down-fill" width={12} />
      </Box>

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
              backgroundColor: '#0F1419',
              color: 'white',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
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
              color: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'rgba(206, 14, 45, 0.1)',
                color: '#CE0E2D',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(206, 14, 45, 0.2)',
                color: '#CE0E2D',
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