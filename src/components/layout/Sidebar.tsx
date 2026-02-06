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
  Music2, // Using as TikTok placeholder
  Music, // Using as Douyin icon
  LayoutGrid,
  CreditCard,
  HelpCircle,
  Pin,
  FileText,
  Film,
  Users,
  Activity,
  Mic,
  Video,
  BookOpen, // Xiaohongshu icon
  Volume2
} from 'lucide-react';



interface SidebarProps {
  menuItems?: any[]; // Legacy props, we might ignore or map them
  user: any;
  onLogout: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

function SmartSidebar({ user, onLogout, isPinned, onTogglePin }: SidebarProps) {
  const pathname = usePathname();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Directly derive activePlatform from pathname for instant updates
  const activePlatform = useMemo(() => {
    if (pathname.startsWith('/dashboard/manager') || pathname.startsWith('/dashboard/editor-management')) {
      return 'user-management';
    } else if (pathname.startsWith('/dashboard/ai/lipsync')) {
      return 'ai-studio';
    } else if (pathname.startsWith('/dashboard/ai')) {
      return 'tiktok';
    } else if (pathname.startsWith('/dashboard/instagram')) {
      return 'instagram';
    } else if (pathname.startsWith('/dashboard/douyin')) {
      return 'douyin';
    } else if (pathname.startsWith('/dashboard/xiaohongshu')) {
      return 'xiaohongshu';
    } else if (pathname.startsWith('/dashboard/facebook') || pathname === '/dashboard') {
      return 'facebook';
    }
    return 'facebook'; // Default fallback
  }, [pathname]);

  // Memoize platforms configuration to prevent re-creation on every render
  const platforms = useMemo(() => [
    ...(user?.role === 'MANAGER' || user?.role === 'ADMIN' ? [{
      id: 'user-management',
      icon: Users,
      label: 'Quản lý người dùng',
      menus: [
        {
          section: 'MANAGEMENT',
          items: [
            { label: 'Dashboard Tổng', href: '/dashboard/manager', icon: LayoutGrid },
            { label: 'Theo dõi hoạt động người dùng', href: '/dashboard/manager/user-activity', icon: Activity },
            { label: 'Quản lý Editors', href: '/dashboard/editor-management', icon: Users },
          ]
        }
      ]
    }] : []),
    ...(user?.role !== 'MANAGER' && user?.role !== 'ADMIN' ? [
      {
        id: 'facebook',
        icon: Facebook,
        label: 'Facebook',
        menus: [
          {
            section: 'MANAGEMENT',
            items: [
              { label: 'Channel Overview', href: '/dashboard/facebook/channels', icon: LayoutGrid },
              /* TEMPORARILY DISABLED due to Facebook blocking anonymous search
             { label: 'Search Post', href: '/dashboard/facebook/search-post', icon: FileText },
             { label: 'Search Reel', href: '/dashboard/facebook/search-reel', icon: Film },
             */
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
            section: 'SEARCH',
            items: [
              { label: 'Search Posts', href: '/dashboard/instagram/search', icon: Search },
              { label: 'Search Reels', href: '/dashboard/instagram/search-reel', icon: Film },
            ]
          },
          {
            section: 'MANAGEMENT',
            items: [
              { label: 'Channel Overview', href: '/dashboard/instagram/channels', icon: LayoutGrid },
            ]
          }
        ]
      },
      {
        id: 'tiktok',
        icon: Music2, // TikTok
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
            section: 'RESEARCH',
            items: [
              { label: 'Search Videos', href: '/dashboard/douyin', icon: Search },
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
            section: 'RESEARCH',
            items: [
              { label: 'Search Notes', href: '/dashboard/xiaohongshu', icon: Search },
            ]
          }
        ]
      },
      {
        id: 'ai-studio',
        icon: Mic,
        label: 'AI Studio',
        menus: [
          {
            section: 'CREATION TOOLS',
            items: [
              { label: 'Motion Control (Lipsync)', href: '/dashboard/ai/lipsync', icon: Video },
            ]
          }
        ]
      }
    ] : [])
  ], [user?.role]); // Dependency on primitive string ensures stability

  const currentPlatform = useMemo(() => platforms.find(p => p.id === activePlatform), [platforms, activePlatform]);

  // Optimized hover handlers with useCallback
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsSidebarHovered(true);
  }, [hoverTimeout]);

  const handleMouseLeave = useCallback(() => {
    const timeout = setTimeout(() => {
      setIsSidebarHovered(false);
    }, 200); // Reduced from 300ms for snappier feel
    setHoverTimeout(timeout);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [hoverTimeout]);

  const isDrawerVisible = activePlatform && (isSidebarHovered || isPinned);
  const transitionDuration = prefersReducedMotion ? '0ms' : '250ms';

  return (
    <aside
      className="fixed top-0 left-0 h-screen z-[100] flex"
      onMouseLeave={handleMouseLeave}
      style={{
        contain: 'layout style paint', // CSS containment for better performance
      }}
    >

      {/* 1. ICON DOCK (Leftmost Strip) - Always 80px */}
      <div
        className="w-[80px] h-full bg-[#0f172a] border-r border-slate-800 flex flex-col items-center py-6 gap-6 z-20 relative"
        onMouseEnter={handleMouseEnter}
        style={{
          willChange: 'auto', // Let browser optimize
        }}
      >

        {/* Logo */}
        <div className="w-12 h-12 rounded-xl overflow-hidden mb-4 cursor-pointer border-2 border-slate-700 shadow-lg relative group">
          <img
            src="/logo-vcb.jfif"
            alt="VCB"
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            loading="eager"
          />
        </div>

        {/* Platforms */}
        <div className="flex-1 flex flex-col gap-4 w-full px-4">
          {platforms.map(p => (
            <Link
              key={p.id}
              // If clicking the platform icon, navigate to the first item of the first menu
              href={p.menus?.[0]?.items?.[0]?.href || '#'}
              prefetch={true}
              className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ease-out group relative
                        ${activePlatform === p.id
                  ? 'bg-blue-600/10 text-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-105'
                }`}
              style={{
                willChange: activePlatform === p.id ? 'auto' : 'transform',
              }}
            >
              <p.icon className="w-6 h-6 transition-transform duration-200 ease-out group-hover:scale-110" />

              {/* Active indicator */}
              {activePlatform === p.id && (
                <div
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
                  style={{
                    animation: prefersReducedMotion ? 'none' : 'slideIn 200ms ease-out',
                  }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4 w-full px-4 mt-auto">
          <button className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 ease-out hover:scale-105">
            <CreditCard className="w-5 h-5" />
          </button>
          <button className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 ease-out hover:scale-105">
            <Settings className="w-5 h-5" />
          </button>
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

      {/* 2. SUB-MENU DRAWER (Right Panel) - Visible on Hover */}
      <div
        className={`h-full bg-[#0b1121] border-r border-slate-800 flex flex-col overflow-hidden`}
        style={{
          width: isDrawerVisible ? '240px' : '0px',
          opacity: isDrawerVisible ? 1 : 0,
          transform: isDrawerVisible ? 'translate3d(0, 0, 0)' : 'translate3d(-5%, 0, 0)', // Reduced translation distance for faster feel
          transition: prefersReducedMotion
            ? 'none'
            : `all ${prefersReducedMotion ? '0ms' : '200ms'} cubic-bezier(0.25, 0.46, 0.45, 0.94)`, // Faster cubic-bezier
          willChange: isDrawerVisible ? 'width, opacity, transform' : 'auto',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
        }}
      >

        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800 whitespace-nowrap flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              {currentPlatform?.label}
              <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Beta</span>
            </h2>
            <p className="text-slate-500 text-xs mt-1">Video Intelligence</p>
          </div>

          {/* Pin/Unpin Button */}
          <button
            onClick={onTogglePin}
            className={`p-1.5 rounded-lg transition-all duration-200 ease-out ${isPinned ? 'text-blue-500 bg-blue-500/10 scale-105' : 'text-slate-500 hover:text-white hover:bg-slate-700 hover:scale-105'}`}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar to push content"}
          >
            <Pin className={`w-4 h-4 transition-transform duration-200 ${isPinned ? 'fill-current rotate-45' : ''}`} />
          </button>
        </div>

        {/* Menu Items */}
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-out text-sm font-medium
                                           ${isActive
                          ? 'text-white bg-slate-800 shadow-lg shadow-slate-900/20 scale-[1.02]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50 hover:translate-x-1'
                        }`}
                      style={{
                        willChange: isActive ? 'auto' : 'transform',
                      }}
                    >
                      <item.icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Coming Soon / Upsell */}
          <div className="mt-10 px-4 py-8 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center text-center transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/20">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Pin className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">More features coming soon</p>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

    </aside>
  );
}

export default memo(SmartSidebar);
