'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Radio, 
  Settings, 
  LogOut, 
  Facebook,
  Music2, // Using as TikTok placeholder
  LayoutGrid,
  CreditCard,
  HelpCircle,
  Pin,
  FileText,
  Film
} from 'lucide-react';

interface SidebarProps {
  menuItems?: any[]; // Legacy props, we might ignore or map them
  user: any;
  onLogout: () => void;
}

export default function SmartSidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [activePlatform, setActivePlatform] = useState<string>('facebook'); // Default to Facebook as it is the dashboard home
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Definitions of Platforms and their Sub-menus
  const platforms = [
    { 
        id: 'facebook', 
        icon: Facebook, 
        label: 'Facebook',
        menus: [
            {
                section: 'MANAGEMENT',
                items: [
                    { label: 'Channel Overview', href: '/dashboard/facebook/channels', icon: LayoutGrid },
                    { label: 'Search Post', href: '/dashboard/facebook/search-post', icon: FileText },
                    { label: 'Search Reel', href: '/dashboard/facebook/search-reel', icon: Film },
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
    }
  ];

  // Auto-detect active platform based on URL
  useEffect(() => {
    if (pathname.startsWith('/dashboard/facebook') || pathname === '/dashboard') {
        setActivePlatform('facebook');
    } else if (pathname.startsWith('/dashboard/ai')) {
        setActivePlatform('tiktok');
    }
  }, [pathname]);

  const currentPlatform = platforms.find(p => p.id === activePlatform);

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsSidebarHovered(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsSidebarHovered(false);
    }, 300); // 300ms delay for smoother experience
    setHoverTimeout(timeout);
  };

  return (
    <aside 
        className="fixed top-0 left-0 h-screen z-[100] flex" 
        onMouseLeave={handleMouseLeave}
    >
      
      {/* 1. ICON DOCK (Leftmost Strip) - Always 80px */}
      <div 
        className="w-[80px] h-full bg-[#0f172a] border-r border-slate-800 flex flex-col items-center py-6 gap-6 z-20 relative"
        onMouseEnter={handleMouseEnter}
      >
        
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl overflow-hidden mb-4 cursor-pointer border-2 border-slate-700 shadow-lg relative group">
             <img src="/logo-vcb.jfif" alt="VCB" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
        </div>

        {/* Platforms */}
        <div className="flex-1 flex flex-col gap-4 w-full px-4">
            {platforms.map(p => (
                <button 
                    key={p.id}
                    onClick={() => setActivePlatform(p.id)}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 group relative
                        ${activePlatform === p.id 
                            ? 'bg-blue-600/10 text-blue-500 ring-2 ring-blue-500/50' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <p.icon className="w-6 h-6" />
                </button>
            ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4 w-full px-4 mt-auto">
             <button className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white">
                <CreditCard className="w-5 h-5" />
             </button>
             <button className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white">
                <Settings className="w-5 h-5" />
             </button>
             <button className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white">
                <HelpCircle className="w-5 h-5" />
             </button>
             <button onClick={onLogout} className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-900/20 hover:text-red-500 mt-2">
                <LogOut className="w-5 h-5" />
             </button>
        </div>
      </div>

      {/* 2. SUB-MENU DRAWER (Right Panel) - Visible on Hover */}
      <div className={`w-[240px] h-full bg-[#0b1121] border-r border-slate-800 flex flex-col transition-all duration-300 transform origin-left 
          ${(activePlatform && isSidebarHovered) ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 w-0 overflow-hidden'}`
      }>
           
           {/* Header */}
           <div className="h-20 flex items-center px-6 border-b border-slate-800 whitespace-nowrap overflow-hidden">
               <div>
                   <h2 className="text-white font-bold text-lg flex items-center gap-2">
                       {currentPlatform?.label}
                       <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Beta</span>
                   </h2>
                   <p className="text-slate-500 text-xs mt-1">Video Intelligence</p>
               </div>
           </div>

           {/* Menu Items */}
           <div className="flex-1 overflow-y-auto py-6 px-4 whitespace-nowrap">
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
                                       className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                                           ${isActive 
                                               ? 'text-white bg-slate-800' 
                                               : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                           }`}
                                   >
                                       <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                                       {item.label}
                                   </Link>
                               )
                           })}
                       </div>
                   </div>
               ))}
               
               {/* Coming Soon / Upsell */}
               <div className="mt-10 px-4 py-8 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center text-center">
                   <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                       <Pin className="w-5 h-5 text-slate-500" />
                   </div>
                   <p className="text-slate-400 text-sm">More features coming soon</p>
               </div>
           </div>
      </div>

    </aside>
  );
}
