'use client';

import type { ReactNode } from 'react';

import Layout from 'src/components/layout/Layout';

interface PrivacyLayoutProps {
  children: ReactNode;
}

export default function PrivacyLayout({ children }: PrivacyLayoutProps) {
  return <Layout>{children}</Layout>;
}