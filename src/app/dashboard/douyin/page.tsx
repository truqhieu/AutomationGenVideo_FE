'use client';

import { useState } from 'react';
import { Search, Loader2, AlertTriangle, Video, Eye, Heart, MessageCircle, Share2, User, Music, Hash, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import apiClient from '@/lib/api-client';

interface DouyinVideo {
  video_id: string;
  caption: string;
  hashtags: string[];
  views_count: number | null;
  likes_count: number | null;
  comments_count: number;
  shares_count: number;
  author_username: string;
  author_name: string;
  author_avatar: string;
  video_url: string;
  thumbnail_url: string;
  music_title: string;
  published_at: string | null;
}

export default function DouyinScraperPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'keyword' | 'hashtag'>('keyword');
  const [loading, setLoading] = useState(false);
  const [scanningNext, setScanningNext] = useState(false);
  const [videos, setVideos] = useState<DouyinVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [trackedChannels, setTrackedChannels] = useState<Set<string>>(new Set());
  const [followingChannels, setFollowingChannels] = useState<Set<string>>(new Set());
  const [seenVideoIds, setSeenVideoIds] = useState<Set<string>>(new Set()); // track IDs đã hiển thị
  const [batchOffset, setBatchOffset] = useState(0); // offset cho next batch
  const BATCH_SIZE = 5;


  const handleFollowChannel = async (video: DouyinVideo) => {
    const username = video.author_username.replace('@', '').trim();

    // Prevent double-click or re-following
    if (followingChannels.has(username) || trackedChannels.has(username)) return;

    setFollowingChannels(prev => new Set(prev).add(username));

    try {
      // Aggregate stats from all videos of the same author in current results
      const authorVideos = videos.filter(v =>
        v.author_username.replace('@', '').trim() === username
      );

      const totalViews = authorVideos.reduce((sum, v) => sum + (v.views_count || 0), 0);
      const totalLikes = authorVideos.reduce((sum, v) => sum + (v.likes_count || 0), 0);
      const totalVideos = authorVideos.length;

      const payload = {
        platform: 'DOUYIN',
        username: username,
        display_name: video.author_name || username,
        avatar_url: video.author_avatar || null,
        total_followers: 0,       // Not available from search results
        total_likes: totalLikes,
        total_views: totalViews,
        total_videos: totalVideos,
        posts_count: totalVideos,
        engagement_rate: 0,       // Cannot calculate without follower count
      };

      await apiClient.post('/tracked-channels', payload);
      setTrackedChannels(prev => new Set(prev).add(username));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi theo dõi kênh';
      alert(msg);
    } finally {
      setFollowingChannels(prev => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
    }
  };

  // Douyin: chỉ cho search khi đã dịch sang tiếng Trung (keyword mode)
  const hasLatinOrVietnamese = (text: string) => /[a-zA-Z\u00C0-\u1EF9]/.test(text);
  const needsTranslation = searchType === 'keyword' && hasLatinOrVietnamese(searchTerm.trim());
  const canSearch = !needsTranslation;

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Vui lòng nhập từ khóa hoặc hashtag');
      return;
    }
    if (!canSearch) return; // Chưa dịch → không cho tìm

    setLoading(true);
    setError(null);
    // Reset batch state on new search
    setVideos([]);
    setSeenVideoIds(new Set());
    setBatchOffset(0);
    setHasMore(false);

    let finalSearchTerm = searchTerm.trim();

    // Pre-search Translation
    if (searchType === 'keyword' && /[a-zA-Z\u00C0-\u1EF9]/.test(finalSearchTerm)) {
      try {
        const transRes = await fetch('/api/translate-chinese', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: finalSearchTerm }),
        });
        if (transRes.ok) {
          const transData = await transRes.json();
          if (transData.success && transData.translated) {
            finalSearchTerm = transData.translated;
            setSearchTerm(finalSearchTerm);
          }
        }
      } catch (err) {
        console.warn('Pre-search translation failed:', err);
      }
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      // Fetch nhiều hơn BATCH_SIZE để có buffer filter trùng
      const response = await fetch(`${apiUrl}/douyin/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerm: finalSearchTerm,
          searchType,
          maxPosts: 7,
          sortBy: 'most_liked',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search failed');

      if (data.success && data.data) {
        const allVideos: DouyinVideo[] = data.data.videos || [];
        // Lấy đúng BATCH_SIZE video đầu tiên
        const batch = allVideos.slice(0, BATCH_SIZE);
        const newSeenIds = new Set(batch.map(v => v.video_id));
        setVideos(batch);
        setSeenVideoIds(newSeenIds);
        setBatchOffset(BATCH_SIZE);
        // Có thể scan next nếu còn video chưa hiển thị
        setHasMore(allVideos.length > BATCH_SIZE);
      } else {
        throw new Error(data.error || 'No data returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search Douyin');
    } finally {
      setLoading(false);
    }
  };

  const scanNextBatch = async () => {
    if (!searchTerm.trim() || scanningNext) return;
    setScanningNext(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      // Fetch với offset lớn hơn + random seed để tránh trùng
      const randomSeed = Math.floor(Math.random() * 1000);
      const response = await fetch(`${apiUrl}/douyin/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerm: searchTerm.trim(),
          searchType,
          maxPosts: 7,
          sortBy: 'most_liked',
          offset: batchOffset,
          seed: randomSeed,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Scan failed');

      if (data.success && data.data) {
        const allVideos: DouyinVideo[] = data.data.videos || [];
        // Lọc bỏ video đã hiển thị trước đó
        const newVideos = allVideos.filter(v => !seenVideoIds.has(v.video_id));
        const batch = newVideos.slice(0, BATCH_SIZE);

        if (batch.length === 0) {
          setError('Không tìm thấy video mới. Thử thay đổi từ khóa hoặc tìm kiếm lại.');
          setHasMore(false);
          return;
        }

        // Cập nhật danh sách seen và batch offset
        const updatedSeen = new Set(Array.from(seenVideoIds).concat(batch.map(v => v.video_id)));
        setSeenVideoIds(updatedSeen);
        setBatchOffset(prev => prev + BATCH_SIZE);
        setVideos(batch); // Thay thế batch cũ = hiển thị 5 video mới
        setHasMore(newVideos.length > BATCH_SIZE);
      } else {
        throw new Error(data.error || 'No data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to scan next batch');
    } finally {
      setScanningNext(false);
    }
  };

  const loadMore = () => {
    scanNextBatch();
  };


  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-2">
            🎶 Douyin Scraper
          </h1>
          <p className="text-slate-400 text-lg">Tìm kiếm video Douyin theo keyword hoặc hashtag</p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 mb-8"
        >
          {/* Search Type Toggle */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setSearchType('keyword')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${searchType === 'keyword'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Keyword
            </button>
            <button
              onClick={() => setSearchType('hashtag')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${searchType === 'hashtag'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
            >
              <Hash className="w-4 h-4 inline mr-2" />
              Hashtag
            </button>
          </div>

          {/* Search Input */}
          <div className="relative z-10">
            <SearchAutocomplete
              platform="DOUYIN"
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={handleSearch}
              placeholder={searchType === 'keyword' ? 'Nhập từ khóa (tiếng Việt)...' : 'Nhập hashtag (không cần #)...'}
              className="mb-4"
            />
            {needsTranslation && (
              <p className="text-amber-400/90 text-sm mb-3">
                Đang chờ dịch sang tiếng Trung... Nhập xong và đợi vài giây.
              </p>
            )}
            <button
              onClick={handleSearch}
              disabled={loading || !canSearch}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tìm...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Tìm kiếm
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 mb-8 flex items-center gap-3"
          >
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {videos.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4 text-slate-400">
                Tìm thấy <span className="text-white font-bold">{videos.length}</span> video
              </div>

              {/* Video Grid */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {videos.map((video) => {
                  const username = video.author_username.replace('@', '').trim();
                  const isTracked = trackedChannels.has(username);
                  const isFollowing = followingChannels.has(username);

                  return (
                    <div
                      key={video.video_id}
                      className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all duration-300 group flex flex-col h-full"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-[9/16] bg-slate-800 group-hover:opacity-95 transition-opacity">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.caption}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-12 h-12 text-slate-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Author */}
                        <div className="flex items-center gap-2 mb-3">
                          {video.author_avatar ? (
                            <img
                              src={video.author_avatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{video.author_name}</p>
                            <p className="text-xs text-slate-500 truncate">@{video.author_username}</p>
                          </div>
                        </div>

                        {/* Caption */}
                        <p className="text-sm text-slate-300 line-clamp-2 mb-3 h-10">{video.caption}</p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-3 mt-auto">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Eye className="w-3 h-3" />
                            {formatNumber(video.views_count)}
                          </div>
                          {video.likes_count != null && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Heart className="w-3 h-3" />
                              {formatNumber(video.likes_count)}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <MessageCircle className="w-3 h-3" />
                            {formatNumber(video.comments_count)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Share2 className="w-3 h-3" />
                            {formatNumber(video.shares_count)}
                          </div>
                        </div>

                        {/* Hashtags */}
                        {video.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {video.hashtags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Music */}
                        {video.music_title && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                            <Music className="w-3 h-3" />
                            <span className="truncate">{video.music_title}</span>
                          </div>
                        )}

                        {/* Footer Actions */}
                        <div className="flex gap-2 mt-auto pt-3">
                          <a
                            href={video.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                          >
                            <Video className="w-4 h-4" />
                            <span>Douyin</span>
                          </a>
                          <button
                            onClick={() => handleFollowChannel(video)}
                            disabled={isTracked || isFollowing}
                            className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:cursor-not-allowed ${isTracked
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : isFollowing
                                ? 'bg-slate-700 text-slate-400 border border-slate-600'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95'
                              }`}
                            title={isTracked ? 'Đã theo dõi' : isFollowing ? 'Đang xử lý...' : 'Theo dõi kênh này'}
                          >
                            {isTracked ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                <span>Đã theo dõi</span>
                              </>
                            ) : isFollowing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                <span>Đang lưu...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                <span>Theo dõi</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              {/* Scan Next Batch */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="text-xs text-slate-500">
                  Đã xem <span className="text-slate-300 font-medium">{seenVideoIds.size}</span> video •
                  Batch <span className="text-slate-300 font-medium">{Math.ceil(seenVideoIds.size / BATCH_SIZE)}</span>
                </div>
                {hasMore && (
                  <button
                    onClick={scanNextBatch}
                    disabled={scanningNext}
                    className="group flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-red-600/20 to-orange-600/20 hover:from-red-600/40 hover:to-orange-600/40 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-red-900/20"
                  >
                    {scanningNext ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang quét batch mới...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Scan Next Batch</span>
                        <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded-full">+5 video mới</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && videos.length === 0 && !error && (
          <div className="text-center py-20 text-slate-500">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nhập từ khóa hoặc hashtag để bắt đầu tìm kiếm</p>
          </div>
        )}
      </div>
    </div>
  );
}
