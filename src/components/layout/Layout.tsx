'use client';

import type { ReactNode } from 'react';

import HomepageLayout from './HomepageLayout';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <HomepageLayout>{children}</HomepageLayout>;
}