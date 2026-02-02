'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, Eye, Heart, Users, ArrowRight, X, Loader, Video, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface ChannelProfile {
  username: string;
  display_name: string;
  avatar_url: string;
  platform: string;
  total_followers?: number;
  total_likes: number;
  total_views: number;
  total_videos: number;
  engagement: number;
  engagement_rate: number;
  video_count: number;
  description?: string;
  id?: string;
}

export default function TrackedChannelsPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState('tiktok');
  const [channels, setChannels] = useState<ChannelProfile[]>([]);
  
  // Add Channel Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [searchChannelQuery, setSearchChannelQuery] = useState('');

  // Fetch tracked channels on mount
  useEffect(() => {
    fetchTrackedChannels();
  }, []);

  const fetchTrackedChannels = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      // Using the NestJS endpoint with platform filter to separate lists
      const response = await fetch(`${apiUrl}/tracked-channels?platform=${platform.toUpperCase()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        // Token expired or invalid (e.g. after DB reset)
        // console.warn('Session expired. Please login again.');
        // router.push('/login');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setChannels(data);
      }
    } catch (error) {
      console.error('Error fetching tracked channels:', error);
    }
  };

  const fetchChannelProfile = async (username: string) => {
    setLoading(true);
    try {
      // For Instagram: Only fetch profile stats (no posts) to speed up add channel
      // Posts will be fetched when user views analytics
      const maxResults = platform.toLowerCase() === 'instagram' ? 0 : 9999;
      
      const response = await fetch('http://localhost:3000/api/ai/user-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform.toLowerCase(),
          username: username.replace('@', ''),
          max_results: maxResults
        })
      });
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!response.ok) {
        if (response.status === 429) {
          alert('API quota exceeded. Please try again later.');
          return;
        }
        alert(data.error || 'API Error. Please try again.');
        return;
      }
      
      let payload: any = {};
      
      // 1. DATA FROM BACKEND PROFILE (Preferred)
      if (data.profile) {
          console.log('✅ Using Backend Profile Data:', data.profile);
          payload = {
              platform: platform.toUpperCase(),
              username: data.profile.username,
              display_name: data.profile.display_name,
              avatar_url: data.profile.avatar_url,
              total_followers: data.profile.follower_count,
              total_likes: data.profile.total_likes,
              // FIX: If we fetched 0 videos, force total_videos to 0 regardless of metadata
              total_videos: (data.results && data.results.length === 0) ? 0 : (data.profile.total_videos || 0),
              // Calculate specific stats if missing
              total_views: data.profile.total_views || data.results?.reduce((sum: number, v: any) => sum + (v.views_count || 0), 0) || 0,
              engagement_rate: data.profile.engagement_rate || 0
          };
          console.log('✅ Payload prepared with forced check:', payload);
      }
      // 2. FALLBACK: RAW EXTRACTION (If profile missing but results exist)
      else if (data.success && data.results && data.results.length > 0) {
        console.log('⚠️ Profile missing, extracting from first video...');
        const firstVideo = data.results[0];
        const authorMeta = firstVideo.raw_data?.authorMeta || {};
        
        // Use author-level stats from authorMeta
        const totalFollowers = authorMeta.fans || 0;
        const totalLikes = authorMeta.heart || 0;
        const totalVideos = data.results.length === 0 ? 0 : (authorMeta.video || data.results.length);
        
        // Sum views from fetched videos (no total_views in authorMeta)
        const totalViews = data.results.reduce((sum: number, v: any) => sum + (v.views_count || 0), 0);
        
        // Calculate engagement rate
        const engagementRate = totalFollowers > 0 
          ? (totalLikes / totalFollowers) * 100 
          : 0;

        payload = {
          platform: platform.toUpperCase(),
          username: username.replace('@', ''),
          display_name: authorMeta.nickName || firstVideo.author_name || username,
          avatar_url: authorMeta.avatar || firstVideo.thumbnail_url,
          total_followers: totalFollowers,
          total_likes: totalLikes,
          total_views: totalViews,
          total_videos: totalVideos,
          engagement_rate: parseFloat(engagementRate.toFixed(2))
        };
      } else {
        alert(data.error || 'Channel not found or no data available. Please check the username.');
        setLoading(false);
        return;
      }

      // Save to Backend
      console.log('💾 Saving Channel Payload:', payload);
      const token = localStorage.getItem('auth_token');
      const saveResponse = await fetch('http://localhost:3000/api/tracked-channels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
      });

      if (saveResponse.status === 401) {
          // Token expired
          return;
      }

      if (saveResponse.ok) {
          await fetchTrackedChannels();
          setShowAddModal(false);
          setUsernameInput('');
      } else {
          const errorData = await saveResponse.json();
          alert(errorData.message || 'Failed to save channel');
      }
    } catch (error) {
      console.error('Error fetching channel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again later.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = () => {
    if (!usernameInput.trim()) return;
    
    let username = usernameInput.trim();
    // Auto-add @ if not present
    if (!username.startsWith('@')) {
      username = '@' + username;
    }
    
    fetchChannelProfile(username);
  };

  const handleRefreshChannel = async (channel: ChannelProfile) => {
    // Add to refreshing set
    setRefreshingIds(prev => new Set(prev).add(channel.username));
    
    try {
        // Reuse the fetchChannelProfile logic but adapted for update
        await fetchChannelProfile(channel.username);
        
        // After success, remove from refreshing set
        setRefreshingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(channel.username);
            return newSet;
        });
    } catch (error) {
        console.error("Refresh failed", error);
        setRefreshingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(channel.username);
            return newSet;
        });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(3) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(3) + 'K';
    return num.toString();
  };

  // Helper to get proxied avatar URL for Instagram (bypass CORS/expiry)
  const getAvatarUrl = (channel: ChannelProfile) => {
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.display_name)}&background=random&color=fff`;
    
    if (!channel.avatar_url) {
      console.log(`⚠️ No avatar_url for ${channel.username}, using fallback`);
      return fallbackUrl;
    }
    
    // If it's an Instagram CDN URL, proxy it through our backend
    if (channel.platform?.toUpperCase() === 'INSTAGRAM' && 
        (channel.avatar_url.includes('cdninstagram.com') || channel.avatar_url.includes('instagram.com'))) {
      const proxiedUrl = `http://localhost:3000/api/ai/proxy/avatar?url=${encodeURIComponent(channel.avatar_url)}`;
      console.log(`🔄 Proxying Instagram avatar for ${channel.username}:`, proxiedUrl);
      return proxiedUrl;
    }
    
    console.log(`✅ Using direct avatar URL for ${channel.username}:`, channel.avatar_url);
    return channel.avatar_url;
  };

  const platformName = platform === 'tiktok' ? 'TikTok' : platform === 'instagram' ? 'Instagram' : platform;

  const filteredChannels = channels.filter(c =>
    c.username.toLowerCase().includes(searchChannelQuery.toLowerCase()) ||
    (c.display_name && c.display_name.toLowerCase().includes(searchChannelQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-7xl py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-2xl">
                🎵
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{platformName} Analytics</h1>
                <p className="text-slate-500">Monitor and track your {platformName} channel performance</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-black hover:bg-slate-800 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Channel
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-7xl pt-8">
        {/* Stats Bar */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-indigo-600" />
                <span className="text-2xl font-bold text-slate-900">{channels.length}</span>
                <span className="text-slate-500">Channel{channels.length !== 1 ? 's' : ''}</span>
              </div>
              <p className="text-sm text-slate-400">Total tracking accounts</p>
            </div>
            
            {/* Search Channels */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search your channels..."
                value={searchChannelQuery}
                onChange={(e) => setSearchChannelQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Channels Grid */}
        {filteredChannels.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No channels yet</h3>
            <p className="text-slate-500 mb-6">Click "+ Add Channel" to start tracking your first channel</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredChannels.map((channel, idx) => (
              <motion.div
                key={`${channel.username}-${channel.platform}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all"
              >
                {/* Header: Avatar & Name */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <img 
                      src={getAvatarUrl(channel)} 
                      alt={channel.display_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
                      onError={(e) => {
                        // Fallback if the proxied avatar also fails
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.display_name)}&background=random&color=fff`;
                      }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-black rounded-full flex items-center justify-center text-[10px] border-2 border-white">
                      🎵
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 truncate text-sm">{channel.display_name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 truncate">@{channel.username}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRefreshChannel(channel);
                    }}
                    disabled={refreshingIds.has(channel.username) || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${refreshingIds.has(channel.username) ? 'animate-spin' : ''}`} />
                    {refreshingIds.has(channel.username) ? 'Updating...' : 'Update'}
                  </button>
                </div>

                {/* Followers Section with Chart */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="uppercase font-semibold">FOLLOWERS</span>
                      </div>
                      <p 
                        className="text-2xl font-bold text-slate-900 cursor-help" 
                        title="Followers count"
                      >
                        {formatNumber(channel.total_followers || 0)}
                      </p>
                    </div>  
                    <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-semibold">
                      Live
                    </div>
                  </div>
                  
                  {/* Simple Line Chart (Visual placeholder since we only have one data point for history currently) */}
                  <div className="h-16 relative">
                    <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`gradient-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,35 L 40,32 L 80,28 L 120,25 L 160,20 L 200,15"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      <path
                        d="M 0,35 L 40,32 L 80,28 L 120,25 L 160,20 L 200,15 L 200,40 L 0,40 Z"
                        fill={`url(#gradient-${idx})`}
                      />
                    </svg>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Video className="w-3.5 h-3.5 text-purple-500" />
                      <span className="uppercase font-medium text-slate-400">VIDEOS</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{channel.total_videos?.toLocaleString() || 0}</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Heart className="w-3.5 h-3.5 text-red-500" />
                      <span className="uppercase font-medium text-slate-400">LIKES</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {formatNumber(typeof channel.total_likes === 'string' ? parseInt(channel.total_likes) : channel.total_likes || 0)}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Eye className="w-3.5 h-3.5 text-teal-500" />
                      <span className="uppercase font-medium text-slate-400">TOTAL VIEWS</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{formatNumber(channel.total_views || 0)}</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                      <span className="uppercase font-medium text-slate-400">ENG. RATE</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {channel.engagement_rate?.toFixed(2) || '0.00'}%
                    </p>
                  </div>
                </div>

                {/* View Dashboard Button */}
                <button
                  onClick={() => router.push(`/dashboard/ai/analytics/${channel.username}?platform=${channel.platform}`)}
                  className="w-full py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group"
                >
                  View Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Channel Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !loading && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Add New Channel</h2>
                <button
                  onClick={() => !loading && setShowAddModal(false)}
                  disabled={loading}
                  className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {platformName} Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddChannel()}
                    placeholder="username"
                    disabled={loading}
                    className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Enter the username without @ symbol
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                  className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddChannel}
                  disabled={loading || !usernameInput.trim()}
                  className="flex-1 py-3 bg-black hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Channel
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
