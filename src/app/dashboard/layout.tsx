'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Home, Users, Settings, LogOut, Menu, X, Video, Search, Radio } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/button';
import { UserRole } from '@/types/auth';

import SmartSidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated && !user) {
      console.log('Dashboard: Not authenticated, redirecting to homepage');
      router.push('/');
    }
  }, [isHydrated, isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'MANAGER', 'EDITOR', 'CONTENT'] },
    { icon: Search, label: 'Tìm kiếm Video', href: '/dashboard/ai/search', roles: ['ADMIN', 'MANAGER', 'EDITOR', 'CONTENT'] },
    { icon: Radio, label: 'Kênh theo dõi', href: '/dashboard/ai/channels', roles: ['ADMIN', 'MANAGER'] },
    { icon: Video, label: 'Music Posts', href: '/dashboard/ai/music', roles: ['ADMIN', 'MANAGER', 'EDITOR', 'CONTENT'] },
    { icon: Users, label: 'Quản lý Users', href: '/dashboard/users', roles: ['ADMIN', 'MANAGER'] },
    { icon: Settings, label: 'Cài đặt', href: '/dashboard/settings', roles: ['ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Smart Sidebar (Desktop & Mobile adaptation) */}
      <SmartSidebar 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* Main content */}
      {/* Margin left matches the icon dock width (80px). The drawer (240px) overlays or pushes depending on preference, but floating overlay is smoother for auto-collapse */}
      <div className="pl-[80px] transition-all duration-300">
        {/* Header - Make it stick but transparent or matching? */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex-1 lg:hidden" />
            <div className="flex items-center gap-4 ml-auto">
               {/* Optional User info in header if sidebar is collapsed? */}
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
               </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
