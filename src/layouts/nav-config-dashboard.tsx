import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
};

// ----------------------------------------------------------------------

export const getNavData = (t: (key: string) => string): NavSectionProps['data'] => [
  /**
   * Overview
   */
  {
    subheader: t('dashboard.overview'),
    items: [
      {
        title: t('navigation.dashboard'),
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
        info: <Label>v{CONFIG.appVersion}</Label>,
      },
      { title: t('navigation.analytics'), path: paths.dashboard.analytics, icon: ICONS.analytics },
      { title: t('navigation.reports'), path: paths.dashboard.reports, icon: ICONS.ecommerce },
    ],
  },
  /**
   * Inventory Management
   */
  {
    subheader: t('dashboard.inventoryManagement'),
    items: [
      {
        title: t('navigation.products'),
        path: paths.dashboard.products.root,
        icon: ICONS.product,
        children: [
          { title: t('navigation.allProducts'), path: paths.dashboard.products.root },
          { title: t('navigation.addProduct'), path: paths.dashboard.products.create },
        ],
      },
      {
        title: t('navigation.categories'),
        path: paths.dashboard.categories.root,
        icon: ICONS.folder,
        children: [
          { title: t('navigation.allCategories'), path: paths.dashboard.categories.root },
          { title: t('navigation.addCategory'), path: paths.dashboard.categories.create },
        ],
      },
      {
        title: t('navigation.brands'),
        path: paths.dashboard.brands.root,
        icon: ICONS.label,
        children: [
          { title: t('navigation.allBrands'), path: paths.dashboard.brands.root },
          { title: t('navigation.addBrand'), path: paths.dashboard.brands.create },
        ],
      },
      {
        title: t('navigation.tags'),
        path: paths.dashboard.tags.root,
        icon: ICONS.label,
        children: [
          { title: t('navigation.allTags'), path: paths.dashboard.tags.root },
          { title: t('navigation.addTag'), path: paths.dashboard.tags.create },
        ],
      },
    ],
  },
  /**
   * Auction Management
   */
  {
    subheader: t('dashboard.auctionManagement'),
    items: [
      {
        title: t('navigation.auctions'),
        path: paths.dashboard.auctions.root,
        icon: ICONS.ecommerce,
        children: [
          { title: t('navigation.allAuctions'), path: paths.dashboard.auctions.root },
          { title: t('navigation.createAuction'), path: paths.dashboard.auctions.create },
        ],
      },
      { title: t('navigation.bids'), path: paths.dashboard.bids, icon: ICONS.order },
      { title: 'Wallet & Recharge', path: '/dashboard/wallet', icon: ICONS.banking },
      { title: t('navigation.transactions'), path: paths.dashboard.transactions, icon: ICONS.banking },
    ],
  },
  /**
   * User Management
   */
  {
    subheader: t('dashboard.userManagement'),
    items: [
      {
        title: t('navigation.users'),
        path: paths.dashboard.users.root,
        icon: ICONS.user,
        children: [
          { title: t('navigation.allUsers'), path: paths.dashboard.users.root },
          { title: t('navigation.addUser'), path: paths.dashboard.users.create },
        ],
      },
      { title: t('navigation.kycVerification'), path: paths.dashboard.kyc, icon: ICONS.file },
    ],
  },
  /**
   * Settings
   */
  {
    subheader: t('navigation.settings'),
    items: [
      { title: t('navigation.systemSettings'), path: paths.dashboard.settings, icon: ICONS.parameter },
      { title: t('navigation.mailTemplates'), path: paths.dashboard.mailTemplates, icon: ICONS.mail },
    ],
  },
];

// Default export for backward compatibility
export const navData: NavSectionProps['data'] = [];

// Export a simple function to get translated nav data
export const getTranslatedNavData = (t: (key: string) => string) => getNavData(t);
