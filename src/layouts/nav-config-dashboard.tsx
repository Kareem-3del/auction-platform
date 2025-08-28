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

export const navData: NavSectionProps['data'] = [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      {
        title: 'Dashboard',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
        info: <Label>v{CONFIG.appVersion}</Label>,
      },
      { title: 'Analytics', path: paths.dashboard.analytics, icon: ICONS.analytics },
      { title: 'Reports', path: paths.dashboard.reports, icon: ICONS.ecommerce },
    ],
  },
  /**
   * Inventory Management
   */
  {
    subheader: 'Inventory Management',
    items: [
      {
        title: 'Products',
        path: paths.dashboard.products.root,
        icon: ICONS.product,
        children: [
          { title: 'All Products', path: paths.dashboard.products.root },
          { title: 'Add Product', path: paths.dashboard.products.create },
        ],
      },
      {
        title: 'Categories',
        path: paths.dashboard.categories.root,
        icon: ICONS.folder,
        children: [
          { title: 'All Categories', path: paths.dashboard.categories.root },
          { title: 'Add Category', path: paths.dashboard.categories.create },
        ],
      },
      {
        title: 'Brands',
        path: paths.dashboard.brands.root,
        icon: ICONS.label,
        children: [
          { title: 'All Brands', path: paths.dashboard.brands.root },
          { title: 'Add Brand', path: paths.dashboard.brands.create },
        ],
      },
      {
        title: 'Tags',
        path: paths.dashboard.tags.root,
        icon: ICONS.label,
        children: [
          { title: 'All Tags', path: paths.dashboard.tags.root },
          { title: 'Add Tag', path: paths.dashboard.tags.create },
        ],
      },
    ],
  },
  /**
   * Auction Management
   */
  {
    subheader: 'Auction Management',
    items: [
      {
        title: 'Auctions',
        path: paths.dashboard.auctions.root,
        icon: ICONS.ecommerce,
        children: [
          { title: 'All Auctions', path: paths.dashboard.auctions.root },
          { title: 'Create Auction', path: paths.dashboard.auctions.create },
        ],
      },
      { title: 'Bids', path: paths.dashboard.bids, icon: ICONS.order },
      { title: 'Transactions', path: paths.dashboard.transactions, icon: ICONS.banking },
    ],
  },
  /**
   * User Management
   */
  {
    subheader: 'User Management',
    items: [
      {
        title: 'Users',
        path: paths.dashboard.users.root,
        icon: ICONS.user,
        children: [
          { title: 'All Users', path: paths.dashboard.users.root },
          { title: 'Add User', path: paths.dashboard.users.create },
        ],
      },
      { title: 'KYC Verification', path: paths.dashboard.kyc, icon: ICONS.file },
    ],
  },
  /**
   * Settings
   */
  {
    subheader: 'Settings',
    items: [
      { title: 'System Settings', path: paths.dashboard.settings, icon: ICONS.parameter },
      { title: 'Mail Templates', path: paths.dashboard.mailTemplates, icon: ICONS.mail },
    ],
  },
];
