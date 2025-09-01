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
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user) {
      // Check if user has permission to access dashboard
      const isAdmin = user.userType === 'ADMIN' || user.userType === 'SUPER_ADMIN';
      const isApprovedAgent = user.userType === 'AGENT' && user.agent?.status === 'APPROVED';
      
      if (!isAdmin && !isApprovedAgent) {
        // Redirect unauthorized users to main page with error message
        router.push('/?error=dashboard_access_denied');
        return;
      }
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

  // Check permissions before rendering dashboard
  const isAdmin = user.userType === 'ADMIN' || user.userType === 'SUPER_ADMIN';
  const isApprovedAgent = user.userType === 'AGENT' && user.agent?.status === 'APPROVED';
  
  if (!isAdmin && !isApprovedAgent) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1>Access Denied</h1>
        <p>You don't have permission to access the dashboard.</p>
        <p>Only administrators and approved agents can access this area.</p>
        <button 
          onClick={() => router.push('/')}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#CE0E2D',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
