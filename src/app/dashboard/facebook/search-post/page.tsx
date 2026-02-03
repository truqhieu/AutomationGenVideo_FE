'use client';

import { useState } from 'react';
import { Search, Loader2, Facebook, FileText, Image as ImageIcon, Video, ThumbsUp, MessageCircle, Share2, ExternalLink, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FacebookPost {
  video_id: string; // Used as Post ID
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string; // Post URL
  download_url: string; // If video
  likes_count: number;
  comments_count: number;
  shares_count: number;
  published_at: string;
  author_name: string;
  author_username: string;
}

export default function FacebookSearchPostPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FacebookPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchedUser, setSearchedUser] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setSearchedUser(null);

    try {
      // Use the AI Service API directly or via Backend Proxy
      // Assuming typical pattern: POST /api/channels/check-by-username/
      // Logic: This endpoint in AI service (Django) now supports FACEBOOK
      
      const apiUrl = 'http://localhost:8001/api/channels/check-by-username/'; // Direct to AI Service for now, or use NEXT_PUBLIC_AI_URL
      // Better: Use the Next.js proxy or standard BE URL if configured. 
      // Let's use the local AI service URL for dev since we know it works there, 
      // OR better, use the correct env var if available, but for solidity let's try the direct AI endpoint which we just modified.
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'FACEBOOK',
          username: query.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Facebook posts');
      }

      setResults(data.videos || []); // The API likely returns 'videos' key even for posts
      setSearchedUser(query.trim());

    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Có lỗi xảy ra khi quét dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
      });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      
      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-2xl mb-4 text-blue-600">
           <Facebook className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Facebook Post Scanner</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
           Quét bài viết, hình ảnh và video từ Fanpage hoặc Profile Facebook. 
           Nhập Username hoặc ID để bắt đầu.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="relative group">
            <div className={`absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            <div className="relative flex items-center bg-white border-2 border-slate-200 rounded-2xl overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-xl shadow-slate-200/50">
                <div className="pl-6 text-slate-400">
                    <Search className="w-6 h-6" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nhập Facebook Username hoặc Page ID (ví dụ: vtv24, 1000...)"
                    className="w-full px-5 py-4 text-lg outline-none text-slate-700 placeholder:text-slate-400 font-medium"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="mr-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Quét'}
                </button>
            </div>
        </form>
      </div>

      {/* ERROR MESSAGE */}
      <AnimatePresence>
        {error && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0 }}
               className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center font-medium"
            >
                {error}
            </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS GRID */}
      {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
             <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Kết quả cho: <span className="text-blue-600">@{searchedUser}</span>
                    <span className="text-sm font-normal text-slate-500 ml-2">({results.length} bài viết)</span>
                </h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((item, index) => (
                    <motion.div
                        key={item.video_id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
                    >
                        {/* Header */}
                        <div className="p-4 flex items-center gap-3 border-b border-slate-50">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                {item.author_name ? item.author_name.charAt(0).toUpperCase() : 'F'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 truncate">{item.author_name || item.author_username}</h4>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                   <Calendar className="w-3 h-3" />
                                   {formatDate(item.published_at)}
                                </p>
                            </div>
                            <a href={item.video_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 p-2">
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        </div>

                        {/* Content Preview */}
                        <div className="h-48 bg-slate-100 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                             {item.thumbnail_url ? (
                                 <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                     <FileText className="w-12 h-12 opacity-50" />
                                     <span className="text-xs">Chỉ có văn bản</span>
                                 </div>
                             )}
                             
                             {/* Media Type Badge */}
                             <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-xs font-bold flex items-center gap-1">
                                 {item.download_url ? (
                                     <><Video className="w-3 h-3" /> Video</>
                                 ) : item.thumbnail_url ? (
                                      <><ImageIcon className="w-3 h-3" /> Ảnh</>
                                 ) : (
                                     <><FileText className="w-3 h-3" /> Text</>
                                 )}
                             </div>
                        </div>

                        {/* Caption */}
                        <div className="p-4 flex-1">
                            <p className="text-slate-700 text-sm line-clamp-3 leading-relaxed">
                                {item.description || item.title || 'Không có mô tả.'}
                            </p>
                        </div>

                        {/* Stats Footer */}
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-slate-500 text-sm">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5"><ThumbsUp className="w-4 h-4 text-blue-500"/> {item.likes_count}</span>
                                <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-green-500"/> {item.comments_count}</span>
                                <span className="flex items-center gap-1.5"><Share2 className="w-4 h-4 text-purple-500"/> {item.shares_count}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
             </div>

             {/* Empy State (Fetched but empty) */}
             {results.length === 0 && !loading && searchedUser && (
                <div className="text-center py-20 text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 opacity-50" />
                    </div>
                    <p>Không tìm thấy bài viết nào cho user này.</p>
                </div>
             )}
          </motion.div>
      )}
    </div>
  );
}
