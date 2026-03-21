'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [allowedMenuIds, setAllowedMenuIds] = useState<string[]>([]);
  const { token } = useAuthStore();

  useEffect(() => {
    setIsHydrated(true);
    router.prefetch('/');
  }, [router]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated && !user && !isLoggingOut) {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        router.push('/');
      } else {
        console.log('Dashboard: Token found but state empty, attempting to restore session...');
      }
    }
  }, [isHydrated, isAuthenticated, user, router, isLoggingOut]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated && !user && !isLoggingOut) {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken && !useAuthStore.getState().isLoading) {
        useAuthStore.getState().loadUser();
      }
    }
  }, [isHydrated, isAuthenticated, user, isLoggingOut]);

  // Fetch dynamic sidebar/header permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!token) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/role-permissions/my-tabs`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setAllowedMenuIds(data);
        }
      } catch (err) {
        console.error('Failed to fetch header permissions', err);
      }
    };
    fetchPermissions();
  }, [token]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    router.replace('/');
    setTimeout(() => {
      logout();
    }, 500);
  };

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        user={user}
        onLogout={handleLogout}
        allowedMenuIds={allowedMenuIds}
      />

      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
