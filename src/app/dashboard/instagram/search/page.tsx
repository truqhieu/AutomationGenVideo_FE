'use client';

import { useState } from 'react';
import { Search, Hash, Loader2, Heart, MessageCircle, ChevronDown, TrendingUp } from 'lucide-react';

interface SearchResult {
    id: number;
    video_id: string;
    video_url: string;
    title: string;
    description: string;
    author_username: string;
    author_name: string;
    likes_count: number;
    views_count: number;
    comments_count: number;
    published_at: string;
    thumbnail_url: string;
    is_video: boolean;
}

export default function InstagramSearchPage() {
    const [hashtag, setHashtag] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [filterFallback, setFilterFallback] = useState(false);
    const [searchMode, setSearchMode] = useState<'hashtag' | 'keyword'>('hashtag');

    const VIDEOS_PER_BATCH = 5;
    const MIN_LIKES = 500;
    const MIN_VIEWS = 500;
    const MIN_COMMENTS = 50;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    const normalizeHashtag = (str: string) =>
        str.trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '').replace(/#/g, '');

    const getThumbnailSrc = (url: string) => {
        if (!url) return '/placeholder-image.jpg';
        if (url.startsWith('/')) return url;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return `${apiUrl}/image-proxy/?url=${encodeURIComponent(url)}`;
        }
        return url;
    };

    const handleSearchModeChange = (mode: 'hashtag' | 'keyword') => {
        if (mode === searchMode) return;
        setSearchMode(mode);
        setResults([]);
        setHasSearched(false);
        setCurrentPage(1);
        setHasMore(false);
        setFilterFallback(false);
        setError('');
    };

    const performSearch = async (isLoadMore: boolean = false) => {
        if (!hashtag.trim()) {
            setError('Please enter a hashtag');
            return;
        }

        const pageToFetch = isLoadMore ? currentPage + 1 : 1;
        if (isLoadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setResults([]);
            setCurrentPage(1);
            setHasSearched(true);
        }

        setError('');

        try {
            const token = localStorage.getItem('auth_token');

            const keyword = searchMode === 'hashtag'
                ? normalizeHashtag(hashtag)   // hashtag: "trang sức" -> "trangsuc"
                : hashtag.replace(/^#/, '').trim();  // keyword: giữ nguyên "trang sức"

            const response = await fetch(`${apiUrl}/ai/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    platform: 'instagram',
                    keyword,
                    search_type: 'posts',
                    search_mode: searchMode,
                    min_likes: MIN_LIKES,
                    min_views: MIN_VIEWS,
                    min_comments: MIN_COMMENTS,
                    max_results: VIDEOS_PER_BATCH,
                    page: pageToFetch,
                    use_cache: false,
                    async_mode: false,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || data.message || 'Search failed');

            const newResults = data.videos || data.results || [];
            setHasMore(data.has_more ?? false);
            setFilterFallback(data.filter_fallback ?? false);
            setCurrentPage(pageToFetch);

            if (isLoadMore) {
                setResults(prev => [...prev, ...newResults]);
            } else {
                setResults(newResults);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during search');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const formatNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) return 'Invalid Date';

            const now = new Date();
            const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diff < 60) return 'now';
            if (diff < 3600) return `${Math.floor(diff / 60)}m`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
            if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <Hash className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Instagram Hashtag Search</h1>
                    </div>
                    <p className="text-gray-600 ml-15">
                        Tìm theo hashtag hoặc keyword • Filter: ≥1K likes OR ≥1K views OR ≥100 comments
                    </p>
                </div>

                {/* Search Box */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    {/* Search Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => handleSearchModeChange('hashtag')}
                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${searchMode === 'hashtag'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            # Hashtag
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSearchModeChange('keyword')}
                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${searchMode === 'keyword'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Keyword
                        </button>
                    </div>
                    {/* Input */}
                    <div className="relative mb-4">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600">
                            {searchMode === 'hashtag' ? (
                                <Hash className="w-5 h-5" />
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                        </div>
                        <input
                            type="text"
                            value={hashtag}
                            onChange={(e) => setHashtag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && performSearch(false)}
                            placeholder={searchMode === 'hashtag' ? 'trangsuc, fashion, beauty...' : 'trang sức, jewelry, fashion...'}
                            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    {/* Popular Hashtags */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">Popular:</span>
                        {['fashion', 'travel', 'food', 'fitness', 'photography'].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setHashtag(tag)}
                                className="px-3 py-1 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full text-xs font-medium transition-colors"
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={() => performSearch(false)}
                        disabled={loading || !hashtag.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Tìm Kiếm
                            </>
                        )}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Results */}
                {results.length > 0 && (
                    <>
                        {filterFallback && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                <p className="text-amber-800 text-sm">
                                    Không có bài đạt ngưỡng (≥1K likes, ≥1K views hoặc ≥100 comments). Đang hiển thị tất cả {results.length} bài tìm được.
                                </p>
                            </div>
                        )}
                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {results.length} {results.length === 1 ? 'Post' : 'Posts'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Page {currentPage} • {searchMode === 'hashtag' ? `#${normalizeHashtag(hashtag)}` : hashtag.replace(/^#/, '').trim()}
                                </p>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                            {results.map((post) => (
                                <div key={post.video_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                                    {/* Thumbnail */}
                                    <div className="aspect-square relative bg-gray-100">
                                        <img
                                            src={getThumbnailSrc(post.thumbnail_url)}
                                            alt={post.description || 'Instagram post'}
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                const t = e.target as HTMLImageElement;
                                                if (t.src && t.src.includes('image-proxy')) {
                                                    t.src = post.thumbnail_url || 'https://placehold.co/400x400?text=No+Image';
                                                } else {
                                                    t.src = 'https://placehold.co/400x400?text=No+Image';
                                                }
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                                            {post.is_video ? 'Video' : 'Image'}
                                        </div>
                                        <a
                                            href={post.video_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        >
                                            <div className="bg-white/90 p-2 rounded-full transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                <Search className="w-5 h-5 text-gray-900" />
                                            </div>
                                        </a>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                                                {post.author_username?.[0]?.toUpperCase() || '#'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    @{post.author_username || 'unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(post.published_at)}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 line-clamp-2 mb-3 h-10">
                                            {post.description || post.title || 'No caption'}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-3.5 h-3.5" />
                                                {formatNumber(post.likes_count)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                {formatNumber(post.comments_count)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Scan Next Page Button */}
                        {hasMore && (
                            <div className="flex justify-center pb-8">
                                <button
                                    onClick={() => performSearch(true)}
                                    disabled={loadingMore}
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang tải...
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4" />
                                            Scan Next Page
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State - No Results */}
                {!loading && results.length === 0 && hasSearched && !error && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
                        <p className="text-gray-600 mb-4">Try a different hashtag or check your spelling</p>
                        <button
                            onClick={() => {
                                setHashtag('');
                                setResults([]);
                                setHasSearched(false);
                                setError('');
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State - Initial */}
                {!loading && !hasSearched && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
                            <Hash className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to explore?</h3>
                        <p className="text-gray-600">Enter a hashtag above to start discovering Instagram posts</p>
                    </div>
                )}
            </div>
        </div>
    );
}
