'use client';

import { useState } from 'react';
import { Search, Loader2, Instagram, Video, ThumbsUp, MessageCircle, Share2, Eye, Download, Play, Hash, AlertTriangle, Film, ChevronDown, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GenerateContentButton from '@/components/content/GenerateContentButton';

interface InstagramReel {
    id: number;
    platform: string;
    video_id: string;
    title: string;
    description: string;
    author_username: string;
    author_name: string;
    likes_count: number;
    views_count: number;
    comments_count: number;
    shares_count: number;
    video_url: string;
    download_url: string;
    thumbnail_url: string;
    published_at: string;
    hashtags: string[];
    raw_data: any;
}

export default function InstagramSearchReelPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [apiPage, setApiPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [filterFallback, setFilterFallback] = useState(false);
    const [searchMode, setSearchMode] = useState<'hashtag' | 'keyword'>('hashtag');
    const [loadingMore, setLoadingMore] = useState(false);
    const itemsPerPage = 8;
    const VIDEOS_PER_BATCH = 5;
    const MIN_LIKES = 500;
    const MIN_VIEWS = 500;
    const MIN_COMMENTS = 50;
    const [loading, setLoading] = useState(false);
    const [reels, setReels] = useState<InstagramReel[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [normalizedQuery, setNormalizedQuery] = useState<string | null>(null);

    // Pagination - show current page of loaded reels
    const totalPages = Math.ceil(reels.length / itemsPerPage);
    const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
    const indexOfLastReel = safeCurrentPage * itemsPerPage;
    const indexOfFirstReel = indexOfLastReel - itemsPerPage;
    const currentReels = reels.slice(indexOfFirstReel, indexOfLastReel);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearchModeChange = (mode: 'hashtag' | 'keyword') => {
        if (mode === searchMode) return;
        setSearchMode(mode);
        setReels([]);
        setCurrentPage(1);
        setApiPage(1);
        setHasMore(false);
        setFilterFallback(false);
        setError(null);
        setNormalizedQuery(null);
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    const normalizeHashtag = (str: string) => {
        return str.trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "").replace(/#/g, "");
    };

    const getThumbnailSrc = (url: string) => {
        if (!url) return '';
        if (url.startsWith('/')) return url;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return `${apiUrl}/image-proxy/?url=${encodeURIComponent(url)}`;
        }
        return url;
    };

    const handleSearch = async (reset = true) => {
        if (!searchTerm.trim()) {
            setError('Vui lòng nhập từ khóa hoặc hashtag');
            return;
        }

        const pageToFetch = reset ? 1 : apiPage + 1;
        if (reset) {
            setLoading(true);
            setError(null);
            setReels([]);
            setCurrentPage(1);
            setApiPage(1);
            setNormalizedQuery(searchMode === 'hashtag' ? normalizeHashtag(searchTerm) : searchTerm.replace(/^#/, '').trim());
        } else {
            setLoadingMore(true);
        }

        try {
            const token = localStorage.getItem('auth_token');
            const keyword = searchMode === 'hashtag'
                ? normalizeHashtag(searchTerm)
                : searchTerm.replace(/^#/, '').trim();

            if (!keyword) {
                setError(searchMode === 'hashtag' ? 'Hashtag không hợp lệ.' : 'Vui lòng nhập từ khóa.');
                return;
            }

            const body = {
                platform: 'instagram',
                keyword,
                search_type: 'reels',
                search_mode: searchMode,
                min_likes: MIN_LIKES,
                min_views: MIN_VIEWS,
                min_comments: MIN_COMMENTS,
                max_results: VIDEOS_PER_BATCH,
                page: pageToFetch,
                use_cache: false,
            };

            const response = await fetch(`${apiUrl}/ai/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ ...body, async_mode: false }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.detail || 'Search failed');

            const newReels = data.results || data.videos || [];
            setHasMore(data.has_more ?? false);
            setFilterFallback(data.filter_fallback ?? false);
            setApiPage(pageToFetch);

            if (reset) {
                setReels(newReels);
            } else {
                setReels(prev => [...prev, ...newReels]);
            }
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi tìm kiếm.');
            if (reset) setReels([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
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

    const formatNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getAvatarUrl = (reel: InstagramReel) => {
        if (reel.raw_data && reel.raw_data.author && reel.raw_data.author.avatar) {
            return reel.raw_data.author.avatar;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(reel.author_name || reel.author_username)}&background=E1306C&color=fff`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Film className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                            Instagram Reels Search
                        </h1>
                    </div>
                    <p className="text-slate-600 text-lg ml-16">Tìm theo hashtag hoặc keyword • Filter: ≥1K likes OR ≥1K views OR ≥100 comments</p>
                </motion.div>

                {/* Search Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 mb-8 shadow-xl"
                >
                    {/* Search Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => handleSearchModeChange('hashtag')}
                            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${searchMode === 'hashtag'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            # Hashtag
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSearchModeChange('keyword')}
                            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${searchMode === 'keyword'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Keyword
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 z-10">
                                {searchMode === 'hashtag' ? <Hash className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch(true)}
                                placeholder={searchMode === 'hashtag' ? 'VD: trangsuc, fashion...' : 'VD: trang sức, jewelry...'}
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-slate-700 placeholder-slate-400"
                            />
                        </div>
                        <button
                            onClick={() => handleSearch(true)}
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang tìm...
                                </>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    Tìm Kiếm
                                </>
                            )}
                        </button>
                    </div>

                    {/* Popular Hashtags */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">Popular:</span>
                        {['fashion', 'travel', 'food', 'fitness', 'photography'].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setSearchTerm(tag)}
                                className="px-3 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 rounded-full text-xs font-medium transition-colors"
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 flex items-center gap-3"
                    >
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <p className="text-red-700">{error}</p>
                    </motion.div>
                )}

                {/* Normalized Query Feedback */}
                {normalizedQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm inline-flex items-center gap-2 border border-purple-100"
                    >
                        {searchMode === 'hashtag' ? <Hash className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                        <span>
                            {loading
                                ? (searchMode === 'hashtag' ? 'Đang tìm kiếm hashtag: ' : 'Đang tìm kiếm keyword: ')
                                : (searchMode === 'hashtag' ? 'Kết quả tìm kiếm cho hashtag: ' : 'Kết quả tìm kiếm cho keyword: ')}
                            <strong>{searchMode === 'hashtag' ? `#${normalizedQuery}` : normalizedQuery}</strong>
                        </span>
                    </motion.div>
                )}

                {/* Results */}
                <AnimatePresence>
                    {reels.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {filterFallback && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-amber-800 text-sm">
                                        Không có Reel đạt ngưỡng (≥1K likes, ≥1K views hoặc ≥100 comments). Đang hiển thị tất cả {reels.length} Reel tìm được.
                                    </p>
                                </div>
                            )}
                            <div className="mb-4 text-slate-600 flex justify-between items-center">
                                <div>
                                    Tìm thấy <span className="text-purple-600 font-bold">{reels.length}</span> Reels
                                </div>
                                <div className="text-sm text-slate-500">
                                    Trang {safeCurrentPage} / {totalPages || 1}
                                </div>
                            </div>

                            {/* Grid Layout - 4 columns for 8 reels per page */}
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {currentReels.map((reel, index) => (
                                    <div
                                        key={reel.video_id || index}
                                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-purple-400/50 hover:shadow-xl transition-all duration-300 group flex flex-col"
                                    >
                                        {/* Cover */}
                                        <div className="relative aspect-[9/16] bg-slate-100 group-hover:scale-[1.02] transition-transform duration-500 overflow-hidden">
                                            {/* Play Icon Overlay */}
                                            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                                                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                                                </div>
                                            </div>

                                            {reel.thumbnail_url ? (
                                                <img
                                                    src={getThumbnailSrc(reel.thumbnail_url)}
                                                    alt={reel.description}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => {
                                                        const t = e.target as HTMLImageElement;
                                                        if (t.src?.includes('image-proxy') && reel.thumbnail_url) {
                                                            t.src = reel.thumbnail_url;
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                                    <Video className="w-12 h-12 opacity-50" />
                                                    <span className="text-xs">No thumbnail</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                                            {/* Stats Overlay */}
                                            <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-between items-end">
                                                <div className="flex items-center gap-1 text-white bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                                                    <Eye className="w-3 h-3 text-purple-400" />
                                                    <span className="text-xs font-bold">{formatNumber(reel.views_count)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 flex flex-col flex-1">
                                            {/* Author */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <img
                                                    src={getAvatarUrl(reel)}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate" title={reel.author_name}>
                                                        {reel.author_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">@{reel.author_username}</p>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-700 line-clamp-2 mb-3 h-10" title={reel.description}>
                                                {reel.description || reel.title || 'Không có mô tả.'}
                                            </p>

                                            {/* Metrics */}
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
                                                <div className="flex items-center gap-1 text-slate-500 text-xs" title="Likes">
                                                    <ThumbsUp className="w-3 h-3 text-pink-500" /> {formatNumber(reel.likes_count)}
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-500 text-xs" title="Comments">
                                                    <MessageCircle className="w-3 h-3 text-blue-500" /> {formatNumber(reel.comments_count)}
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-500 text-xs" title="Shares">
                                                    <Share2 className="w-3 h-3 text-purple-500" /> {formatNumber(reel.shares_count)}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="grid grid-cols-3 gap-2 mt-4">
                                                <a
                                                    href={reel.video_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Xem
                                                </a>
                                                <a
                                                    href={reel.download_url || reel.video_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-600 text-xs font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Download className="w-3.5 h-3.5" /> Tải
                                                </a>
                                                <GenerateContentButton
                                                    videoId={reel.id}
                                                    videoTitle={reel.title || reel.description || 'Instagram Reel'}
                                                    className="text-xs py-2.5"
                                                    compact={true}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>

                            {/* Scan Next Page */}
                            {hasMore && (
                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={() => handleSearch(false)}
                                        disabled={loadingMore}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {loadingMore ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Đang tải...</>
                                        ) : (
                                            <><ChevronDown className="w-5 h-5" /> Scan Next Page</>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-8 flex flex-col items-center gap-4">
                                    {/* Pagination Controls */}
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>

                                        {/* Page Numbers */}
                                        {[...Array(totalPages)].map((_, index) => {
                                            const pageNum = index + 1;

                                            if (totalPages > 7) {
                                                if (
                                                    pageNum !== 1 &&
                                                    pageNum !== totalPages &&
                                                    (pageNum < safeCurrentPage - 1 || pageNum > safeCurrentPage + 1)
                                                ) {
                                                    if (pageNum === safeCurrentPage - 2 || pageNum === safeCurrentPage + 2) {
                                                        return (
                                                            <span key={pageNum} className="px-2 pt-2 text-slate-400">
                                                                ...
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                }
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-4 py-2 rounded-lg transition-colors ${safeCurrentPage === pageNum
                                                        ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-500/30'
                                                        : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage >= totalPages}
                                            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State */}
                {!loading && reels.length === 0 && !error && (
                    <div className="text-center py-20 text-slate-500">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Instagram className="w-8 h-8 text-purple-600 opacity-50" />
                        </div>
                        <p>Nhập keyword hoặc hashtag để tìm kiếm Instagram Reels</p>
                    </div>
                )}
            </div>
        </div>
    );
}
