import { useLocale as useLocaleContext } from 'src/contexts/LocaleContext';

export function useLocale() {
  const context = useLocaleContext();

  // Helper function to format relative time
  const formatRelativeTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = (now.getTime() - dateObj.getTime()) / 1000;

    const rtf = new Intl.RelativeTimeFormat(context.locale === 'ar' ? 'ar-SA' : 'en-US', {
      numeric: 'auto',
    });

    if (diffInSeconds < 60) {
      return rtf.format(-Math.floor(diffInSeconds), 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  };

  return {
    ...context,
    currentLocale: context.locale,
    changeLanguage: context.setLocale,
    formatRelativeTime,
  };
}