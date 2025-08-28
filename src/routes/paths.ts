// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    signIn: '/login',
    signUp: '/register',
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    analytics: `${ROOTS.DASHBOARD}/analytics`,
    reports: `${ROOTS.DASHBOARD}/reports`,
    transactions: `${ROOTS.DASHBOARD}/transactions`,
    kyc: `${ROOTS.DASHBOARD}/kyc`,
    settings: `${ROOTS.DASHBOARD}/settings`,
    mailTemplates: `${ROOTS.DASHBOARD}/mail-templates`,
    bids: `${ROOTS.DASHBOARD}/bids`,
    // Management sections
    categories: {
      root: `${ROOTS.DASHBOARD}/categories`,
      create: `${ROOTS.DASHBOARD}/categories/create`,
      edit: `${ROOTS.DASHBOARD}/categories/[id]/edit`,
    },
    tags: {
      root: `${ROOTS.DASHBOARD}/tags`,
      create: `${ROOTS.DASHBOARD}/tags/create`,
      edit: `${ROOTS.DASHBOARD}/tags/[id]/edit`,
    },
    products: {
      root: `${ROOTS.DASHBOARD}/products`,
      create: `${ROOTS.DASHBOARD}/products/create`,
      edit: `${ROOTS.DASHBOARD}/products/[id]/edit`,
      view: `${ROOTS.DASHBOARD}/products/[id]`,
    },
    brands: {
      root: `${ROOTS.DASHBOARD}/brands`,
      create: `${ROOTS.DASHBOARD}/brands/create`,
      edit: `${ROOTS.DASHBOARD}/brands/[id]/edit`,
    },
    auctions: {
      root: `${ROOTS.DASHBOARD}/auctions`,
      create: `${ROOTS.DASHBOARD}/auctions/create`,
      edit: `${ROOTS.DASHBOARD}/auctions/[id]/edit`,
      view: `${ROOTS.DASHBOARD}/auctions/[id]`,
    },
    users: {
      root: `${ROOTS.DASHBOARD}/users`,
      create: `${ROOTS.DASHBOARD}/users/create`,
      edit: `${ROOTS.DASHBOARD}/users/[id]/edit`,
      view: `${ROOTS.DASHBOARD}/users/[id]`,
    },
  },
};
