'use client';

import type { ReactNode } from 'react';
import type { Theme } from '@mui/material/styles';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as ThemeVarsProvider } from '@mui/material/styles';

import { useSettingsContext } from 'src/components/settings';

import { createTheme } from './create-theme';
import { Rtl } from './with-settings/right-to-left';

import type {} from './extend-theme-types';
import type { ThemeOptions } from './types';

// ----------------------------------------------------------------------

export type ThemeProviderProps = {
  children: ReactNode;
  theme?: Theme;
  themeOverrides?: ThemeOptions;
};

export function ThemeProvider({ themeOverrides, children, ...other }: ThemeProviderProps) {
  const settings = useSettingsContext();

  // Force light mode regardless of settings
  const forcedSettings = {
    ...settings.state,
    colorScheme: 'light' as const,
  };

  const theme = createTheme({
    settingsState: forcedSettings,
    themeOverrides,
  });

  return (
    <ThemeVarsProvider disableTransitionOnChange theme={theme} defaultMode="light" {...other}>
      <CssBaseline />
      <Rtl direction={settings.state.direction!}>{children}</Rtl>
    </ThemeVarsProvider>
  );
}
