'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Translation types
interface Translations {
  [key: string]: any;
}

interface LocaleContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
  isRTL: boolean;
  translations: Translations;
  getLocalizedField: (obj: any, fieldName: string, fallbackLocale?: string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const supportedLocales = ['en', 'ar'];
const defaultLocale = 'en';

// Simple translation function
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function interpolate(template: string, params: Record<string, any> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: string;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<string>(initialLocale || defaultLocale);
  const [translations, setTranslations] = useState<Translations>({});
  const router = useRouter();
  const pathname = usePathname();

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${locale}/common.json`);
        if (response.ok) {
          const data = await response.json();
          setTranslations(data);
        } else {
          // Fallback to default locale
          const fallbackResponse = await fetch(`/locales/${defaultLocale}/common.json`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setTranslations(fallbackData);
          }
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
        setTranslations({});
      }
    };

    loadTranslations();
  }, [locale]);

  // Initialize locale from localStorage or browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale');
      const browserLocale = navigator.language.split('-')[0];
      const preferredLocale = savedLocale || 
        (supportedLocales.includes(browserLocale) ? browserLocale : defaultLocale);
      
      if (preferredLocale !== locale) {
        setLocaleState(preferredLocale);
      }
    }
  }, [locale]);

  const setLocale = (newLocale: string) => {
    if (supportedLocales.includes(newLocale)) {
      setLocaleState(newLocale);
      if (typeof window !== 'undefined') {
        localStorage.setItem('locale', newLocale);
        // Update document direction
        document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = newLocale;
      }
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const value = getNestedValue(translations, key);
    if (typeof value === 'string') {
      return params ? interpolate(value, params) : value;
    }
    return key; // Return key if translation not found
  };

  const isRTL = locale === 'ar';

  const getLocalizedField = (obj: any, fieldName: string, fallbackLocale: string = 'en') => {
    if (!obj) return '';
    
    const localizedField = `${fieldName}${locale === 'ar' ? 'Ar' : ''}`;
    const fallbackField = `${fieldName}${fallbackLocale === 'ar' ? 'Ar' : ''}`;
    
    return obj[localizedField] || obj[fallbackField] || obj[fieldName] || '';
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Beirut', // Lebanon timezone
      ...options,
    }).format(dateObj);
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', options).format(number);
  };

  // Update document direction and font when locale changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
      
      // Apply Arabic font for Arabic locale
      const fontFamily = locale === 'ar' 
        ? 'Cairo, "Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '"Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      
      document.documentElement.style.fontFamily = fontFamily;
      document.body.style.fontFamily = fontFamily;
    }
  }, [locale, isRTL]);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t,
        isRTL,
        translations,
        getLocalizedField,
        formatCurrency,
        formatDate,
        formatNumber,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

export default LocaleContext;