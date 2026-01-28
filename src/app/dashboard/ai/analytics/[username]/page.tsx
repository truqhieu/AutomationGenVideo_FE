'use client';

import { useState, useEffect } from 'react';
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
import PerformanceChart from './PerformanceChart';
import FollowerGrowthChart from './FollowerGrowthChart';
import EngagementBreakdown from './EngagementBreakdown';
import BestPostingTimes from './BestPostingTimes';
import VideoDurationAnalysis from './VideoDurationAnalysis';
import PostingStats from './PostingStats';
import TopViralVideos from './TopViralVideos';

export default function ChannelAnalyticsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const username = (params.username as string) || '';
  const platform = searchParams.get('platform') || 'tiktok';

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Date range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (username) {
      fetchChannelData();
    } else {
      setError('Invalid channel username');
      setLoading(false);
    }
  }, [username, platform]);

  // Re-process stats for filtered date range
  useEffect(() => {
    if (videos.length > 0 && stats) {
      const filtered = videos.filter(v => {
        if (!v.published_at) return false;
        const pubDate = new Date(v.published_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start) {
            start.setHours(0, 0, 0, 0); 
        }
        if (end) {
            end.setHours(23, 59, 59, 999);
        }

        if (start && pubDate < start) return false;
        if (end && pubDate > end) return false;
        return true;
      });

      // Recalculate stats for the filtered period
      const newTotalLikes = filtered.reduce((sum, v) => sum + (Number(v?.likes_count) || 0), 0);
      const newTotalViews = filtered.reduce((sum, v) => sum + (Number(v?.views_count) || 0), 0);
      const newTotalComments = filtered.reduce((sum, v) => sum + (Number(v?.comments_count) || 0), 0);
      const newTotalShares = filtered.reduce((sum, v) => sum + (Number(v?.shares_count) || 0), 0);
      
      const newAvgEngagement = newTotalViews > 0 
        ? ((newTotalLikes + newTotalComments + newTotalShares) / newTotalViews) * 100 
        : 0;

      setStats((prev: any) => ({
        ...prev,
        // Update detailed stats based on filter
        filteredLikes: newTotalLikes,
        filteredViews: newTotalViews,
        filteredComments: newTotalComments,
        filteredShares: newTotalShares,
        filteredVideoCount: filtered.length,
        filteredEngagement: newAvgEngagement.toFixed(2),
      }));
    }
  }, [startDate, endDate, videos]);


  const fetchChannelData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!username) {
        throw new Error('Username is required');
      }
      
      // Fetch tracked channel info
      const channelResponse = await fetch(`http://localhost:3000/tracked-channels/by-username/${platform.toUpperCase()}/${encodeURIComponent(username)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        console.log('📊 Channel API Response:', channelData);
        console.log('👥 Total Followers:', channelData.total_followers);
        setProfile(channelData);
      }
      
            {/* Videos Search Limit */}
            {/* Previously 10000, explicitly verifying this remains high for full scan support */}
             const videosResponse = await fetch(`http://localhost:3000/ai/videos/by-channel?platform=${platform.toUpperCase()}&username=${encodeURIComponent(username)}&limit=10000&sortBy=views&order=desc`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const videosData = await videosResponse.json();
      
      if (videosData.success) {
        processAnalytics(videosData.results || [], videosData.aggregate_stats);
      } else {
        throw new Error(videosData.error || 'Failed to fetch videos');
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

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
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full xl:w-auto">
                 {/* Followers */}
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl min-w-[200px] border border-slate-100">
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase mb-1">Followers</p>
                        <p className="text-xl font-bold text-slate-800">{formatNumber(profile?.total_followers || 0)}</p>
                    </div>
                    <Users className="w-5 h-5 text-slate-300" />
                 </div>

                 {/* Total Likes */}
                 <div className="flex items-center justify-between p-4 bg-pink-50/50 rounded-xl min-w-[200px] border border-pink-100">
                    <div>
                        <p className="text-xs text-pink-400 font-medium uppercase mb-1">Total Likes</p>
                        <p className="text-xl font-bold text-slate-800">{formatNumber(stats?.totalLikes)}</p>
                    </div>
                    <Heart className="w-5 h-5 text-pink-300" />
                 </div>

                 {/* Videos */}
                 <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl min-w-[200px] border border-purple-100">
                    <div>
                        <p className="text-xs text-purple-400 font-medium uppercase mb-1">Videos</p>
                        <p className="text-xl font-bold text-slate-800">{formatNumber(stats?.videoCount)}</p>
                    </div>
                    <Video className="w-5 h-5 text-purple-300" />
                 </div>

                 {/* Processed/Analyzed */}
                 <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-xl min-w-[200px] border border-emerald-100">
                    <div>
                        <p className="text-xs text-emerald-500 font-medium uppercase mb-1">Processed</p>
                        <p className="text-xl font-bold text-slate-800">{formatNumber(stats?.videoCount)}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                 </div>
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
                    max={endDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm font-medium text-slate-600 outline-none bg-transparent"
                />
                <span className="text-slate-400">-</span>
                <input 
                    type="date" 
                    value={endDate}
                    min={startDate} 
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
