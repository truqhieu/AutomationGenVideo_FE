'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, Eye, Heart, Users, ArrowRight, X, Loader2, Video, RotateCcw, Instagram as InstagramIcon, MessageCircle, Share2, Link as LinkIcon, BarChart3, Camera } from 'lucide-react';
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
  total_posts?: number;
  engagement: number;
  engagement_rate: number;
  video_count: number;
  description?: string;
  id?: string;
}

export default function InstagramChannelsPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<ChannelProfile[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Add Channel Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [searchChannelQuery, setSearchChannelQuery] = useState('');

  // Fetch tracked channels on mount
  useEffect(() => {
    fetchTrackedChannels();
  }, []);

  const fetchTrackedChannels = async () => {
    try {
      setLoadingInitial(true);
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/tracked-channels/my-channels?platform=INSTAGRAM`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        return; // Handle auth redirect globally or here
      }
      
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []); 
      }
    } catch (error) {
      console.error('Error fetching tracked channels:', error);
    } finally {
      setLoadingInitial(false);
    }
  };

  const extractInstagramUsername = (input: string): string => {
      let clean = input.trim();
      // Remove @ if present
      clean = clean.replace('@', '');
      
      // Remove trailing slash
      if (clean.endsWith('/')) clean = clean.slice(0, -1);
      
      try {
          if (clean.includes('instagram.com')) {
              const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
              
              // Handle /username or /p/postid
              const pathParts = url.pathname.split('/').filter(p => p && p !== 'p' && p !== 'reel');
              if (pathParts.length > 0) {
                  return pathParts[0]; 
              }
          }
      } catch (e) {
         // ignore
      }
      return clean;
  };

  const fetchChannelProfile = async (input: string) => {
    setProcessing(true);
    const username = extractInstagramUsername(input);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    try {
      // Call Backend to Analyze/Scan Channel
      const response = await fetch(`${apiUrl}/ai/user-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          username: username,
          max_results: 20 // Fetch sample posts for profile info
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Không thể tìm thấy tài khoản Instagram này. Vui lòng kiểm tra lại username.');
        setProcessing(false);
        return;
      }
      
      let payload: any = {};
      
      // Extract Data for Saving
      if (data.profile) {
           // Map Instagram profile fields from AI service response
           payload = {
              platform: 'INSTAGRAM',
              username: data.profile.username || username,
              display_name: data.profile.display_name || data.profile.fullName || username,
              avatar_url: data.profile.avatar_url || data.profile.profilePicUrl || '',
              // AI service returns: follower_count, total_posts, total_likes, total_videos
              total_followers: data.profile.follower_count || data.profile.followersCount || 0,
              total_posts: data.profile.total_posts || data.profile.postsCount || 0,
              total_likes: data.profile.total_likes || 0,
              total_views: data.profile.total_views || 0,
              total_videos: data.profile.total_videos || 0,
              engagement_rate: data.profile.engagement_rate || 0
           };
      } else if (data.results && data.results.length > 0) {
           // Fallback extraction from posts
           const firstPost = data.results[0];
           payload = {
              platform: 'INSTAGRAM',
              username: username,
              display_name: firstPost.author_name || username,
              avatar_url: firstPost.author_avatar || firstPost.thumbnail_url || '',
              total_followers: 0, // Will be updated on refresh
              total_likes: data.results.reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0),
              total_views: data.results.reduce((sum: number, p: any) => sum + (p.video_view_count || 0), 0),
              total_videos: data.results.filter((p: any) => p.content_type === 'reel').length,
              total_posts: data.results.length,
              engagement_rate: 0
           };
      } else {
           alert('Tìm thấy tài khoản nhưng không có bài viết công khai nào để phân tích.');
           setProcessing(false);
           return;
           return;
      }

      console.log('[DEBUG] AI Response Profile:', data.profile);
      console.log('[DEBUG] Saving Payload:', payload);

      // Save to Database
      const token = localStorage.getItem('auth_token');
      const saveResponse = await fetch(`${apiUrl}/tracked-channels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
      });

      if (saveResponse.ok) {
          await fetchTrackedChannels();
          setShowAddModal(false);
          setUsernameInput('');
      } else {
          const errorData = await saveResponse.json();
          alert(errorData.message || 'Lỗi khi lưu kênh vào hệ thống.');
      }
    } catch (error) {
      console.error('Error processing channel:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddChannel = () => {
    if (!usernameInput.trim()) return;
    fetchChannelProfile(usernameInput);
  };

  const handleRefreshChannel = async (channel: ChannelProfile) => {
    setRefreshingIds(prev => new Set(prev).add(channel.username));
    try {
        await fetchChannelProfile(channel.username);
        setRefreshingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(channel.username);
            return newSet;
        });
    } catch (error) {
        setRefreshingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(channel.username);
            return newSet;
        });
    }
  };

  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const filteredChannels = channels.filter(c =>
    c.username.toLowerCase().includes(searchChannelQuery.toLowerCase()) ||
    (c.display_name && c.display_name.toLowerCase().includes(searchChannelQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 pb-20 fade-in">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200">
                 <InstagramIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Instagram Analytics</h1>
                <p className="text-sm text-slate-500">Quản lý tài khoản Instagram</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-pink-600/30 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Thêm Kênh Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-7xl pt-8">
        
        {/* Loading State */}
        {loadingInitial && (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-pink-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Đang tải dữ liệu kênh...</p>
            </div>
        )}

        {/* Empty State */}
        {!loadingInitial && channels.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-pink-200 m-4"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-pink-50/50">
               <InstagramIcon className="w-12 h-12 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Chưa có kênh nào</h3>
            <p className="text-slate-500 mb-8 max-w-md text-center">
               Hãy thêm tài khoản Instagram đầu tiên của bạn để bắt đầu theo dõi và phân tích posts & reels.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-xl shadow-pink-600/30 hover:from-purple-700 hover:to-pink-700 transition-all hover:-translate-y-1"
            >
              <Plus className="w-6 h-6" /> 
              <span>Thêm Kênh Ngay</span>
            </button>
          </motion.div>
        )}

        {/* Channels Grid */}
        {!loadingInitial && channels.length > 0 && (
            <>
               {/* Stats Bar */}
               <div className="bg-white rounded-2xl p-5 mb-8 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-pink-600" />
                    <span className="text-lg font-bold text-slate-800">{channels.length}</span>
                    <span className="text-slate-500 font-medium">Kênh đang theo dõi</span>
                  </div>
                  
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm kênh..."
                      value={searchChannelQuery}
                      onChange={(e) => setSearchChannelQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 w-64 transition-all"
                    />
                  </div>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredChannels.map((channel, idx) => (
                  <motion.div
                    key={channel.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:translate-y-[-4px] transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshChannel(channel);
                            }}
                            disabled={refreshingIds.has(channel.username) || processing}
                            className="bg-white/90 backdrop-blur p-2 rounded-lg text-pink-600 shadow-sm border border-pink-100 hover:bg-pink-50"
                            title="Làm mới dữ liệu"
                        >
                            <RotateCcw className={`w-4 h-4 ${refreshingIds.has(channel.username) ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={channel.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.display_name)}&background=E1306C&color=fff`} 
                          alt={channel.display_name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-full object-cover border-2 border-pink-100 shadow-md ring-2 ring-pink-50"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.display_name)}&background=E1306C&color=fff`;
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center border-2 border-white text-white shadow-sm">
                          <InstagramIcon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-slate-900 truncate text-lg">{channel.display_name}</h3>
                        <p className="text-sm text-slate-500 truncate font-medium flex items-center gap-1">
                           @{channel.username}
                        </p>

                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-3 border border-purple-100">
                            <span className="text-xs text-purple-600 font-bold uppercase mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Followers</span>
                            <span className="text-purple-900 font-black text-lg block">
                                {formatNumber(channel.total_followers || 0)}
                            </span>
                        </div>
                        <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-3 border border-pink-100">
                            <span className="text-xs text-pink-600 font-bold uppercase mb-1 flex items-center gap-1"><Camera className="w-3 h-3" /> Posts</span>
                            <span className="text-pink-900 font-black text-lg block">
                                {formatNumber(channel.total_posts || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => router.push(`/dashboard/instagram/analytics/${channel.username}`)}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg shadow-pink-600/20"
                    >
                      <span>Xem Chi Tiết</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </>
        )}
      </div>

      {/* Add Channel Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !processing && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-pink-600">
                             <Plus className="w-5 h-5" />
                        </div>
                        Thêm Kênh Instagram
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Theo dõi tài khoản Instagram mới</p>
                </div>
                <button
                  onClick={() => !processing && setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8">
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Username Instagram
                </label>
                <div className="relative mb-6">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <InstagramIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddChannel()}
                    placeholder="Ví dụ: cristiano hoặc @cristiano"
                    disabled={processing}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-pink-500 focus:bg-white transition-all font-medium text-lg placeholder:text-slate-400"
                  />
                  {usernameInput && (
                      <button 
                         onClick={() => setUsernameInput('')}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                          <X className="w-4 h-4" />
                      </button>
                  )}
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 mb-6">
                    <h4 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                        <InstagramIcon className="w-4 h-4" /> Hỗ trợ các định dạng:
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-1.5 pl-1">
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400" /> Username (vd: cristiano)</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400" /> Với @ (vd: @cristiano)</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400" /> Link profile (instagram.com/cristiano)</li>
                    </ul>
                </div>

                <div className="bg-green-50/50 rounded-xl p-4 border border-green-100 mb-4">
                    <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                        ✅ Dữ liệu hỗ trợ đầy đủ
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-1.5 pl-1">
                        <li className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-green-400 mt-2" />
                            <span><strong>Profile Info</strong> (Followers, Posts count, Bio)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-green-400 mt-2" />
                            <span><strong>Posts & Reels</strong> (Likes, Comments, Views)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-green-400 mt-2" />
                            <span><strong>Engagement Metrics</strong> (Tỷ lệ tương tác)</span>
                        </li>
                    </ul>
                </div>

                <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => setShowAddModal(false)}
                      disabled={processing}
                      className="flex-1 py-4 border-2 border-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={handleAddChannel}
                      disabled={processing || !usernameInput.trim()}
                      className="flex-[2] py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-pink-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Đang Quét & Thêm...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span>Thêm Kênh Này</span>
                        </>
                      )}
                    </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
