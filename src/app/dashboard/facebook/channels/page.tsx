'use client';
// Force rebuild for UI update

import { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, Eye, Heart, Users, ArrowRight, X, Loader2, Video, RotateCcw, Facebook, ThumbsUp, MessageCircle, Share2, Link as LinkIcon, BarChart3 } from 'lucide-react';
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

export default function FacebookChannelsPage() {
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
      const response = await fetch(`${apiUrl}/tracked-channels/my-channels?platform=FACEBOOK`, {
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

  const extractFacebookId = (input: string): string => {
      let clean = input.trim();
      // Basic URL cleanup
      if (clean.endsWith('/')) clean = clean.slice(0, -1);
      
      try {
          if (clean.includes('facebook.com') || clean.includes('fb.com')) {
              const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
              
              // Handle /profile.php?id=123
              if (url.pathname.includes('profile.php')) {
                  const id = url.searchParams.get('id');
                  if (id) return id;
              }
              // Handle /groups/123
              if (url.pathname.includes('/groups/')) {
                  const parts = url.pathname.split('/groups/');
                  if (parts[1]) return parts[1].split('/')[0];
              }
              // Handle standard /username
              const pathParts = url.pathname.split('/').filter(p => p);
              if (pathParts.length > 0) {
                  return pathParts[0]; 
              }
          }
      } catch (e) {
         // ignore
      }
      return clean.replace('@', '');
  };

  const fetchChannelProfile = async (input: string) => {
    setProcessing(true);
    const username = extractFacebookId(input);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    try {
      // Call Backend to Analyze/Scan Channel
      const response = await fetch(`${apiUrl}/ai/user-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'facebook',
          username: username,
          max_results: 1 // Quick scan for profile info
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Không thể tìm thấy Fanpage/User này. Vui lòng kiểm tra lại Link hoặc ID.');
        setProcessing(false);
        return;
      }
      
      let payload: any = {};
      
      // Extract Data for Saving
      if (data.profile) {
           // Explicitly map fields to match Backend DTO
           const followerCount = data.profile.follower_count || data.profile.total_followers;
           
           // Determine Likes to save: Priority Page Likes -> Fallback Post Sum
           const pageLikes = parseInt(data.profile.total_likes || '0');
           const postLikesSum = data.profile.metadata?.fetched_likes_sum || 0;
           const finalLikes = pageLikes > 0 ? pageLikes : postLikesSum;

           payload = {
              platform: 'FACEBOOK',
              username: data.profile.username || username,
              display_name: data.profile.display_name || data.profile.fullname || data.profile.name || username,
              avatar_url: data.profile.avatar_url || data.profile.profile_pic_url || '',
              total_followers: followerCount ? parseInt(followerCount) : null, 
              total_likes: finalLikes,
              total_views: parseInt(data.profile.total_views || '0'),
              total_videos: parseInt(data.profile.total_videos || data.profile.media_count || '0'),
              engagement_rate: parseFloat(data.profile.engagement_rate || '0')
           };
      } else if (data.results && data.results.length > 0) {
           // Fallback extraction from posts
           const firstPost = data.results[0];
           payload = {
              platform: 'FACEBOOK',
              username: username,
              display_name: firstPost.author_name || username,
              avatar_url: firstPost.author_avatar || firstPost.thumbnail_url || '',
              total_followers: null, // Facebook doesn't provide this via Apify
              total_likes: data.results.reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0),
              total_views: data.results.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0),
              total_videos: data.results.length,
              engagement: 0,
              engagement_rate: 0
           };
      } else {
           alert('Tìm thấy kênh nhưng không có bài viết công khai nào để phân tích.');
           setProcessing(false);
           return;
      }

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
    <div className="min-h-screen bg-slate-50 pb-20 fade-in">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-7xl py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-200 shadow-lg">
                 <Facebook className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Facebook Analytics</h1>
                <p className="text-sm text-slate-500">Quản lý Fanpage & Group</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
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
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Đang tải dữ liệu kênh...</p>
            </div>
        )}

        {/* Empty State */}
        {!loadingInitial && channels.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 m-4"
          >
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50">
               <Facebook className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Chưa có kênh nào</h3>
            <p className="text-slate-500 mb-8 max-w-md text-center">
               Hãy thêm Fanpage, Profile hoặc Group Facebook đầu tiên của bạn để bắt đầu theo dõi và phân tích dữ liệu.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all hover:-translate-y-1"
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
                    <BarChart3 className="w-5 h-5 text-blue-600" />
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
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
                    />
                  </div>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredChannels.map((channel, idx) => (
                  <div
                    key={channel.id || idx}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                    style={{ willChange: 'transform' }}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshChannel(channel);
                            }}
                            disabled={refreshingIds.has(channel.username) || processing}
                            className="bg-white/90 p-2 rounded-lg text-blue-600 shadow-sm border border-blue-100 hover:bg-blue-50 transition-colors"
                            title="Làm mới dữ liệu"
                        >
                            <RotateCcw className={`w-4 h-4 ${refreshingIds.has(channel.username) ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={channel.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.display_name)}&background=1877F2&color=fff`} 
                          alt={channel.display_name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 shadow-md"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.display_name)}&background=1877F2&color=fff`;
                          }}
                        />
                        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white text-white shadow-sm">
                          <Facebook className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-slate-900 truncate text-lg" title={channel.display_name}>{channel.display_name}</h3>
                        <p className="text-sm text-slate-500 truncate font-medium flex items-center gap-1">
                           @{channel.username}
                        </p>

                      </div>
                    </div>

                    {/* Stats Grid - Show Followers only */}
                    <div className="grid grid-cols-1 gap-3 mb-6 mt-auto">
                        <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-blue-500 font-bold uppercase mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Followers</span>
                            <span className="text-blue-900 font-black text-lg">
                                {formatNumber(channel.total_followers || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => router.push(`/dashboard/facebook/analytics/${channel.username}`)}
                      className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/10"
                    >
                      <span>Xem Chi Tiết</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
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
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                             <Plus className="w-5 h-5" />
                        </div>
                        Thêm Kênh Facebook
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Theo dõi Fanpage hoặc trang cá nhân mới</p>
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
                  Link Facebook hoặc ID
                </label>
                <div className="relative mb-6">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <LinkIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddChannel()}
                    placeholder="Ví dụ: https://www.facebook.com/vtv24"
                    disabled={processing}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-lg placeholder:text-slate-400"
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

                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mb-6">
                    <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <Facebook className="w-4 h-4" /> Hỗ trợ các định dạng:
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-1.5 pl-1">
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400" /> Link Fanpage (facebook.com/trang)</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400" /> Link Profile (facebook.com/nguoi.dung)</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400" /> Username hoặc ID (vd: vtv24)</li>
                    </ul>
                </div>

                <div className="bg-green-50/50 rounded-xl p-4 border border-green-100 mb-4">
                    <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                        ✅ Dữ liệu hỗ trợ đầy đủ
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-1.5 pl-1">
                        <li className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-green-400 mt-2" />
                            <span><strong>Page Likes & Followers</strong> (Tự động quét từ trang)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-green-400 mt-2" />
                            <span>Video & Bài viết (20 bài gần nhất)</span>
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
                      className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
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
