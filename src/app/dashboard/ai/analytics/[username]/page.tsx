'use client';



import { useState, useEffect, useCallback, useRef } from 'react';

import { useParams, useSearchParams, useRouter } from 'next/navigation';

import { 

  TrendingUp, 

  Users, 

  Heart, 

  MessageCircle, 

  Share2, 

  ArrowLeft,

  Calendar,

  Download,

  Clock,

  Zap,

  Eye,

  Video,

  CheckCircle2,

  Home,

  ChevronRight,

  TrendingDown

} from 'lucide-react';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamic imports for improved performance
const PerformanceChart = dynamic(() => import('./PerformanceChart'), { 
  loading: () => <div className="h-[300px] bg-slate-100/50 animate-pulse rounded-2xl" />,
  ssr: false 
});
const FollowerGrowthChart = dynamic(() => import('./FollowerGrowthChart'), { 
  loading: () => <div className="h-[300px] bg-slate-100/50 animate-pulse rounded-2xl" />,
  ssr: false 
});
const EngagementBreakdown = dynamic(() => import('./EngagementBreakdown'), { 
  loading: () => <div className="h-[300px] bg-slate-100/50 animate-pulse rounded-2xl" />,
  ssr: false 
});
const BestPostingTimes = dynamic(() => import('./BestPostingTimes'), { 
  loading: () => <div className="h-[300px] bg-slate-100/50 animate-pulse rounded-2xl" />,
  ssr: false 
});
const VideoDurationAnalysis = dynamic(() => import('./VideoDurationAnalysis'), { 
  loading: () => <div className="h-[300px] bg-slate-100/50 animate-pulse rounded-2xl" />,
  ssr: false 
});
const PostingStats = dynamic(() => import('./PostingStats'), { 
  loading: () => <div className="h-[150px] bg-slate-100/50 animate-pulse rounded-2xl" />,
  ssr: false 
});
const TopViralVideos = dynamic(() => import('./TopViralVideos'), { 
  loading: () => <div className="h-[400px] bg-slate-100/50 animate-pulse rounded-2xl" />,
  ssr: false 
});



