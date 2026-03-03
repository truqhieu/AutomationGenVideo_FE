'use client';

import React from 'react';
import ActivityKPIs from './components/ActivityKPIs';
import DashboardAnalytics from './components/DashboardAnalytics';
import ActivityFilters from './components/ActivityFilters';
import UserActivityCard, { UserActivity } from './components/UserActivityCard';
import ReportCard from './components/ReportCard';
import RankingView from './components/RankingView';
import ChecklistContainer from '@/components/checklist/ChecklistContainer';
import PersonalCharts from './components/PersonalCharts';
import {
    RefreshCw,
    Layout,
    User,
    FileText,
    LogOut,
    Settings,
    CheckSquare,
    ClipboardList,
    LayoutDashboard,
    Camera
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useSearchParams } from 'next/navigation';

const getAvatarUrl = (url: string | null, name: string) => {
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    if (url.includes('drive.google.com')) {
        // Extract ID from various Drive formats
        const match = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200`;
        }
    }
    return url;
};



const UserActivityPage = () => {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [activeTab, setActiveTab] = React.useState<'dashboard' | 'performance' | 'ranking' | 'personal' | 'daily_checklist'>('performance');
    const [reportOutstandings, setReportOutstandings] = React.useState<any[]>([]);
    const [reports, setReports] = React.useState<any[]>([]);
    const [summary, setSummary] = React.useState<any>(null);
    const [rankings, setRankings] = React.useState<any>(null);
    const [teamContributions, setTeamContributions] = React.useState<any[]>([]);
    const [groupContributions, setGroupContributions] = React.useState<any>(null);
    const [kpiMeta, setKpiMeta] = React.useState<{ kpiTotalInDb?: number; kpiFilteredForMonth?: number; kpiMonthFallback?: boolean } | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [userRole, setUserRole] = React.useState<string | null>(null);
    const [userTeam, setUserTeam] = React.useState<string | null>(null);
    const [personalHistory, setPersonalHistory] = React.useState<{
        history: any[],
        teamStats: any | null,
        companyStats?: any | null,
        userActivity: any | null,
        members: any[]
    }>({ history: [], teamStats: null, companyStats: null, userActivity: null, members: [] });

    // Filter states
    const [activeTeam, setActiveTeam] = React.useState('All');
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [searchName, setSearchName] = React.useState('');
    const [dailyFilter, setDailyFilter] = React.useState<'all' | 'video_win' | 'product_win' | 'idea' | 'difficulty'>('all');

    // Time filter states
    const [timeType, setTimeType] = React.useState('month');
    const [dateRange, setDateRange] = React.useState<{ start: Date; end: Date }>(() => {
        const start = new Date();
        start.setDate(1); // Mặc định từ đầu tháng
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return { start, end };
    });

    // Categorize teams dynamically based on teamContributions data
    const { globalTeams, vnTeams } = React.useMemo(() => {
        const globals: string[] = [];
        const vns: string[] = [];

        // Common keywords for Global teams
        const globalKeywords = ['global', 'jp', 'thái lan', 'đài loan', 'indo'];

        teamContributions.forEach(item => {
            const teamName = item.team || 'Khác';
            if (teamName === 'Khác') return;

            const isGlobal = globalKeywords.some(kw => teamName.toLowerCase().includes(kw));

            if (isGlobal && !globals.includes(teamName)) {
                globals.push(teamName);
            } else if (!isGlobal && !vns.includes(teamName)) {
                vns.push(teamName);
            }
        });

        return {
            globalTeams: globals.sort(),
            vnTeams: vns.sort()
        };
    }, [teamContributions]);

    // Helper to match team against active filter (supports 'All', 'All Global', 'All VN', individual team)
    const matchTeam = (teamName: string | null | undefined): boolean => {
        const safeTeam = (teamName || 'Khác').toLowerCase();
        if (activeTeam === 'All') return true;
        if (activeTeam === 'All Global') return globalTeams.some(t => t.toLowerCase() === safeTeam);
        if (activeTeam === 'All VN') return vnTeams.some(t => t.toLowerCase() === safeTeam);
        return safeTeam === activeTeam.toLowerCase();
    };

    React.useEffect(() => {
        fetchReports();
    }, [dateRange, activeTeam, user?.email]); // Fetch data whenever date range, filters or user changes

    React.useEffect(() => {
        if (activeTab === 'personal') {
            fetchHistory();
        }
    }, [activeTab, user?.email, searchName]);

    const fetchHistory = async () => {
        if (!user?.email) return;
        try {
            const params = new URLSearchParams();
            params.append('email', user.email);
            if (searchName && (userRole === 'admin' || userRole === 'manager' || userRole === 'leader')) {
                params.append('name', searchName);
            }
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/lark/personal-history?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();
            setPersonalHistory(data);
        } catch (error) {
            console.error('Failed to fetch personal history:', error);
        }
    };

    const fetchReports = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            // Build query params for the new API
            const params = new URLSearchParams();
            if (dateRange?.start) {
                const start = dateRange.start;
                params.append('startDate', `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`);
            }
            if (dateRange?.end) {
                const end = dateRange.end;
                params.append('endDate', `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`);
            }
            if (activeTeam !== 'All' && activeTeam !== 'All Global' && activeTeam !== 'All VN') {
                params.append('team', activeTeam);
            }
            params.append('requesterEmail', user.email);
            if (timeType) {
                params.append('timeType', timeType);
            }

            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/lark/user-activity?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();

            // Handle new response format { reports, summary, rankings, userRole, userTeam }
            const reportsList = data.reports || [];
            const summaryData = data.summary || null;
            const rankingsData = data.rankings || null;

            if (data.userRole) setUserRole(data.userRole.toLowerCase());
            if (data.userTeam) setUserTeam(data.userTeam);

            // Map backend data to frontend interface
            const mappedReports = reportsList.map((item: any) => ({
                id: item.id,
                name: item.name,
                position: item.position,
                team: item.team,
                avatar: getAvatarUrl(item.avatar, item.name),
                status: item.status, // Should be 'ĐÚNG HẠN' or 'CHƯA BÁO CÁO'
                submittedAt: item.date,
                time: item.date ? `${new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }).replace(/\//g, '-')}` : 'Chưa báo cáo',
                dailyGoal: item.kpi_day || 0,
                done: item.completed_day || 0,
                traffic: item.traffic_month ? item.traffic_month.toLocaleString('vi-VN') : '0',
                revenue: item.revenue_month ? item.revenue_month.toLocaleString('vi-VN') : '0',
                monthlyProgress: item.monthlyProgress || 0,
                checklist: {
                    fb: item.checklist?.fb || false,
                    ig: item.checklist?.ig || false,
                    tiktok: item.checklist?.tiktok || false,
                    youtube: item.checklist?.youtube || false,
                    zalo: item.checklist?.zalo || false,
                    lark: item.checklist?.lark || false,
                    captionHashtag: item.checklist?.caption || false,
                },
                videoCount: item.answers?.['Số video edit sử dụng >50% source từ quay?'] || 0,
                task_progress: item.task_progress || null,
                questions: [
                    {
                        question: 'NGÀY HÔM QUA CÔNG VIỆC BẠN CÓ CẢI GÌ KHIẾN BẠN TỰ HÀO VÀ THÍCH THÚ NHẤT?',
                        answer: item.answers?.['1.NGÀY HÔM QUA CÔNG VIỆC BẠN CÓ CẢI GÌ KHIẾN BẠN TỰ HÀO VÀ THÍCH THÚ NHẤT?'] ||
                            item.answers?.['1. BẠN ĐÃ KIỂM TRA CHẤT LƯỢNG NỘI DUNG VIDEO ĐẦU RA CỦA TEAM MÌNH CHƯA?'] ||
                            'Không có'
                    },
                    {
                        question: 'HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỢC ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?',
                        answer: item.answers?.['2. HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỂ ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?'] ||
                            item.answers?.['2. TEAM BẠN HÔM QUA CÓ THÀNH VIÊN NÀO CÓ VIDEO WIN NHẤT?'] ||
                            'Không có'
                    },
                    {
                        question: 'BẠN CÓ GẶP KHÓ KHĂN NÀO CẦN HỖ TRỢ KHÔNG?',
                        answer: item.answers?.['3. BẠN CÓ GẶP KHÓ KHĂN NÀO CẦN HỖ TRỢ KHÔNG?'] ||
                            item.answers?.['3. TEAM BẠN HÔM QUA CÓ GÌ ĐỔI MỚI ĐƯỢC ÁP DỤNG KHÔNG?'] ||
                            'Không có'
                    },
                    {
                        question: 'BẠN CÓ ĐÓNG GÓP Ý TƯỞNG HAY ĐỀ XUẤT GÌ KHÔNG?',
                        answer: item.answers?.['4. BẠN CÓ ĐÓNG GÓP Ý TƯỞNG HAY ĐỀ XUẤT GÌ KHÔNG?'] ||
                            item.answers?.['4. TEAM BẠN CÓ AI TRỄ DEADLINE HÔM QUA KHÔNG? LÝ DO VÀ PHƯƠNG ÁN?'] ||
                            'Không có'
                    },
                    {
                        question: 'BẠN CÓ SẢN PHẨM (A4 - A5) NÀO WIN MỚI KHÔNG? (>5K VIEW - >10 CMT HỎI GIÁ?)',
                        answer: item.answers?.['5. BẠN CÓ SẢN PHẨM (A4 - A5) NÀO WIN MỚI KHÔNG? (>5K VIEW - >10 CMT HỎI GIÁ?)'] ||
                            item.answers?.['5. TEAM BẠN HÔM QUA CÓ SẢN PHẨM NÀO WIN MỚI KHÔNG? ĐÃ THÔNG TIN LÊN GROUP NEW PRODUCT CHƯA?'] ||
                            'Không có'
                    },
                ]
            }));
            setReports(mappedReports);
            setSummary(data.summary || null);
            setRankings(rankingsData);
            setTeamContributions(data.teamContributions || []);
            setGroupContributions(data.groupContributions || null);
            setReportOutstandings(data.reportOutstandings || []);
            setKpiMeta(data.meta || null);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lark/update-outstanding-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, status }),
            });

            if (response.ok) {
                // Update local state to reflect change immediately
                setReportOutstandings(prev => prev.map(r =>
                    r.id === id ? { ...r, status } : r
                ));
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleCaptureFullPage = async () => {
        const container = document.getElementById('report-view-container');
        if (!container) return;

        try {
            const { toPng } = await import('html-to-image');

            // Scroll to top and wait for full stability
            const scrollY = window.scrollY;
            window.scrollTo(0, 0);
            await new Promise((r) => setTimeout(r, 1000));

            // Generate PNG using modern library
            const dataUrl = await toPng(container, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                }
            });

            const link = document.createElement('a');
            const now = new Date();
            const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

            link.href = dataUrl;
            link.download = `VCB_Report_${ts}.png`;
            link.click();

            window.scrollTo(0, scrollY);
        } catch (e) {
            console.error('Capture screenshot failed:', e);
            alert('Lỗi chụp màn hình. Hãy thử lại.');
        }
    };

    const allTabs = [
        { id: 'performance', label: 'Hiệu Suất', icon: RefreshCw },
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'ranking', label: 'BXH', icon: Layout },
        { id: 'personal', label: 'Tiến độ', icon: User },
        { id: 'daily_checklist', label: 'Checklist ngày', icon: ClipboardList }
    ];

    const visibleTabs = allTabs;

    return (
        <div id="report-view-container" className="min-h-screen bg-white p-6 space-y-10 selection:bg-blue-500/30">
            {/* Top Header Section with Xanh Trắng Theme */}
            <div className="absolute top-0 left-0 right-0 h-80 bg-blue-600 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent" />
            </div>

            <header className="relative z-10 space-y-8">
                {/* Logo & User Info */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="bg-white p-3 rounded-2xl shadow-xl shadow-blue-900/20 rotate-3">
                            <Layout className="text-blue-600 w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-widest uppercase italic drop-shadow-sm">
                                VCB <span className="text-blue-200">REPORT</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                <p className="text-[10px] font-black text-blue-100 tracking-widest uppercase">
                                    {userRole?.toUpperCase() || 'MEMBER'} Dashboard • {user?.full_name || 'User'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation - Centered & Glassmorphic */}
                <div className="flex justify-center">
                    <nav className="flex items-center gap-1.5 bg-white backdrop-blur-xl p-2 rounded-[1.5rem] border border-blue-100 shadow-2xl shadow-blue-900/10">
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 -translate-y-0.5'
                                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <div className="relative z-10 space-y-14">
                <div className="relative z-30 bg-white/80 backdrop-blur-md p-4 rounded-[2rem] border border-white/20 shadow-xl shadow-slate-200/50">
                    <ActivityFilters
                        activeTeam={activeTeam}
                        setActiveTeam={setActiveTeam}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        searchName={searchName}
                        setSearchName={setSearchName}
                        userRole={userRole}
                        userTeam={userTeam}
                        activeTab={activeTab}
                        globalTeams={globalTeams}
                        vnTeams={vnTeams}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        timeType={timeType}
                        setTimeType={setTimeType}
                        onCapture={handleCaptureFullPage}
                    />
                </div>

                {/* KPI Cards section */}
                {activeTab !== 'personal' && (
                    <div className="relative z-10 transition-all duration-500 space-y-3">
                        {kpiMeta && kpiMeta.kpiTotalInDb === 0 && (
                            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                                <strong>Chưa có dữ liệu bảng larkKPI.</strong> Số liệu thống kê và card nhân viên lấy từ bảng này. Vui lòng đồng bộ KPI từ Lark (gọi API sync KPI hoặc dùng menu cấu hình backend).
                            </div>
                        )}
                        {kpiMeta?.kpiMonthFallback && (
                            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                                Đang hiển thị toàn bộ KPI trong DB vì không có bản ghi khớp tháng đang chọn. Để lọc đúng tháng, hãy đặt cột &quot;Tháng&quot; trong Lark đúng format (VD: T2, 2, Tháng 2) rồi đồng bộ lại.
                            </div>
                        )}
                        <ActivityKPIs summary={summary} teamContributions={teamContributions} groupContributions={groupContributions} />
                    </div>
                )}

                {/* Main Content Area */}
                <main className="min-h-[60vh]">
                    {activeTab === 'dashboard' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <DashboardAnalytics
                                dateRange={dateRange}
                                activeTeam={activeTeam}
                            />
                        </div>
                    ) : activeTab === 'performance' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {reports.filter(r => matchTeam(r.team) && (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase())).map((report, idx) => (
                                <UserActivityCard
                                    key={report.id || idx}
                                    data={{
                                        ...report,
                                        reportStatus: report.status
                                    }}
                                    timeType={timeType}
                                />
                            ))}
                        </div>
                    ) : activeTab === 'ranking' ? (
                        <RankingView rankings={rankings} />
                    ) : activeTab === 'personal' ? (
                        <div className="space-y-12">
                            <PersonalCharts
                                history={personalHistory.history}
                                teamStats={personalHistory.teamStats}
                                companyStats={personalHistory.companyStats}
                                userActivity={personalHistory.userActivity}
                                members={personalHistory.members}
                                allReports={reports.filter(r => (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase()))}
                            />

                            {/* Integrated Checklist Section */}
                            <div className="relative pt-10">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-6 text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                        Báo cáo Checklist hàng ngày
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-8 border border-slate-100 shadow-inner">
                                <ChecklistContainer />
                            </div>
                        </div>
                    ) : activeTab === 'daily_checklist' ? (
                        <div className="space-y-3">
                            {/* Stats Summary */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                            <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                                            Vấn đề nổi bật & Video Win
                                        </h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
                                    <button onClick={() => setDailyFilter(dailyFilter === 'video_win' ? 'all' : 'video_win')} className={`border rounded-xl p-2.5 flex items-center justify-between transition-all ${dailyFilter === 'video_win' ? 'bg-emerald-600 border-emerald-600 shadow-md shadow-emerald-600/20' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                        <div><p className={`text-[8px] font-black uppercase mb-0 ${dailyFilter === 'video_win' ? 'text-emerald-100' : 'text-emerald-600/70'}`}>Video Win</p><h4 className={`text-xl font-black ${dailyFilter === 'video_win' ? 'text-white' : 'text-emerald-600'}`}>{reportOutstandings
                                            .filter(r => matchTeam(r.team))
                                            .filter(r => (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase()))
                                            .filter(r => (r.content?.toUpperCase() || '').normalize('NFC').includes('VIDEO WIN')).length}</h4></div>
                                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs">🏆</div>
                                    </button>
                                    <button onClick={() => setDailyFilter(dailyFilter === 'product_win' ? 'all' : 'product_win')} className={`border rounded-xl p-2.5 flex items-center justify-between transition-all ${dailyFilter === 'product_win' ? 'bg-green-600 border-green-600 shadow-md shadow-green-600/20' : 'bg-green-50/50 border-green-100'}`}>
                                        <div><p className={`text-[8px] font-black uppercase mb-0 ${dailyFilter === 'product_win' ? 'text-green-100' : 'text-green-600/70'}`}>Sản phẩm Win</p><h4 className={`text-xl font-black ${dailyFilter === 'product_win' ? 'text-white' : 'text-green-600'}`}>{reportOutstandings
                                            .filter(r => matchTeam(r.team))
                                            .filter(r => (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase()))
                                            .filter(r => (r.content?.toUpperCase() || '').normalize('NFC').includes('SẢN PHẨM WIN')).length}</h4></div>
                                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs">💎</div>
                                    </button>
                                    <button onClick={() => setDailyFilter(dailyFilter === 'idea' ? 'all' : 'idea')} className={`border rounded-xl p-2.5 flex items-center justify-between transition-all ${dailyFilter === 'idea' ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-600/20' : 'bg-blue-50/50 border-blue-100'}`}>
                                        <div><p className={`text-[8px] font-black uppercase mb-0 ${dailyFilter === 'idea' ? 'text-blue-100' : 'text-blue-600/70'}`}>Ý kiến</p><h4 className={`text-xl font-black ${dailyFilter === 'idea' ? 'text-white' : 'text-blue-600'}`}>{reportOutstandings
                                            .filter(r => matchTeam(r.team))
                                            .filter(r => (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase()))
                                            .filter(r => (r.content?.toLowerCase() || '').normalize('NFC').match(/đóng góp|ý kĩen|cải tiến/)).length}</h4></div>
                                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs">💡</div>
                                    </button>
                                    <button onClick={() => setDailyFilter(dailyFilter === 'difficulty' ? 'all' : 'difficulty')} className={`border rounded-xl p-2.5 flex items-center justify-between transition-all ${dailyFilter === 'difficulty' ? 'bg-orange-600 border-orange-600 shadow-md shadow-orange-600/20' : 'bg-orange-50/50 border-orange-100'}`}>
                                        <div><p className={`text-[8px] font-black uppercase mb-0 ${dailyFilter === 'difficulty' ? 'text-orange-100' : 'text-orange-600/70'}`}>Khó khăn</p><h4 className={`text-xl font-black ${dailyFilter === 'difficulty' ? 'text-white' : 'text-orange-600'}`}>{reportOutstandings
                                            .filter(r => matchTeam(r.team))
                                            .filter(r => (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase()))
                                            .filter(r => {
                                                const c = (r.content?.toLowerCase() || '').normalize('NFC');
                                                return !c.includes('win') && !c.match(/đóng góp|ý kĩen|cải tiến/);
                                            }).length}</h4></div>
                                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs">🛡️</div>
                                    </button>
                                </div>
                            </div>

                            {/* Outstanding Items Table */}
                            <div className="bg-white rounded-[1rem] border border-slate-200 shadow-lg overflow-hidden">
                                <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
                                    <table className="w-full border-collapse text-left">
                                        <thead className="sticky top-0 z-20 bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-100 shadow-md">
                                            <tr>
                                                <th className="px-3 py-2 text-[8px] font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                    ND
                                                </th>
                                                <th className="px-3 py-2 text-[8px] font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                    Nhân viên
                                                </th>
                                                <th className="px-3 py-2 text-[8px] font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                    Team
                                                </th>
                                                <th className="px-3 py-2 text-[8px] font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                    ND Ý tưởng
                                                </th>
                                                <th className="px-3 py-2 text-[8px] font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60 text-center">
                                                    Xử lý
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {reportOutstandings
                                                .filter(r => matchTeam(r.team))
                                                .filter(r => (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase()))
                                                .filter(r => {
                                                    if (dailyFilter === 'all') return true;
                                                    const content = (r.content?.toUpperCase() || '').normalize('NFC');
                                                    if (dailyFilter === 'video_win') return content.includes('VIDEO WIN');
                                                    if (dailyFilter === 'product_win') return content.includes('SẢN PHẨM WIN');
                                                    if (dailyFilter === 'idea') return content.toLowerCase().normalize('NFC').match(/đóng góp|ý kĩen|cải tiến/);
                                                    if (dailyFilter === 'difficulty') {
                                                        const c = content.toLowerCase().normalize('NFC');
                                                        return !c.includes('win') && !c.match(/đóng góp|ý kĩen|cải tiến/);
                                                    }
                                                    return true;
                                                }).length > 0 ? reportOutstandings
                                                    .filter(r => matchTeam(r.team))
                                                    .filter(r => (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase()))
                                                    .filter(r => {
                                                        if (dailyFilter === 'all') return true;
                                                        const content = (r.content?.toUpperCase() || '').normalize('NFC');
                                                        if (dailyFilter === 'video_win') return content.includes('VIDEO WIN');
                                                        if (dailyFilter === 'product_win') return content.includes('SẢN PHẨM WIN');
                                                        if (dailyFilter === 'idea') return content.toLowerCase().normalize('NFC').match(/đóng góp|ý kĩen|cải tiến/);
                                                        if (dailyFilter === 'difficulty') {
                                                            const c = content.toLowerCase().normalize('NFC');
                                                            return !c.includes('win') && !c.match(/đóng góp|ý kĩen|cải tiến/);
                                                        }
                                                        return true;
                                                    }).map((r, idx) => {
                                                        const isWin = (r.content?.toLowerCase() || '').normalize('NFC').includes('win');
                                                        const isIdea = (r.content?.toLowerCase() || '').normalize('NFC').match(/đóng góp|ý kĩen|cải tiến/);
                                                        return (
                                                            <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-all">
                                                                <td className="px-3 py-1.5 border-r border-slate-50">
                                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${isWin ? 'bg-green-50 text-green-600 border-green-100' : isIdea ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                                        {r.content?.toUpperCase().replace('VIDEO SẢN PHẨM WIN', 'SẢN PHẨM WIN').replace('Ý KIẾN ĐÓNG GÓP CẢI TIẾN MỚI', 'Ý TƯỞNG').replace('KHÓ KHĂN CẦN HỖ TRỢ', 'KHÓ KHĂN')}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 font-bold text-slate-700 text-[10px]">{r.name}</td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 font-black text-blue-600 text-[9px] italic">{r.team}</td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 text-[10px] text-slate-600 italic truncate max-w-[200px]">"{r.idea_content}"</td>
                                                                <td className="px-3 py-1.5 text-center">
                                                                    <button
                                                                        onClick={() => !r.status && handleUpdateStatus(r.id, isWin || isIdea ? 'đã duyệt' : 'đã hỗ trợ')}
                                                                        disabled={!!r.status}
                                                                        className={`px-3 py-0.5 rounded-lg text-[8px] font-black uppercase transition-all shadow-sm ${r.status ? 'bg-slate-100 text-slate-400 cursor-default' : isWin ? 'bg-green-600 text-white hover:bg-green-700' : isIdea ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                                                                        {r.status ? `✓ ${r.status.split(' ')[1]}` : (isWin || isIdea ? 'Duyệt' : 'Hỗ trợ')}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }) : (
                                                <tr><td colSpan={5} className="py-20 text-center opacity-30 text-[10px] uppercase font-black">Chưa có dữ liệu</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Detailed Report Cards */}
                            <div className="space-y-4 mt-8">
                                <div className="flex items-center justify-between px-4">
                                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-blue-600" /> Chi tiết báo cáo ngày
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {reports.length > 0 ? reports.filter(r => matchTeam(r.team) && (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase())).map(report => (
                                        <ReportCard key={report.id} report={report} />
                                    )) : (
                                        <div className="col-span-full text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 text-[10px] font-black text-slate-400 italic">KHÔNG TÌM THẤY BÁO CÁO CHI TIẾT</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    );
};

export default UserActivityPage;
