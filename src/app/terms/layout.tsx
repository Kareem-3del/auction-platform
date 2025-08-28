'use client';

import type { ReactNode } from 'react';

import Layout from 'src/components/layout/Layout';

interface TermsLayoutProps {
  children: ReactNode;
}

export default function TermsLayout({ children }: TermsLayoutProps) {
  return <Layout>{children}</Layout>;
}