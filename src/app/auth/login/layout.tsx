'use client';

import type { ReactNode } from 'react';

import HomepageLayout from 'src/components/layout/HomepageLayout';

interface LoginLayoutProps {
  children: ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return <HomepageLayout>{children}</HomepageLayout>;
}