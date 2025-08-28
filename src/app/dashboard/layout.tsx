'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from 'src/hooks/useAuth';

import { DashboardLayout } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
