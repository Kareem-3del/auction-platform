'use client';

import type { ReactNode } from 'react';

import Layout from 'src/components/layout/Layout';

interface ProductsLayoutProps {
  children: ReactNode;
}

export default function ProductsLayout({ children }: ProductsLayoutProps) {
  return <Layout>{children}</Layout>;
}