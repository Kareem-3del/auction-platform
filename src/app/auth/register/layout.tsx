'use client';

import type { ReactNode } from 'react';

import HomepageLayout from 'src/components/layout/HomepageLayout';

interface RegisterLayoutProps {
  children: ReactNode;
}

export default function RegisterLayout({ children }: RegisterLayoutProps) {
  return <HomepageLayout>{children}</HomepageLayout>;
}