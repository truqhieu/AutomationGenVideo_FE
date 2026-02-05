'use client';

import { useState } from 'react';
import { Search, Loader2, Facebook, FileText, Image as ImageIcon, Video, ThumbsUp, MessageCircle, Share2, ExternalLink, Calendar, Hash, User, AlertTriangle, Eye, Download, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FacebookPost {
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

export default function FacebookSearchPostPage() {
    const [searchTerm, setSearchTerm] = useState('');
    // Temporarily disabled keyword/hashtag search due to Facebook blocking anonymous requests
    const [searchType, setSearchType] = useState<'keyword' | 'hashtag' | 'user'>('user');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const [loading, setLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [posts, setPosts] = useState<FacebookPost[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const totalPages = Math.ceil(posts.length / itemsPerPage);
    const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
    const indexOfLastPost = safeCurrentPage * itemsPerPage;
    const indexOfFirstPost = indexOfLastPost - itemsPerPage;
    const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearch = async (reset = true) => {
        if (!searchTerm.trim()) {
            setError('Vui lòng nhập username hoặc page ID');
            return;
        }

        setLoading(true);
        if (reset) {
            setError(null);
            setPosts([]);
            setCurrentPage(1);
        }

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const token = localStorage.getItem('auth_token');

            let apiUrl = '';
            let body: any = {};

            // Always use user-videos endpoint since keyword search is disabled
            apiUrl = `${baseUrl}/ai/user-videos`;
            body = {
                platform: 'FACEBOOK',
                username: searchTerm.trim(),
                min_likes: 0,
                min_views: 0
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            // Debug logging
            console.log('🔍 Response data:', data);
            console.log('🔍 Search type:', searchType);

            if (!response.ok) {
                throw new Error(data.error || 'Search failed');
            }

            if (searchType === 'user') {
                console.log('👤 User search - videos:', data.videos);
                console.log('👤 User search - results:', data.results);
                setPosts(data.videos || data.results || []);
            } else {
                if (data.success && data.results) {
                    setPosts(data.results || []);
                } else {
                    throw new Error(data.error || 'No data returned');
                }
            }

            if (reset) setCurrentPage(1);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Có lỗi xảy ra khi tìm kiếm.');
            setPosts([]);
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

    const formatNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getAvatarUrl = (post: FacebookPost) => {
        if (post.raw_data && post.raw_data.author && post.raw_data.author.avatar) {
            return post.raw_data.author.avatar;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name || post.author_username)}&background=1877F2&color=fff`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Facebook className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Facebook Search
                        </h1>
                    </div>
                    <p className="text-slate-600 text-lg ml-16">Tìm kiếm bài viết viral theo keyword, hashtag hoặc quét posts từ user/page</p>
                </motion.div>

                {/* Search Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 mb-8 shadow-xl"
                >
                    {/* Search Type Selector */}
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex p-1 rounded-xl w-fit">
                            {/* 
                                Temporarily disabled Keyword/Hashtag search 
                                because Facebook blocks anonymous search requests.
                            */}
                            {/* 
                            <button
                                onClick={() => setSearchType('keyword')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${searchType === 'keyword'
                                    ? 'bg-white text-blue-600 shadow-md'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Search className="w-4 h-4" /> Keyword
                            </button>
                            <button
                                onClick={() => setSearchType('hashtag')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${searchType === 'hashtag'
                                    ? 'bg-white text-blue-600 shadow-md'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Hash className="w-4 h-4" /> Hashtag
                            </button>
                            */}
                            <button
                                onClick={() => setSearchType('user')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${searchType === 'user'
                                    ? 'bg-white text-blue-600 shadow-md'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <User className="w-4 h-4" /> User/Page
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                            * Tính năng tìm kiếm theo từ khóa/hashtag đang bảo trì. Vui lòng tìm theo User/Page.
                        </p>
                    </div>

                    {/* Search Input */}
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch(true)}
                            placeholder="Nhập username hoặc page ID (vd: vtv24, 100...)..."
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <button
                            onClick={() => handleSearch(true)}
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                            {loading && !isFetchingMore ? (
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

                {/* Results */}
                <AnimatePresence>
                    {posts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="mb-4 text-slate-600 flex justify-between items-center">
                                <div>
                                    Tìm thấy <span className="text-blue-600 font-bold">{posts.length}</span> bài viết
                                </div>
                                <div className="text-sm text-slate-500">
                                    Trang {safeCurrentPage} / {totalPages || 1}
                                </div>
                            </div>

                            {/* Grid Layout */}
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {currentPosts.map((post, index) => (
                                    <div
                                        key={post.video_id || index}
                                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-400/50 hover:shadow-xl transition-all duration-300 group flex flex-col"
                                    >
                                        {/* Cover */}
                                        <div className="relative aspect-video bg-slate-100 group-hover:scale-[1.02] transition-transform duration-500 overflow-hidden">
                                            {/* Play Icon Overlay */}
                                            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                                                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                                                </div>
                                            </div>

                                            {post.thumbnail_url ? (
                                                <img
                                                    src={post.thumbnail_url}
                                                    alt={post.description}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                                    <FileText className="w-12 h-12 opacity-50" />
                                                    <span className="text-xs">Chỉ có văn bản</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                                            {/* Stats Overlay */}
                                            <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-between items-end">
                                                <div className="flex items-center gap-1 text-white bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                                                    <Eye className="w-3 h-3 text-blue-400" />
                                                    <span className="text-xs font-bold">{formatNumber(post.views_count)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 flex flex-col flex-1">
                                            {/* Author */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <img
                                                    src={getAvatarUrl(post)}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate" title={post.author_name}>
                                                        {post.author_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">@{post.author_username}</p>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-700 line-clamp-2 mb-3 h-10" title={post.description}>
                                                {post.description || post.title || 'Không có mô tả.'}
                                            </p>

                                            {/* Metrics */}
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
                                                <div className="flex items-center gap-1 text-slate-500 text-xs" title="Likes">
                                                    <ThumbsUp className="w-3 h-3 text-blue-500" /> {formatNumber(post.likes_count)}
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-500 text-xs" title="Comments">
                                                    <MessageCircle className="w-3 h-3 text-green-500" /> {formatNumber(post.comments_count)}
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-500 text-xs" title="Shares">
                                                    <Share2 className="w-3 h-3 text-purple-500" /> {formatNumber(post.shares_count)}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                <a
                                                    href={post.video_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Xem
                                                </a>
                                                <a
                                                    href={post.download_url || post.video_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Download className="w-3.5 h-3.5" /> Tải
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-8 flex justify-center gap-2">
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
                                                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30'
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
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State */}
                {!loading && posts.length === 0 && !error && (
                    <div className="text-center py-20 text-slate-500">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Facebook className="w-8 h-8 text-blue-600 opacity-50" />
                        </div>
                        <p>Nhập từ khóa, hashtag hoặc username để tìm kiếm bài viết Facebook</p>
                    </div>
                )}
            </div>
        </div>
    );
}
