'use client';

import type { ReactNode } from 'react';

import Layout from 'src/components/layout/Layout';

interface AuctionsLayoutProps {
  children: ReactNode;
}

export default function AuctionsLayout({ children }: AuctionsLayoutProps) {
  return <Layout>{children}</Layout>;
}