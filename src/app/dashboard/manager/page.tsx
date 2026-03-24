'use client';

import Image from "next/image";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/auth';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Video,
  Heart,
  Eye,
  MessageCircle,
  Activity,
  Music2,
  Instagram,
  Facebook as FacebookIcon,
  ChevronDown,
  Search,
  X
} from 'lucide-react';

interface PlatformStats {
  platform: string;
  totalChannels: number;
  totalVideos: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  avgEngagementRate: number;
}

interface ManagerDashboard {
  platformStats: PlatformStats[];
  totalChannelsAcrossAllPlatforms: number;
  totalVideosAcrossAllPlatforms: number;
}

interface Channel {
  id: string;
  platform: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_followers: number | null;
  total_likes: number;
  total_views: number;
  total_videos: number;
  posts_count: number | null;
  engagement_rate: number;
  last_synced_at: string | null;
  user: {
    id: string;
    email: string;
    full_name: string;
    roles: string[];
  };
}

interface UserWithChannels {
  userId: string;
  userName: string;
  userEmail: string;
  userRoles: string[];
  channels: Channel[];
  totalChannels: number;
}

export default function ManagerDashboardPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ManagerDashboard | null>(null);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [userGroups, setUserGroups] = useState<UserWithChannels[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // NEW: Load more states for each platform
  const [loadMoreLimits, setLoadMoreLimits] = useState<Record<string, number>>({
    'TIKTOK': 6,
    'INSTAGRAM': 6,
    'FACEBOOK': 6,
    'DOUYIN': 6
  });

  useEffect(() => {
    // Check if user is manager
    const roles = user?.roles || [];
    if (user && !roles.includes(UserRole.MANAGER) && !roles.includes(UserRole.ADMIN)) {
      router.push('/dashboard/ai');
      return;
    }

    fetchDashboard();
    fetchAllChannels();
  }, [user, token]);

  const fetchDashboard = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracked-channels/manager/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllChannels = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tracked-channels/manager/all-channels`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }

      const data: Channel[] = await response.json();

      // Debug: Log first Instagram channel
      const firstInsta = data.find(ch => ch.platform === 'INSTAGRAM');
      if (firstInsta) {
        console.log('[Manager] Sample Instagram channel:', {
          username: firstInsta.username,
          posts_count: firstInsta.posts_count,
          total_videos: firstInsta.total_videos,
        });
      }

      setAllChannels(data);

      // Group channels by user
      const grouped = groupChannelsByUser(data);
      setUserGroups(grouped);
    } catch (err) {
      console.error('Failed to fetch all channels:', err);
    }
  };

  const groupChannelsByUser = (channels: Channel[]): UserWithChannels[] => {
    const userMap = new Map<string, UserWithChannels>();

    channels.forEach(channel => {
      const userId = channel.user.id;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId: userId,
          userName: channel.user.full_name,
          userEmail: channel.user.email,
          userRoles: channel.user.roles,
          channels: [],
          totalChannels: 0,
        });
      }

      const userGroup = userMap.get(userId)!;
      userGroup.channels.push(channel);
      userGroup.totalChannels = userGroup.channels.length;
    });

    return Array.from(userMap.values()).sort((a, b) =>
      a.userName.localeCompare(b.userName)
    );
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getPlatformColors = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
      case 'douyin':
        return {
          bg: 'bg-gradient-to-br from-black via-pink-600 to-cyan-500',
          text: 'text-white',
          border: 'border-pink-600',
          light: 'bg-pink-100',
          accent: 'text-pink-600',
        };
      case 'instagram':
        return {
          bg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500',
          text: 'text-white',
          border: 'border-pink-600',
          light: 'bg-pink-100',
          accent: 'text-pink-600',
        };
      case 'facebook':
        return {
          bg: 'bg-blue-600',
          text: 'text-white',
          border: 'border-blue-600',
          light: 'bg-blue-100',
          accent: 'text-blue-600',
        };
      default:
        return {
          bg: 'bg-slate-600',
          text: 'text-white',
          border: 'border-slate-600',
          light: 'bg-slate-100',
          accent: 'text-slate-600',
        };
    }
  };

  // Filter channels based on global search
  const filterChannels = (channels: Channel[]) => {
    if (!globalSearchQuery.trim()) return channels;

    const query = globalSearchQuery.toLowerCase();
    return channels.filter(ch =>
      ch.username.toLowerCase().includes(query) ||
      (ch.display_name && ch.display_name.toLowerCase().includes(query)) ||
      ch.user.full_name.toLowerCase().includes(query) ||
      ch.user.email.toLowerCase().includes(query)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 font-semibold mb-2">Lỗi tải dữ liệu</p>
          <p className="text-slate-600 text-sm">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const filteredChannels = filterChannels(allChannels);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with Search */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Tổng Quan</h1>
            <p className="text-blue-100">Xin chào, {user?.full_name}! Quản lý tất cả kênh theo platform.</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="font-semibold">{userGroups.length}</span> users
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="font-semibold">{dashboard.totalChannelsAcrossAllPlatforms}</span> kênh
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="font-semibold">{formatNumber(dashboard.totalVideosAcrossAllPlatforms)}</span> videos
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên kênh, user, email..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          {globalSearchQuery && (
            <button
              onClick={() => setGlobalSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* NEW: Platform Grid Layout */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Kênh Theo Platform</h2>
          <p className="text-sm text-slate-600">
            {globalSearchQuery ? `${filteredChannels.length} kết quả` : `Tổng: ${allChannels.length} kênh từ ${userGroups.length} users`}
          </p>
        </div>

        {/* Platform Grid - 2x2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'DOUYIN'].map(platform => {
            const platformChannels = filteredChannels.filter(ch => ch.platform === platform);
            const displayLimit = loadMoreLimits[platform];
            const displayedChannels = platformChannels.slice(0, displayLimit);
            const hasMore = platformChannels.length > displayLimit;
            const colors = getPlatformColors(platform.toLowerCase());

            return (
              <div key={platform} className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 overflow-hidden flex flex-col min-h-[400px]">
                {/* Platform Header */}
                <div className={`${colors.bg} ${colors.text} p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {(platform === 'TIKTOK' || platform === 'DOUYIN') && <Music2 className="w-8 h-8" />}
                      {platform === 'INSTAGRAM' && <Instagram className="w-8 h-8" />}
                      {platform === 'FACEBOOK' && <FacebookIcon className="w-8 h-8" />}
                      <h3 className="text-2xl font-black">{platform}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black">{platformChannels.length}</p>
                      <p className="text-sm opacity-90">kênh</p>
                    </div>
                  </div>
                </div>

                {/* Channels List */}
                <div className="flex-1 overflow-y-auto max-h-[600px] p-4 space-y-3">
                  {displayedChannels.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">
                        {globalSearchQuery ? 'Không tìm thấy kênh nào' : `Chưa có kênh ${platform}`}
                      </p>
                    </div>
                  ) : (
                    displayedChannels.map(channel => (
                      <div
                        key={channel.id}
                        className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors border border-slate-200"
                      >
                        {/* Channel Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <Image
                            src={channel.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.display_name)}&background=random`}
                            alt={channel.display_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.display_name)}&background=random`;
                            }}
                           width={0} height={0} sizes="100vw" unoptimized/>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{channel.display_name}</h4>
                            <p className="text-xs text-slate-500">@{channel.username}</p>
                            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full px-2.5 py-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                              <p className="text-xs font-bold text-blue-900">
                                {channel.user.full_name}
                              </p>
                              <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                {channel.user.roles?.[0] || 'USER'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats - Dynamic by Platform */}
                        {(platform === 'TIKTOK' || platform === 'DOUYIN') ? (
                          // TikTok/Douyin: 4 stats (2x2 grid)
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
                              <p className="text-xs text-slate-600 mb-0.5">Followers</p>
                              <p className="text-sm font-black text-slate-900">{formatNumber(channel.total_followers || 0)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
                              <p className="text-xs text-slate-600 mb-0.5">Videos</p>
                              <p className="text-sm font-black text-slate-900">{formatNumber(channel.total_videos || 0)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
                              <p className="text-xs text-slate-600 mb-0.5 flex items-center justify-center gap-1">
                                <Heart className="w-3 h-3 text-red-500" /> Likes
                              </p>
                              <p className="text-sm font-black text-red-600">{formatNumber(channel.total_likes)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
                              <p className="text-xs text-slate-600 mb-0.5 flex items-center justify-center gap-1">
                                <Eye className="w-3 h-3 text-blue-500" /> Views
                              </p>
                              <p className="text-sm font-black text-blue-600">{formatNumber(channel.total_views)}</p>
                            </div>
                          </div>
                        ) : platform === 'INSTAGRAM' ? (
                          // Instagram: 2 stats only (Followers + Posts)
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
                              <p className="text-xs text-slate-600 mb-0.5">Followers</p>
                              <p className="text-sm font-black text-slate-900">{formatNumber(channel.total_followers || 0)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
                              <p className="text-xs text-slate-600 mb-0.5">Posts</p>
                              <p className="text-sm font-black text-slate-900">{formatNumber(channel.posts_count || channel.total_videos || 0)}</p>
                            </div>
                          </div>
                        ) : platform === 'FACEBOOK' ? (
                          // Facebook: 1 stat only (Followers)
                          <div className="mb-2">
                            <div className="bg-white rounded-xl p-4 text-center border-2 border-slate-200">
                              <p className="text-xs text-slate-600 mb-1 font-semibold">Followers</p>
                              <p className="text-2xl font-black text-slate-900">{formatNumber(channel.total_followers || 0)}</p>
                            </div>
                          </div>
                        ) : (
                          // Other platforms: 3 stats
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
                              <p className="text-xs text-slate-600 mb-0.5">Followers</p>
                              <p className="text-sm font-black text-slate-900">{formatNumber(channel.total_followers || 0)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
                              <p className="text-xs text-slate-600 mb-0.5">Posts</p>
                              <p className="text-sm font-black text-slate-900">{formatNumber(channel.posts_count || channel.total_videos || 0)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
                              <p className="text-xs text-slate-600 mb-0.5">Engage</p>
                              <p className="text-sm font-black text-green-600">{channel.engagement_rate.toFixed(1)}%</p>
                            </div>
                          </div>
                        )}

                        {/* Bottom Info: Last Sync */}
                        <div className="pt-2 border-t border-slate-200 text-xs text-center text-slate-400">
                          {channel.last_synced_at ? `Sync: ${new Date(channel.last_synced_at).toLocaleDateString('vi-VN')}` : 'Chưa sync'}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <button
                      onClick={() => setLoadMoreLimits(prev => ({
                        ...prev,
                        [platform]: prev[platform] + 6
                      }))}
                      className="w-full py-3 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronDown className="w-5 h-5" />
                      Xem thêm {Math.min(6, platformChannels.length - displayLimit)} kênh
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
