'use client';

import { useState } from 'react';
import { Search, Loader2, AlertTriangle, Image as ImageIcon, Video, Eye, Heart, MessageCircle, Star, User, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface XHSNote {
  note_id: string;
  type: 'video' | 'image';
  title: string;
  desc: string;
  hashtags: string[];
  likes_count: number;
  views_count: number | null; // Often hidden
  comments_count: number;
  collects_count: number;
  shares_count: number;
  author_name: string;
  author_avatar: string;
  author_id: string;
  cover_url: string;
  video_url?: string;
  images_list?: string[];
  published_at: string | null;
  note_url: string;
}

export default function XiaohongshuPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'keyword' | 'hashtag'>('keyword');
  const [sortType, setSortType] = useState<'general' | 'hot' | 'latest'>('general');
  const [maxPosts, setMaxPosts] = useState(20);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<XHSNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Mock Data for UI testing (until backend ready)
  // Remove this when backend is integrated
  const mockSearch = async () => {
     await new Promise(r => setTimeout(r, 1500));
     return [];
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Vui lòng nhập từ khóa');
      return;
    }

    setLoading(true);
    setError(null);
    setNotes([]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/xiaohongshu/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: searchType === 'hashtag' && !searchTerm.trim().startsWith('#') 
            ? `#${searchTerm.trim()}` 
            : searchTerm.trim(),
          sortType,
          maxPosts,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      if (data.success && data.data) {
        setNotes(data.data.notes || []);
        setHasMore((data.data.notes?.length || 0) >= maxPosts);
      } else {
        throw new Error(data.error || 'No data returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search Xiaohongshu');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setMaxPosts(prev => prev + 20);
    handleSearch();
  };

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 10000) return `${(num / 10000).toFixed(1)}w`;
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-500/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
              Xiaohongshu Notes
            </h1>
          </div>
          <p className="text-slate-400 text-lg ml-16">Khám phá nội dung trending trên Tiểu Hồng Thư</p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 mb-8"
        >
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between">
             
             {/* Search Type (Keyword/Hashtag) */}
             <div className="flex bg-slate-800 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setSearchType('keyword')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                     searchType === 'keyword'
                     ? 'bg-red-500 text-white shadow-lg'
                     : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4" /> Keyword
                </button>
                <button
                  onClick={() => setSearchType('hashtag')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                     searchType === 'hashtag'
                     ? 'bg-red-500 text-white shadow-lg'
                     : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-lg leading-none">#</span> Hashtag
                </button>
             </div>

             {/* Sort Type */}
             <div className="flex bg-slate-800 p-1 rounded-xl w-fit">
                {['general', 'hot', 'latest'].map((type) => (
                   <button
                      key={type}
                      onClick={() => setSortType(type as any)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                         sortType === type 
                         ? 'bg-red-500 text-white shadow-lg' 
                         : 'text-slate-400 hover:text-white'
                      }`}
                   >
                      {type === 'general' ? 'Tổng hợp' : type === 'hot' ? 'Hot nhất' : 'Mới nhất'}
                   </button>
                ))}
             </div>
          </div>

          {/* Search Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={searchType === 'keyword' ? 'Nhập từ khóa tìm kiếm...' : 'Nhập hashtag (không cần #)...'}
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-red-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
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
          {notes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4 text-slate-400">
                Tìm thấy <span className="text-white font-bold">{notes.length}</span> bài viết
              </div>

              {/* Masonry-like Grid - Optimized */}
              <motion.div 
                 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ duration: 0.3 }}
              >
                {notes.map((note) => (
                  <div
                    key={note.note_id}
                    className="bg-white text-slate-900 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 group h-full flex flex-col"
                  >
                    {/* Cover */}
                    <div className="relative aspect-[3/4] bg-slate-100 group-hover:opacity-95 transition-opacity">
                      {note.cover_url ? (
                        <img
                          src={note.cover_url}
                          alt={note.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                          <ImageIcon className="w-12 h-12 text-slate-400" />
                        </div>
                      )}
                      
                      {/* Type Badge */}
                      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full text-white text-xs flex items-center gap-1">
                          {note.type === 'video' ? <Video className="w-3 h-3"/> : <ImageIcon className="w-3 h-3"/>}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-slate-900 line-clamp-2 mb-2 text-sm h-10" title={note.title || note.desc}>
                          {note.title || note.desc}
                      </h3>

                      {/* Author */}
                      <div className="flex items-center gap-2 mb-3">
                        <img 
                            src={note.author_avatar} 
                            alt="" 
                            className="w-6 h-6 rounded-full border border-slate-200 object-cover" 
                            loading="lazy"
                        />
                        <span className="text-xs text-slate-500 truncate font-medium">{note.author_name}</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                          {formatNumber(note.likes_count)}
                        </div>
                         <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {formatNumber(note.collects_count)}
                        </div>
                      </div>
                      
                      {/* Link */}
                      <a 
                         href={note.note_url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="block mt-3 w-full py-2 bg-red-50 text-red-600 text-xs font-bold text-center rounded-lg hover:bg-red-100 transition-colors"
                      >
                         Xem chi tiết
                      </a>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium disabled:opacity-50 transition-all"
                  >
                    Xem thêm
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && notes.length === 0 && !error && (
          <div className="text-center py-20 text-slate-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nhập từ khóa (Ví dụ: "thời trang", "skincare") để tìm kiếm Notes</p>
          </div>
        )}
      </div>
    </div>
  );
}