export default function ChannelAnalyticsPage() {

  const params = useParams();

  const searchParams = useSearchParams();

  const router = useRouter();

  

  const username = (params.username as string) || '';

  const platform = searchParams.get('platform') || 'tiktok';
  
  // Debug: Log platform value
  console.log('🔍 Analytics Page - URL params:', { username, platform, fullSearchParams: searchParams.toString() });



  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<any>(null);

  const [videos, setVideos] = useState<any[]>([]);

  const [stats, setStats] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  

  // Date range state

  const [startDate, setStartDate] = useState<string>('');

  const [endDate, setEndDate] = useState<string>('');



  const ignoreNextFetch = useRef(false);

  // Pass date params explicitly to avoid dependency loop
  const fetchChannelData = useCallback(async (currentStart?: string, currentEnd?: string) => {
    // Use passed args to ensure we use the values that triggered the effect
    const effectiveStart = currentStart;
    const effectiveEnd = currentEnd;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!username) {
        throw new Error('Username is required');
      }

      // Smart max_results calculation
      let smartMaxResults = 50;
      if (effectiveStart && effectiveEnd) {
          const start = new Date(effectiveStart);
          const end = new Date(effectiveEnd);
          const timeDiff = end.getTime() - start.getTime();
          // Ensure at least 1 day count even if start == end
          const daysDiff = Math.max(Math.ceil(timeDiff / (1000 * 60 * 60 * 24)), 1);
          
          // User requested strict "days * 8" logic logic provided by user
          // Removed the hard floor of 50. 
          smartMaxResults = Math.min(daysDiff * 8, 300);
          
          // Minimum safety of 5 to avoid 0
          smartMaxResults = Math.max(smartMaxResults, 5);
      }

      const requestBody = {
        platform: (platform || 'tiktok').toLowerCase(),
        username: username,
        max_results: smartMaxResults,
        start_date: effectiveStart || undefined,
        end_date: effectiveEnd || undefined
      };

      console.log(`[${platform.toUpperCase()}] Fetching fresh data:`, requestBody);
      console.log(`[${platform.toUpperCase()}] API URL: http://localhost:3000/api/ai/user-videos`);

      const response = await fetch(`http://localhost:3000/api/ai/user-videos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`[${platform.toUpperCase()}] Response status:`, response.status);
      
      const data = await response.json();
      console.log(`[${platform.toUpperCase()}] Response data:`, data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch videos');
      }

      const videoList = data.results || [];
      setVideos(videoList);

      if (data.profile) {
        setProfile(data.profile);
      }

      processAnalytics(videoList);

      // Auto-clear filter after successful fetch if it was set
      if (effectiveStart && effectiveEnd) {
        ignoreNextFetch.current = true; // Block the effect from the state update below
        setStartDate('');
        setEndDate('');
        console.log('✅ Filters auto-cleared, data preserved.');
      }

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [username, platform]); 

  // Set default 3-day filter for Instagram on initial load
  useEffect(() => {
    if (username && platform.toLowerCase() === 'instagram' && !startDate && !endDate) {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);
      
      const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
      };
      
      const start = formatDateForInput(threeDaysAgo);
      const end = formatDateForInput(today);
      
      console.log('📸 Instagram: Setting default 3-day filter', { start, end });
      setStartDate(start);
      setEndDate(end);
    }
  }, [username, platform]); // Only run when username or platform changes

  // Initial fetch and Auto-fetch on date change
  useEffect(() => {
    // If we just auto-cleared, skip this effect run
    if (ignoreNextFetch.current) {
        ignoreNextFetch.current = false;
        return;
    }

    if (username) {
      // For Instagram: only fetch when filter is set (default 3-day or user input)
      // For other platforms: fetch immediately or when filter changes
      const isInstagram = platform.toLowerCase() === 'instagram';
      
      if (isInstagram) {
        // Instagram: Only fetch when both dates are set
        if (startDate && endDate) {
          fetchChannelData(startDate, endDate);
        }
      } else {
        // Other platforms: fetch with or without filter
        if ((startDate && endDate) || (!startDate && !endDate)) {
          fetchChannelData(startDate, endDate);
        }
      }
    }
  }, [fetchChannelData, startDate, endDate, username, platform]);

  // Legacy effect removal (handled by fetchChannelData now)
  // useEffect(() => { if (username) fetchChannelData(); }, [username, platform]);



  const formatDate = (dateStr: string) => {

    if (!dateStr) return 'N/A';

    const date = new Date(dateStr);

    const day = date.getDate().toString().padStart(2, '0');

    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const year = date.getFullYear();

    return `${day}-${month}-${year}`;

  };



  const processAnalytics = (videoList: any[], aggregateStats?: any) => {

    if (!videoList) return;

    setVideos(videoList);

    

    // Initial stats (Total / All Time)

    const totalLikes = aggregateStats?.total_likes || videoList.reduce((sum, v) => sum + (Number(v?.likes_count) || 0), 0);

    const totalViews = aggregateStats?.total_views || videoList.reduce((sum, v) => sum + (Number(v?.views_count) || 0), 0);

    const totalComments = aggregateStats?.total_comments || videoList.reduce((sum, v) => sum + (Number(v?.comments_count) || 0), 0);

    const totalShares = aggregateStats?.total_shares || videoList.reduce((sum, v) => sum + (Number(v?.shares_count) || 0), 0);

    const videoCount = aggregateStats?.total_videos || videoList.length;



    const avgEngagement = totalViews > 0 

      ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 

      : 0;



    setStats({

      // All time stats (for Summary Header)

      totalLikes,

      totalViews,

      totalComments,

      totalShares,

      videoCount,

      avgEngagement: avgEngagement.toFixed(2),

      

      // Filtered stats (initially same as all time)

      filteredLikes: totalLikes,

      filteredViews: totalViews,

      filteredComments: totalComments,

      filteredShares: totalShares,

      filteredVideoCount: videoCount,

      filteredEngagement: avgEngagement.toFixed(2),

    });



    // Only set fallback profile data if we don't have profile from API

    if (videoList.length > 0 && videoList[0] && !profile) {

      console.log('⚠️ Setting fallback profile (API call might have failed)');

      setProfile((prev: any) => {

        const newProfile = {

          ...prev, // Keep existing data (like total_followers from API)

          name: prev?.name || videoList[0]?.author_name || username,

          display_name: prev?.display_name || videoList[0]?.author_name || username,

          username: prev?.username || videoList[0]?.author_username || username,

          avatar_url: prev?.avatar_url || videoList[0]?.thumbnail_url || '', // Use thumbnail ONLY if avatar is missing

        };

        console.log('🔄 Fallback Profile:', newProfile);

        return newProfile;

      });

    } else {

      console.log('✅ Profile already exists from API, not overriding');

    }

  };



  const formatNumber = (num: number | undefined | null) => {

    if (!num && num !== 0) return '0';

    return new Intl.NumberFormat('en-US').format(num);

  };



  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-slate-50">

        <div className="text-center">

            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"/>

            <p className="text-slate-600 font-medium">Loading analytics...</p>

        </div>

      </div>

    );

  }



  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;



  return (

    <div className="min-h-screen bg-[#F8F9FC] p-6 pb-20">

      

      {/* Breadcrumbs */}

      <div className="max-w-[1600px] mx-auto mb-6 flex items-center gap-2 text-sm text-slate-500">

        <Home className="w-4 h-4" />

        <ChevronRight className="w-4 h-4" />

        <span className="capitalize">{platform}</span>

        <ChevronRight className="w-4 h-4" />

        <span className="font-medium text-slate-900">{profile?.name || username}</span>

      </div>



      <div className="max-w-[1600px] mx-auto space-y-8">

         

         {/* Top Profile & Summary Stats Card */}

         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">

             

             {/* Left: Profile Info */}

             <div className="flex items-center gap-5 min-w-[300px]">

                 <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0">

                     <img src={profile?.avatar_url} alt={profile?.name} className="w-full h-full rounded-full object-cover border-2 border-white" referrerPolicy="no-referrer" />

                 </div>

                 <div>

                     <div className="flex items-center gap-3 mb-1">

                        <h1 className="text-2xl font-bold text-slate-900">{profile?.display_name || profile?.name}</h1>

                        <span className="px-3 py-1 bg-black text-white text-[10px] rounded-full font-bold uppercase tracking-wider">{platform}</span>

                     </div>

                     <p className="text-slate-500 text-sm">@{profile?.username}</p>

                 </div>

             </div>



             {/* Right: Summary Modules */}

             {/* Right: Back Button */}
             <div className="flex items-center">
                 <button 
                    onClick={() => router.back()}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all duration-300 shadow-sm hover:shadow-md"
                 >
                     <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                     <span className="font-medium">Quay lại</span>
                 </button>
             </div>

         </div>



         {/* Filter Section */}

         <div className="flex flex-col sm:flex-row justify-end items-center gap-4">

             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">

                <Calendar className="w-4 h-4" /> Date Range

             </div>

             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">

                <input 
                    type="date" 
                    value={startDate} 
                    max={endDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm font-medium text-slate-600 outline-none bg-transparent"
                />

                <span className="text-slate-400">-</span>

                <input 
                    type="date" 
                    value={endDate}
                    min={startDate} 
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm font-medium text-slate-600 outline-none bg-transparent"
                />

             </div>

             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium shadow-sm transition-colors">

                 <Download className="w-4 h-4" /> Export

             </button>

         </div>



         {/* Detailed Stats Grid */}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

             

             {/* Videos Posted */}

             <StatsCard 

                icon={<Video className="w-5 h-5 text-blue-500" />}

                label="Videos Posted"

                value={stats?.filteredVideoCount}

                change={0.0}

             />



             {/* Total Views */}

             <StatsCard 

                icon={<Eye className="w-5 h-5 text-purple-500" />}

                label="Total Views"

                value={stats?.filteredViews}

                change={51.3}

             />



             {/* Total Likes */}

             <StatsCard 

                icon={<Heart className="w-5 h-5 text-pink-500" />}

                label="Total Likes"

                value={stats?.filteredLikes}

                change={60.2}

             />



             {/* Comments */}

             <StatsCard 

                icon={<MessageCircle className="w-5 h-5 text-indigo-500" />}

                label="Comments"

                value={stats?.filteredComments}

                change={52.3}

             />



             {/* Shares */}

             <StatsCard 

                icon={<Share2 className="w-5 h-5 text-emerald-500" />}

                label="Shares"

                value={stats?.filteredShares}

                change={86.0}

             />



             {/* Total Engagement */}

             <StatsCard 

                icon={<Zap className="w-5 h-5 text-amber-500" />}

                label="Total Engagement"

                value={formatNumber(Number(stats?.filteredLikes || 0) + Number(stats?.filteredComments || 0) + Number(stats?.filteredShares || 0))}

                change={66.2}

                isNumberString={true}

             />



             {/* Engagement Rate */}

             <StatsCard 

                icon={<TrendingUp className="w-5 h-5 text-cyan-500" />}

                label="Engagement Rate"

                value={`${stats?.filteredEngagement}%`}

                change={4.0}

                isNumberString={true}

             />



             {/* Followers (Clone) */}

             <StatsCard 

                icon={<Users className="w-5 h-5 text-slate-500" />}

                label="Followers"

                value={profile?.total_followers || 0}

                change={0.0}

                subLabel="+104 this period"

             />



         </div>



          {/* Charts Section */}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            <PerformanceChart videos={videos} />

            <FollowerGrowthChart />

          </div>



          {/* Row 3: Activity & Best Times */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <PostingStats videos={videos} />

            <EngagementBreakdown stats={stats} />

            <BestPostingTimes videos={videos} />

          </div>



          {/* Row 2: Video Duration Analysis - Full Width */}

          <div>

            <VideoDurationAnalysis videos={videos} />

          </div>



          {/* Row 3: Top Viral Videos - Full Width */}

          <div>

            <TopViralVideos videos={videos} />

          </div>



      </div>

    </div>

  );

}



// Stats Card Component for reusability matches the Screenshot design style

function StatsCard({ icon, label, value, change, isNumberString = false, subLabel }: any) {

    const isPositive = change >= 0;

    

    // Simple formatter for mixed types

    const displayValue = isNumberString ? value : new Intl.NumberFormat('en-US').format(Number(value) || 0);



    return (

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow">

            <div className="flex items-center gap-2 mb-3">

                {icon}

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>

            </div>

            

            <h3 className="text-2xl font-bold text-slate-800 mb-3">{displayValue}</h3>

            

            <div className="flex items-center gap-2">

                <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>

                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}

                    {Math.abs(change)}%

                </span>

                <span className="text-[10px] text-slate-400 font-medium">vs previous</span>

                {subLabel && <span className="text-[10px] text-emerald-600 font-medium ml-1">{subLabel}</span>}

            </div>

        </div>

    );

}

