'use client';

import type { ReactNode } from 'react';

import Layout from 'src/components/layout/Layout';

interface AboutLayoutProps {
  children: ReactNode;
}

export default function AboutLayout({ children }: AboutLayoutProps) {
  return <Layout>{children}</Layout>;
}