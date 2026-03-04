'use client';

import { useState, useMemo, memo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Settings,
  LogOut,
  Facebook,
  Instagram,
  Music2, // TikTok
  Music, // Douyin
  LayoutGrid,
  CreditCard,
  HelpCircle,
  Pin,
  FileText,
  Users,
  Activity,
  BookOpen, // Xiaohongshu
  Volume2,
  ClipboardCheck,
  Film,
  Lock
} from 'lucide-react';
import { UserRole } from '@/types/auth';
import { useAuthStore } from '@/store/auth-store';

interface SidebarProps {
  menuItems?: any[];
  user: any;
  onLogout: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

function SmartSidebar({ user, onLogout, isPinned, onTogglePin }: SidebarProps) {
  const pathname = usePathname() || '';
  const { token } = useAuthStore();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [allowedMenuIds, setAllowedMenuIds] = useState<string[]>([]);

  // Fetch dynamic permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/role-permissions/my-tabs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAllowedMenuIds(data);
        }
      } catch (err) {
        console.error("Failed to fetch sidebar permissions", err);
      }
    };
    fetchPermissions();
  }, [token]);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Directly derive activePlatform
  const activePlatform = useMemo(() => {
    const path = pathname?.toLowerCase() || '';
    if (path.startsWith('/dashboard/manager') || path.startsWith('/dashboard/editor-management')) {
      return 'user-management';
    } else if (pathname.startsWith('/dashboard/facebook')) {
      return 'facebook';
    } else if (pathname.startsWith('/dashboard/instagram')) {
      return 'instagram';
    } else if (pathname.startsWith('/dashboard/ai')) {
      return 'tiktok';
    } else if (pathname.startsWith('/dashboard/douyin')) {
      return 'douyin';
    } else if (pathname.startsWith('/dashboard/xiaohongshu')) {
      return 'xiaohongshu';
    }
    return 'facebook';
  }, [pathname]);

  // Platforms configuration with dynamic filtering
  const platforms = useMemo(() => {
    const allPlatforms = [
      {
        id: 'user-management',
        icon: Users,
        label: 'VCB Portal',
        menus: [
          {
            section: 'HỆ THỐNG',
            items: [
              { id: 'performance', label: 'Hiệu suất', href: '/dashboard/manager/user-activity', icon: Activity },
              { id: 'dashboard', label: 'Dashboard Tổng', href: '/dashboard/manager', icon: LayoutGrid },
              { id: 'editors', label: 'Quản lý Editors', href: '/dashboard/editor-management', icon: Users },
            ]
          }
        ]
      },
      {
        id: 'facebook',
        icon: Facebook,
        label: 'Facebook',
        menus: [
          {
            section: 'ANALYTICS',
            items: [
              { label: 'Channel Overview', href: '/dashboard/facebook/channels', icon: LayoutGrid },
              { label: 'Search Post', href: '/dashboard/facebook/search-post', icon: Search },
              { label: 'Search Reel', href: '/dashboard/facebook/search-reel', icon: Film },
            ]
          }
        ]
      },
      {
        id: 'instagram',
        icon: Instagram,
        label: 'Instagram',
        menus: [
          {
            section: 'ANALYTICS',
            items: [
              { label: 'Channel Overview', href: '/dashboard/instagram/channels', icon: LayoutGrid },
              { label: 'Search Post', href: '/dashboard/instagram/search', icon: FileText },
              { label: 'Search Reels', href: '/dashboard/instagram/search-reel', icon: Film },
            ]
          }
        ]
      },
      {
        id: 'tiktok',
        icon: Music2,
        label: 'TikTok',
        menus: [
          {
            section: 'ANALYTICS',
            items: [
              { label: 'Channel Overview', href: '/dashboard/ai/channels', icon: LayoutGrid },
              { label: 'Search Video', href: '/dashboard/ai/search', icon: Search },
            ]
          }
        ]
      },
      {
        id: 'douyin',
        icon: Music,
        label: 'Douyin',
        menus: [
          {
            section: 'ANALYTICS',
            items: [
              { label: 'Channel Overview', href: '/dashboard/douyin/channels', icon: LayoutGrid },
              { label: 'Search Video', href: '/dashboard/douyin', icon: Search },
            ]
          }
        ]
      },
      {
        id: 'xiaohongshu',
        icon: BookOpen,
        label: 'Xiaohongshu',
        menus: [
          {
            section: 'ANALYTICS',
            items: [
              { label: 'Channel Overview', href: '/dashboard/xiaohongshu/channels', icon: LayoutGrid },
              { label: 'Search Video', href: '/dashboard/xiaohongshu', icon: Search },
            ]
          }
        ]
      }
    ];

    // Filter platforms based on allowedMenuIds
    return allPlatforms.filter(p => {
      // If no dynamic permissions fetched yet, show based on legacy role check as fallback
      if (allowedMenuIds.length === 0) {
        if (p.id === 'user-management') return user?.roles?.some((r: any) => [UserRole.ADMIN, UserRole.MANAGER].includes(r));
        return true;
      }

      // Check if platform ID is allowed
      const isPlatformAllowed = allowedMenuIds.includes(p.id);

      // Also filter internal items
      p.menus.forEach(menu => {
        menu.items = menu.items.filter(item => {
          if (!item.id) return true; // Items without ID are always visible if platform is visible
          return allowedMenuIds.includes(item.id);
        });
      });

      // Show platform only if it's explicitly allowed OR has allowed items
      return isPlatformAllowed || p.menus.some(m => m.items.length > 0);
    });
  }, [user?.roles, allowedMenuIds]);

  const currentPlatform = useMemo(() => platforms.find(p => p.id === activePlatform), [platforms, activePlatform]);

  const [isNavigating, setIsNavigating] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsSidebarHovered(true);
  }, [hoverTimeout]);

  const handleMouseLeave = useCallback(() => {
    if (isNavigating) return;
    const timeout = setTimeout(() => {
      setIsSidebarHovered(false);
    }, 200);
    setHoverTimeout(timeout);
  }, [isNavigating]);

  const handleLinkClick = useCallback(() => {
    setIsNavigating(true);
    setTimeout(() => setIsNavigating(false), 500);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [hoverTimeout]);

  const isDrawerVisible = activePlatform && (isSidebarHovered || isPinned);
  const transitionDuration = prefersReducedMotion ? '0ms' : '250ms';

  return (
    <>
      <aside
        className="fixed top-0 left-0 h-screen z-[100] flex"
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="w-[80px] h-full bg-[#0f172a] border-r border-slate-800 flex flex-col items-center py-6 gap-6 z-20 relative"
          onMouseEnter={handleMouseEnter}
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden mb-4 cursor-pointer border-2 border-slate-700 shadow-lg relative group">
            <img
              src="/logo-vcb.jfif"
              alt="VCB"
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
              loading="eager"
            />
          </div>

          <div className="flex-1 flex flex-col gap-4 w-full px-4">
            {platforms.map(p => (
              <Link
                key={p.id}
                href={p.menus?.[0]?.items?.[0]?.href || '#'}
                prefetch={true}
                onClick={handleLinkClick}
                className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ease-out group relative
                        ${activePlatform === p.id
                    ? 'bg-blue-600/10 text-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-105'
                  }`}
              >
                <p.icon className="w-6 h-6 transition-transform duration-200 ease-out group-hover:scale-110" />
                {activePlatform === p.id && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-4 w-full px-4 mt-auto">
            <button className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 ease-out hover:scale-105">
              <CreditCard className="w-5 h-5" />
            </button>

            {/* Settings Link - Controlled by 'settings' permission */}
            {(allowedMenuIds.includes('settings') || user?.roles?.some((r: any) => [UserRole.ADMIN, UserRole.MANAGER].includes(r))) ? (
              <Link
                href="/dashboard/manager/checklist-settings"
                className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 ease-out hover:scale-105"
                title="Cài đặt hệ thống"
              >
                <Settings className="w-5 h-5" />
              </Link>
            ) : (
              <button
                className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 ease-out hover:scale-105"
                title="Cài đặt hệ thống"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            <button className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 ease-out hover:scale-105">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-900/20 hover:text-red-500 mt-2 transition-all duration-200 ease-out hover:scale-105"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          className={`h-full bg-[#0b1121] border-r border-slate-800 flex flex-col overflow-hidden`}
          style={{
            width: isDrawerVisible ? '240px' : '0px',
            opacity: isDrawerVisible ? 1 : 0,
            transform: isDrawerVisible ? 'translate3d(0, 0, 0)' : 'translate3d(-100%, 0, 0)',
            transition: prefersReducedMotion
              ? 'none'
              : `all ${transitionDuration} cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800 whitespace-nowrap flex-shrink-0">
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                {currentPlatform?.label}
                <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Beta</span>
              </h2>
              <p className="text-slate-500 text-xs mt-1">Video Intelligence</p>
            </div>
            <button
              onClick={onTogglePin}
              className={`p-1.5 rounded-lg transition-all duration-200 ease-out ${isPinned ? 'text-blue-500 bg-blue-500/10 scale-105' : 'text-slate-500 hover:text-white hover:bg-slate-700 hover:scale-105'}`}
            >
              <Pin className={`w-4 h-4 transition-transform duration-200 ${isPinned ? 'fill-current rotate-45' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 whitespace-nowrap custom-scrollbar">
            {currentPlatform?.menus.map((section, idx) => (
              <div key={idx} className="mb-8">
                <h3 className="text-xs font-semibold text-slate-500 mb-4 px-2 tracking-wider">{section.section}</h3>
                <div className="space-y-1">
                  {section.items.map((item: any) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-out text-sm font-medium
                                             ${isActive
                            ? 'text-white bg-slate-800 shadow-lg shadow-slate-900/20 scale-[1.02]'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 hover:translate-x-1'
                          }`}
                      >
                        <item.icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        `}</style>
      </aside>
      {isDrawerVisible && !isPinned && (
        <div
          className="fixed inset-0 bg-black/10 z-[90]"
          onClick={() => setIsSidebarHovered(false)}
        />
      )}
    </>
  );
}

export default memo(SmartSidebar);
