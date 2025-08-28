import { Iconify } from 'src/components/iconify';

import type { AccountDrawerProps } from './components/account-drawer';

// ----------------------------------------------------------------------

export const _account: AccountDrawerProps['data'] = [
  { label: 'Home', href: '/', icon: <Iconify icon="solar:home-angle-bold-duotone" /> },
  {
    label: 'Profile',
    href: '/profile',
    icon: <Iconify icon="solar:user-bold-duotone" />,
  },
  {
    label: 'Settings',
    href: '/profile',
    icon: <Iconify icon="solar:settings-bold-duotone" />,
  },
  {
    label: 'Bid History',
    href: '/profile',
    icon: <Iconify icon="solar:history-bold-duotone" />,
  },
];
