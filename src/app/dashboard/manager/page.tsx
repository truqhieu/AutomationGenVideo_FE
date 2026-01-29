'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
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
  ChevronUp,
  Search,
  Calendar,
  Filter,
  X,
  User
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import ChannelHashtagStats from './ChannelHashtagStats';

interface PlatformStats {
  platform: string;
  totalChannels: number;
  totalVideos: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  avgEngagementRate: number;
}

interface TrendData {
  date: string;
  likes: number;
  views: number;
  comments: number;
}

interface PlatformTrend {
  platform: string;
  trends: TrendData[];
  likesGrowth: number;
  viewsGrowth: number;
  commentsGrowth: number;
}

interface ManagerDashboard {
  platformStats: PlatformStats[];
  platformTrends: PlatformTrend[];
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
  engagement_rate: number;
  last_synced_at: string | null;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
}

interface UserWithChannels {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  channels: Channel[];
  totalChannels: number;
}

export default function ManagerDashboardPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ManagerDashboard | null>(null);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [userGroups, setUserGroups] = useState<UserWithChannels[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<Record<string, { days: number }>>({});

  useEffect(() => {
    // Check if user is manager
    if (user && user.role !== 'MANAGER' && user.role !== 'ADMIN') {
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
          userRole: channel.user.role,
          channels: [],
          totalChannels: 0,
        });
      }

      const userGroup = userMap.get(userId)!;
      userGroup.channels.push(channel);
      userGroup.totalChannels = userGroup.channels.length;
    });

    return Array.from(userMap.values()).sort((a, b) => 
      b.totalChannels - a.totalChannels
    );
  };

  const toggleUser = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    switch (platformLower) {
      case 'tiktok':
        return <Music2 className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'facebook':
        return <FacebookIcon className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    const platformLower = platform.toLowerCase();
    switch (platformLower) {
      case 'tiktok':
        return {
          bg: 'bg-black',
          text: 'text-white',
          border: 'border-black',
          light: 'bg-slate-100',
          accent: 'text-slate-900',
        };
      case 'instagram':
        return {
          bg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500',
          text: 'text-white',
          border: 'border-pink-500',
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

  const GrowthBadge = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
        isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(value).toFixed(1)}%
      </div>
    );
  };

  // Generate trend data for individual channel based on date range
  const generateChannelTrend = (channel: Channel, days: number = 7): TrendData[] => {
    const trends: TrendData[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayFactor = (days - i) / days;
      const randomFactor = 0.85 + Math.random() * 0.3;
      
      trends.push({
        date: date.toISOString().split('T')[0],
        likes: Math.floor(channel.total_likes * dayFactor * randomFactor / days),
        views: Math.floor(channel.total_views * dayFactor * randomFactor / days),
        comments: Math.floor((channel.total_likes * 0.05) * dayFactor * randomFactor / days),
      });
    }
    
    return trends;
  };

  const calculateGrowth = (trends: TrendData[], metric: 'likes' | 'views' | 'comments'): number => {
    if (trends.length < 2) return 0;
    
    const latest = trends[trends.length - 1][metric];
    const previous = trends[trends.length - 2][metric];
    
    if (previous === 0) return latest > 0 ? 100 : 0;
    return ((latest - previous) / previous) * 100;
  };

  // Filter users based on global search
  const filterUsers = (users: UserWithChannels[]) => {
    if (!globalSearchQuery.trim()) return users;
    
    const query = globalSearchQuery.toLowerCase();
    return users.filter(userGroup => 
      userGroup.userName.toLowerCase().includes(query) ||
      userGroup.userEmail.toLowerCase().includes(query) ||
      userGroup.channels.some(ch => 
        ch.username.toLowerCase().includes(query) ||
        (ch.display_name && ch.display_name.toLowerCase().includes(query))
      )
    );
  };

  // Get date range for a user
  const getDateRangeForUser = (userId: string): number => {
    return dateRange[userId]?.days || 7;
  };

  // Set date range for a user
  const setDateRangeForUser = (userId: string, days: number) => {
    setDateRange(prev => ({
      ...prev,
      [userId]: { days }
    }));
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
        <div className="text-center">
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

  const filteredUsers = filterUsers(userGroups);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with Search */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Tổng Quan</h1>
            <p className="text-blue-100">Xin chào, {user?.full_name}! Quản lý tất cả người dùng và kênh của họ.</p>
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
            placeholder="Tìm kiếm theo tên user, email hoặc tên kênh..."
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

      {/* User Cards with Expandable Channels */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Danh Sách Users</h2>
          <p className="text-sm text-slate-600">
            {filteredUsers.length} / {userGroups.length} users
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">
              {globalSearchQuery 
                ? 'Không tìm thấy user nào phù hợp'
                : 'Chưa có user nào'
              }
            </p>
          </div>
        ) : (
          filteredUsers.map((userGroup) => {
            const isExpanded = expandedUser === userGroup.userId;
            const selectedDays = getDateRangeForUser(userGroup.userId);

            // Group channels by platform
            const channelsByPlatform = userGroup.channels.reduce((acc, channel) => {
              if (!acc[channel.platform]) {
                acc[channel.platform] = [];
              }
              acc[channel.platform].push(channel);
              return acc;
            }, {} as Record<string, Channel[]>);

            return (
              <div key={userGroup.userId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* User Header - Clickable */}
                <button
                  onClick={() => toggleUser(userGroup.userId)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {userGroup.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-slate-900">
                        {userGroup.userName}
                      </h3>
                      <p className="text-sm text-slate-600">{userGroup.userEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* User Stats */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center px-4 py-2 bg-slate-100 rounded-lg">
                        <p className="text-xs text-slate-600">Role</p>
                        <p className="text-sm font-bold text-slate-900">{userGroup.userRole}</p>
                      </div>
                      <div className="text-center px-4 py-2 bg-blue-100 rounded-lg">
                        <p className="text-xs text-slate-600">Channels</p>
                        <p className="text-sm font-bold text-blue-900">{userGroup.totalChannels}</p>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-6 h-6 text-slate-400" />
                    </div>
                  </div>
                </button>

                {/* Expanded Channels List */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 p-6">
                    {/* Date Range Filter */}
                    <div className="mb-6 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-700">Khoảng thời gian:</span>
                      <div className="flex gap-2">
                        {[7, 14, 30, 90].map((days) => (
                          <button
                            key={days}
                            onClick={() => setDateRangeForUser(userGroup.userId, days)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedDays === days
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {days} ngày
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Channels grouped by platform */}
                    <div className="space-y-6">
                      {Object.entries(channelsByPlatform).map(([platform, channels]) => {
                        const colors = getPlatformColor(platform);

                        return (
                          <div key={platform}>
                            {/* Platform Header */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center ${colors.text}`}>
                                {getPlatformIcon(platform)}
                              </div>
                              <h4 className="text-lg font-bold text-slate-900 capitalize">
                                {platform.toLowerCase()}
                              </h4>
                              <span className="text-sm text-slate-600">
                                ({channels.length} kênh)
                              </span>
                            </div>

                            {/* Channels Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {channels.map((channel) => {
                                const channelTrends = generateChannelTrend(channel, selectedDays);
                                const likesGrowth = calculateGrowth(channelTrends, 'likes');
                                const viewsGrowth = calculateGrowth(channelTrends, 'views');

                                return (
                                  <div key={channel.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                    {/* Channel Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                      {channel.avatar_url ? (
                                        <img 
                                          src={channel.avatar_url} 
                                          alt={channel.display_name || channel.username}
                                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                                        />
                                      ) : (
                                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                                          <Users className="w-6 h-6 text-slate-400" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-slate-900 truncate">
                                          {channel.display_name || channel.username}
                                        </h5>
                                        <p className="text-xs text-slate-500">@{channel.username}</p>
                                      </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                      <div className={`${colors.light} rounded-lg p-2 text-center`}>
                                        <p className="text-xs text-slate-600">Followers</p>
                                        <p className="text-sm font-bold text-slate-900">{formatNumber(channel.total_followers || 0)}</p>
                                      </div>
                                      <div className={`${colors.light} rounded-lg p-2 text-center`}>
                                        <p className="text-xs text-slate-600">Videos</p>
                                        <p className="text-sm font-bold text-slate-900">{channel.total_videos}</p>
                                      </div>
                                      <div className={`${colors.light} rounded-lg p-2 text-center`}>
                                        <p className="text-xs text-slate-600">Engagement</p>
                                        <p className="text-sm font-bold text-slate-900">{channel.engagement_rate.toFixed(1)}%</p>
                                      </div>
                                    </div>

                                    {/* Trend Chart */}
                                    <div className="mb-3">
                                      <p className="text-xs font-semibold text-slate-700 mb-2">
                                        Xu hướng {selectedDays} ngày
                                      </p>
                                      <ResponsiveContainer width="100%" height={120}>
                                        <AreaChart data={channelTrends}>
                                          <defs>
                                            <linearGradient id={`gradient-${channel.id}`} x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                          <XAxis 
                                            dataKey="date" 
                                            stroke="#94a3b8"
                                            tick={{ fontSize: 9 }}
                                            tickFormatter={(value) => {
                                              const date = new Date(value);
                                              return `${date.getMonth() + 1}/${date.getDate()}`;
                                            }}
                                          />
                                          <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickFormatter={formatNumber} />
                                          <Tooltip 
                                            contentStyle={{ 
                                              backgroundColor: 'white', 
                                              border: '1px solid #e2e8f0',
                                              borderRadius: '8px',
                                              fontSize: '10px'
                                            }}
                                            formatter={(value: any) => formatNumber(Number(value))}
                                          />
                                          <Area 
                                            type="monotone" 
                                            dataKey="views" 
                                            stroke="#3b82f6" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill={`url(#gradient-${channel.id})`}
                                            name="Views"
                                          />
                                        </AreaChart>
                                      </ResponsiveContainer>
                                    </div>

                                    {/* Growth Indicators */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mb-4">
                                      <div className="flex items-center gap-1">
                                        <Heart className="w-3 h-3 text-red-500" />
                                        <span className="text-xs text-slate-600">Likes:</span>
                                        <GrowthBadge value={likesGrowth} />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Eye className="w-3 h-3 text-blue-500" />
                                        <span className="text-xs text-slate-600">Views:</span>
                                        <GrowthBadge value={viewsGrowth} />
                                      </div>
                                    </div>

                                    {/* Hashtag Statistics */}
                                    <ChannelHashtagStats 
                                      channelId={channel.id} 
                                      channelUsername={channel.username}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
