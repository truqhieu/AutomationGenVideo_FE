'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Video, Image as ImageIcon,
    BarChart3, LayoutGrid, Loader2, Users,
    ThumbsUp, MessageCircle, Share2, TrendingUp
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line
} from 'recharts';

import { FacebookPost, ImageWithFallback } from './components/common';
import { ReelsAnalytics } from './components/ReelsView';
import { PostsAnalytics } from './components/PostsView';

const Avatar = ({ src, alt, fallback }: { src?: string, alt: string, fallback: string }) => {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 text-xl shadow-sm">
                {(fallback || 'U')[0].toUpperCase()}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className="w-12 h-12 rounded-full border border-slate-100 shadow-sm object-cover"
            onError={() => setError(true)}
        />
    );
};

export default function FacebookAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<FacebookPost[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [error, setError] = useState('');
    const [hasFetched, setHasFetched] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState<'all' | 'video' | 'post'>('all');
    const [showAllContent, setShowAllContent] = useState(false);
    const [visibleCount, setVisibleCount] = useState(1000); // Default high to show all initially


    // Date Range State (Default: Last 3 days)
    const [startDate, setStartDate] = useState(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Temporary date states for user selection (before applying)
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);

    const startDateRef = useRef(startDate);
    const endDateRef = useRef(endDate);
    const ignoreNextFetch = useRef(false);
    const isFetchingRef = useRef(false); // Prevent duplicate calls

    useEffect(() => {
        startDateRef.current = startDate;
        endDateRef.current = endDate;
    }, [startDate, endDate]);

    const fetchData = useCallback(async (currentStart?: string, currentEnd?: string, forceRefresh: boolean = false) => {
        if (!username) return;

        // Prevent duplicate concurrent calls
        if (isFetchingRef.current) {
            console.log('⚠️ Already fetching, skipping duplicate call');
            return;
        }

        isFetchingRef.current = true;

        const effectiveStart = currentStart ?? startDateRef.current;
        const effectiveEnd = currentEnd ?? endDateRef.current;

        setLoading(true);
        setError('');

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        let timeoutId: NodeJS.Timeout | undefined;

        try {
            // Calculate smart max_results based on date range
            let smartMaxResults = 100; // Default

            if (effectiveStart && effectiveEnd) {
                const start = new Date(effectiveStart);
                const end = new Date(effectiveEnd);
                const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                // Estimate ~20 posts per day (conservative)
                smartMaxResults = daysDiff * 20;
                console.log(`📊 Date range: ${effectiveStart} to ${effectiveEnd} (${daysDiff} days) -> Max Limit: ${smartMaxResults}`);
            } else {
                // Default if no range: fetch last 30 items
                smartMaxResults = 30;
            }

            console.log(`🔍 Fetching data with forceRefresh=${forceRefresh}, start=${effectiveStart}, end=${effectiveEnd}`);

            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 3600000); // 3600s = 1 hour timeout


            const response = await fetch(`${baseUrl}/ai/user-videos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    platform: 'facebook',
                    username: username,
                    max_results: smartMaxResults,
                    start_date: effectiveStart || undefined,
                    end_date: effectiveEnd || undefined,
                    force_refresh: forceRefresh // Use parameter instead of hardcoded false
                }),
                signal: controller.signal // Add abort signal for timeout
            });

            clearTimeout(timeoutId); // Clear timeout if request completes

            if (!response.ok) {
                throw new Error(`Lỗi kết nối: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            // Check if data is being updated in background
            if (result.is_updating) {
                console.log('📊 Showing cached data, will update in background');
            }

            if (result.profile) {
                setProfile(result.profile);
            }

            const posts = result.results || result.videos || [];
            console.log('📦 Data received from API:', posts.length);

            if (Array.isArray(posts)) {
                const mappedData: FacebookPost[] = posts.map((item: any) => {
                    // Log item to inspect structure if thumbnail missing
                    if (!item.thumbnail_url && !item.thumbnail && !item.image && !item.images?.length) {
                        console.log('⚠️ Missing thumbnail for item:', item);
                    }

                    const thumbnail = item.thumbnail_url || item.thumbnail || item.image || item.imageUrl || item.fullImage || (item.images && item.images.length > 0 ? item.images[0] : '') || '';

                    const url = item.url || item.video_url || item.postUrl || '#';
                    const isVideoUrl = url.includes('/reel/') || url.includes('/videos/') || url.includes('/watch') || url.includes('video');

                    return {
                        id: item.id || item.video_id || `post-${Math.random()}`,
                        text: item.title || item.description || '',
                        url: url,
                        timestamp: item.timestamp || Math.floor(new Date(item.published_at || item.createdAt || Date.now()).getTime() / 1000),
                        time: new Date((item.timestamp || Date.now() / 1000) * 1000).toISOString(),
                        isVideo: item.is_video ?? (item.isVideo ?? (Boolean(item.download_url) || isVideoUrl)),
                        thumbnail: thumbnail,
                        likes: item.likes_count || item.like_count || item.likes || 0,
                        comments: item.comments_count || item.comment_count || item.comments || 0,
                        shares: item.shares_count || item.share_count || item.shares || 0,
                        views: item.views_count || item.view_count || item.views || 0
                    };
                });

                setData(mappedData);
                setHasFetched(true);
                // Auto-expand visible count if data is loaded to avoid "hidden" items feeling
                setVisibleCount(prev => Math.max(prev, mappedData.length));

                // Show info message if data is being updated
                if (result.is_updating && result.message) {
                    console.log(`ℹ️ ${result.message}`);
                    // You can add a toast notification here if you have a toast library
                }

                // REMOVED auto-clear logic.
                const hasDateFilter = !!(effectiveStart && effectiveEnd);
                if (hasDateFilter) {
                    console.log('✅ Data fetched with filter. Filter preserved.');
                }

            } else {
                setData([]);
                setHasFetched(true);
            }

        } catch (err: any) {
            clearTimeout(timeoutId); // Clear timeout on error

            if (err.name === 'AbortError') {
                setError('Request timeout sau 1 giờ. Vui lòng thử lại hoặc giảm phạm vi ngày.');
                console.error('⏱️ Request timeout after 3600s');
            } else {
                setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
                console.error(err);
            }
        } finally {
            setLoading(false);
            isFetchingRef.current = false; // Reset flag
        }
    }, [username]);

    // REMOVED auto-fetch on date change
    // Users must click "Apply" button to trigger fetch

    // Initial fetch on mount - ALWAYS FORCE REFRESH
    useEffect(() => {
        console.log(`📍 useEffect triggered: username=${username}, hasFetched=${hasFetched}, startDate=${startDate}, endDate=${endDate}`);
        if (username && !hasFetched) {
            console.log('🔄 Initial load: Force refreshing data from Facebook...');
            console.log(`🔄 Calling fetchData(${startDate}, ${endDate}, true)`);
            fetchData(startDate, endDate, true); // force_refresh = true
        }
    }, [username]); // Only run once on mount

    // Manual apply filter function
    const handleApplyFilter = () => {
        // Basic validation (calendar already limits to 14 days)
        if (tempStartDate && tempEndDate) {
            const start = new Date(tempStartDate);
            const end = new Date(tempEndDate);

            if (start > end) {
                alert('⚠️ Ngày bắt đầu phải trước ngày kết thúc.');
                return;
            }
        }

        console.log('🔄 Manual filter applied:', { tempStartDate, tempEndDate });
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        fetchData(tempStartDate, tempEndDate);
    };

    // Combined stats for "All" tab
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Filter by Time Range
            if (!startDate || !endDate) return true;
            const itemDate = new Date(item.timestamp * 1000);
            const start = new Date(startDate); start.setHours(0, 0, 0, 0);
            const end = new Date(endDate); end.setHours(23, 59, 59, 999);
            return itemDate >= start && itemDate <= end;
        });
    }, [data, startDate, endDate]);

    const stats = useMemo(() => {
        const totalLikes = filteredData.reduce((sum, item) => sum + item.likes, 0);
        const totalComments = filteredData.reduce((sum, item) => sum + item.comments, 0);
        const totalViews = filteredData.reduce((sum, item) => sum + item.views, 0);
        const totalShares = filteredData.reduce((sum, item) => sum + item.shares, 0);
        const totalItems = filteredData.length;

        const engagementRate = totalViews > 0
            ? ((totalLikes + totalComments + totalShares) / totalViews) * 100
            : 0;

        return {
            totalLikes,
            totalComments,
            totalViews,
            totalShares,
            totalItems,
            engagementRate: engagementRate.toFixed(2)
        };
    }, [filteredData]);

    // Chart data for All view - AGGREGATE BY DATE
    const chartData = useMemo(() => {
        // Group by date and aggregate metrics
        const dateMap = new Map<string, {
            date: string;
            likes: number;
            comments: number;
            shares: number;
            views: number;
            engagement: number;
            count: number;
        }>();

        filteredData.forEach(item => {
            const dateKey = new Date(item.timestamp * 1000).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, {
                    date: dateKey,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    views: 0,
                    engagement: 0,
                    count: 0
                });
            }

            const existing = dateMap.get(dateKey)!;
            existing.likes += item.likes;
            existing.comments += item.comments;
            existing.shares += item.shares;
            existing.views += item.views;
            existing.engagement += (item.likes + item.comments + item.shares);
            existing.count += 1;
        });

        // Convert to array and sort by date
        return Array.from(dateMap.values())
            .sort((a, b) => {
                const dateA = new Date(a.date.split('/').reverse().join('-'));
                const dateB = new Date(b.date.split('/').reverse().join('-'));
                return dateA.getTime() - dateB.getTime();
            });
    }, [filteredData]);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-subtle">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar
                            src={profile?.avatar_url}
                            alt={profile?.display_name || username}
                            fallback={profile?.display_name || profile?.username || username || 'U'}
                        />
                        <div>
                            <h1 className="font-bold text-slate-800 text-lg leading-tight">
                                {profile?.display_name || profile?.username || username}
                            </h1>
                            <div className="text-[10px] font-bold tracking-widest text-slate-400 mt-0.5">FACEBOOK ANALYTICS</div>
                        </div>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all font-semibold text-sm shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 animate-pulse">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">🔄 Đang cập nhật dữ liệu mới nhất từ Facebook...</p>
                        <p className="text-xs text-slate-400 mt-2">Việc này có thể mất vài phút với dữ liệu lớn</p>
                        <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700 font-medium">💡 Đang quét posts mới nhất, không dùng cache</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-red-200">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-8 h-8" />
                        </div>
                        <h3 className="text-slate-800 font-bold text-lg mb-2">Đã xảy ra lỗi</h3>
                        <p className="text-slate-500 mb-6">{error}</p>
                        <button onClick={() => fetchData(startDate, endDate, true)} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Thử lại</button>
                    </div>
                ) : !hasFetched ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Bắt đầu phân tích</h2>
                        <p className="text-slate-500 mb-10 max-w-md text-center">Chọn loại dữ liệu bạn muốn thống kê từ kênh này</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                            <button
                                onClick={() => { setActiveTab('all'); fetchData(startDate, endDate, true); }}
                                className="col-span-1 md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all group text-left relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <LayoutGrid className="w-24 h-24 text-purple-600" />
                                </div>
                                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <LayoutGrid className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Tất cả nội dung</h3>
                                <p className="text-sm text-slate-500">Xem toàn bộ bài viết, video và hình ảnh.</p>
                            </button>

                            <div className="grid grid-cols-2 gap-6 w-full col-span-1 md:col-span-2">
                                <button
                                    onClick={() => { setActiveTab('video'); fetchData(startDate, endDate, true); }}
                                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group text-left relative overflow-hidden"
                                >
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Video className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">Reels / Videos</h3>
                                </button>

                                <button
                                    onClick={() => { setActiveTab('post'); fetchData(startDate, endDate, true); }}
                                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group text-left relative overflow-hidden"
                                >
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">Posts / Ảnh</h3>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

                        {/* Tabs Switcher & Date Filter Row */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex">
                                <button
                                    onClick={() => { setActiveTab('all'); setShowAllContent(false); }}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'all'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                        }`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => { setActiveTab('video'); setShowAllContent(false); }}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'video'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                        }`}
                                >
                                    <Video className="w-4 h-4" />
                                    Reels / Videos
                                </button>
                                <button
                                    onClick={() => { setActiveTab('post'); setShowAllContent(false); }}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'post'
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                        }`}
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Posts / Ảnh
                                </button>
                            </div>

                            {/* Date Range Picker with Apply Button */}
                            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 h-[52px]">
                                <div className="px-4 flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider border-r border-slate-100 h-full">
                                    <BarChart3 className="w-4 h-4" />
                                    <span>Thời gian:</span>
                                </div>
                                <div className="flex items-center gap-2 px-2">
                                    <input
                                        type="date"
                                        value={tempStartDate}
                                        max={tempEndDate || new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setTempStartDate(e.target.value)}
                                        className="bg-transparent text-slate-700 font-bold text-sm px-2 py-1.5 focus:outline-none cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
                                    />
                                    <span className="text-slate-300">|</span>
                                    <input
                                        type="date"
                                        value={tempEndDate}
                                        min={tempStartDate}
                                        max={(() => {
                                            // Calculate max date: min(today, startDate + 14 days)
                                            const today = new Date().toISOString().split('T')[0];
                                            if (!tempStartDate) return today;

                                            const start = new Date(tempStartDate);
                                            const maxEnd = new Date(start);
                                            maxEnd.setDate(start.getDate() + 14);

                                            const maxEndStr = maxEnd.toISOString().split('T')[0];
                                            return maxEndStr < today ? maxEndStr : today;
                                        })()}
                                        onChange={(e) => setTempEndDate(e.target.value)}
                                        className="bg-transparent text-slate-700 font-bold text-sm px-2 py-1.5 focus:outline-none cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={handleApplyFilter}
                                    disabled={!tempStartDate || !tempEndDate}
                                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all ml-1"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>

                        {/* --- RENDER CONTENT BASED ON TAB --- */}
                        {activeTab === 'all' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {/* Stats Grid for All */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-5 h-5" /></div>
                                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng Nội dung</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalItems.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">Nội dung trong khoảng thời gian này</div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><ThumbsUp className="w-5 h-5" /></div>
                                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                Tổng Likes
                                            </span>
                                        </div>
                                        <div className="text-3xl font-black text-rose-600 tracking-tight">
                                            {stats.totalLikes.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            Tổng like tất cả
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><MessageCircle className="w-5 h-5" /></div>
                                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Bình luận</span>
                                        </div>
                                        <div className="text-3xl font-black text-amber-600 tracking-tight">{stats.totalComments.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">Tổng bình luận</div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Share2 className="w-5 h-5" /></div>
                                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Lượt chia sẻ</span>
                                        </div>
                                        <div className="text-3xl font-black text-purple-600 tracking-tight">{stats.totalShares.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">Tổng lượt chia sẻ</div>
                                    </div>
                                </div>

                                {/* Chart for All */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                                Biểu đồ tương tác tổng hợp
                                            </h3>
                                            <p className="text-sm text-slate-500">Xu hướng Likes & Comments trên tất cả nội dung</p>
                                        </div>
                                    </div>

                                    <div className="h-[300px] w-full">
                                        {chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="colorLikesAll" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="likes"
                                                        stroke="#9333ea"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorLikesAll)"
                                                        name="Lượt thích"
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="comments"
                                                        stroke="#f59e0b"
                                                        strokeWidth={2}
                                                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                                                        activeDot={{ r: 6 }}
                                                        name="Bình luận"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <BarChart3 className="w-8 h-8 opacity-50 mb-2" />
                                                <p>Chưa có dữ liệu biểu đồ</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* List for All */}
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                                <LayoutGrid className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800">
                                                Danh sách tất cả <span className="text-slate-400 text-lg font-normal ml-1">({stats.totalItems})</span>
                                            </h3>
                                        </div>
                                        {!showAllContent && stats.totalItems > 0 && (
                                            <button
                                                onClick={() => setShowAllContent(true)}
                                                className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-xl hover:-translate-y-0.5"
                                            >
                                                <LayoutGrid className="w-4 h-4" />
                                                Hiển thị chi tiết
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                                        {filteredData.slice(0, showAllContent ? visibleCount : 8).map((item, idx) => (
                                            <div key={item.id || idx} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group relative">
                                                <div className="bg-slate-100 relative overflow-hidden aspect-square">
                                                    <ImageWithFallback
                                                        src={item.thumbnail}
                                                        alt={item.text}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        isVideo={item.isVideo}
                                                    />
                                                    {item.isVideo && (
                                                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                                                            <Video className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3">
                                                    <p className="text-xs font-medium text-slate-700 line-clamp-2 h-8 leading-relaxed">
                                                        {item.text || 'Không có mô tả'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'video' && (
                            <ReelsAnalytics data={data} loading={loading} />
                        )}

                        {activeTab === 'post' && (
                            <PostsAnalytics data={data} loading={loading} />
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
