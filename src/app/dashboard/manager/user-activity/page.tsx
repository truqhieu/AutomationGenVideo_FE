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
    LayoutGrid,
    ChevronDown,
    Menu,
    X,
    ShieldCheck,
    Calendar,
    BarChart3
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useSearchParams } from 'next/navigation';
import { UserRole } from '@/types/auth';

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

const normalize = (str: any) => (str || '').toString().toLowerCase().trim().replace(/\s+/g, '');



const UserActivityPage = () => {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [activeTab, setActiveTab] = React.useState<'dashboard' | 'performance' | 'ranking' | 'personal' | 'daily_checklist' | 'daily_report'>('performance');
    const [reportType, setReportType] = React.useState<'select' | 'daily' | 'monthly'>('select');
    const [reportMode, setReportMode] = React.useState<'select' | 'member' | 'leader'>('select');
    const [allowedMenuIds, setAllowedMenuIds] = React.useState<string[]>([]);
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

    // Fetch dynamic permissions
    const { token } = useAuthStore();
    React.useEffect(() => {
        const fetchPermissions = async () => {
            if (!token) return;
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/role-permissions/my-tabs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAllowedMenuIds(data);

                    // If 'performance' tab is not allowed, pick the first available one
                    const tabMap: any = {
                        'activity_performance': 'performance',
                        'performance': 'performance',
                        'activity_dashboard': 'dashboard',
                        'activity_ranking': 'ranking',
                        'activity_personal': 'personal',
                        'activity_checklist': 'daily_checklist',
                        'activity_report': 'daily_report'
                    };

                    const isPerformanceAllowed = data.includes('activity_performance') || data.includes('performance');
                    const allowedSubTabs = data.filter((id: string) => id.startsWith('activity_') || id === 'performance');

                    if (!isAdminUser && allowedSubTabs.length > 0 && !isPerformanceAllowed) {
                        const firstAllowed = allowedSubTabs[0];
                        if (tabMap[firstAllowed]) {
                            setActiveTab(tabMap[firstAllowed]);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch activity permissions", err);
            }
        };
        fetchPermissions();
    }, [token]);

    // Filter states
    const [activeTeam, setActiveTeam] = React.useState('All');
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [searchName, setSearchName] = React.useState('');
    const [dailyFilter, setDailyFilter] = React.useState<'all' | 'video_win' | 'product_win' | 'idea' | 'difficulty'>('all');
    const [isPersonalDetailed, setIsPersonalDetailed] = React.useState(false);
    const [showTabMenu, setShowTabMenu] = React.useState(false);

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

    const matchTeam = (teamName: string | null | undefined): boolean => {
        if (activeTeam === 'All') return true;

        const safeTeam = normalize(teamName || 'Khác');
        const safeActive = normalize(activeTeam);

        if (activeTeam === 'All Global') return globalTeams.some(t => normalize(t) === safeTeam);
        if (activeTeam === 'All VN') return vnTeams.some(t => normalize(t) === safeTeam);

        return safeTeam === safeActive;
    };

    // Role helpers
    const sysRoles = user?.roles || [];
    const isAdminUser = sysRoles.includes(UserRole.ADMIN) || sysRoles.includes(UserRole.MANAGER) || userRole === 'admin' || userRole === 'manager';
    const isLeaderUser = sysRoles.includes(UserRole.LEADER) || userRole === 'leader';

    React.useEffect(() => {
        fetchReports();
    }, [dateRange, activeTeam, user?.email]); // Fetch data whenever date range, filters or user changes

    React.useEffect(() => {
        if (activeTab === 'personal' || activeTab === 'performance') {
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

            // Use team from BE, fallback to user profile team
            const effectiveTeam = data.userTeam || (user as any)?.team || null;
            setUserTeam(effectiveTeam);

            // Map backend data to frontend interface
            const mappedReports = reportsList.map((item: any) => {
                const pos = (item.position || '').toLowerCase();
                const role = (item.role || '').toLowerCase();
                const isLeaderReport = pos.includes('leader') ||
                    pos.includes('lead') ||
                    pos.includes('manager') ||
                    pos.includes('trưởng nhóm') ||
                    role.includes('leader') ||
                    role.includes('manager') ||
                    !!(item.answers && (
                        item.answers['1. Bạn đã kiểm tra chất lượng nội dung video đầu ra của team mình chưa?'] ||
                        item.answers['2. Team bạn hôm qua có thành viên nào có video Win nhất?']
                    ));

                return {
                    id: item.id,
                    name: item.name,
                    position: item.position || (isLeaderReport ? 'Leader' : 'Member'),
                    team: item.team,
                    avatar: getAvatarUrl(item.avatar, item.name),
                    status: item.status,
                    submittedAt: item.date,
                    email: item.email,
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
                        reportLink: item.answers?.['Báo cáo Lark - Bạn đã gửi link báo cáo video chưa?'] || false
                    },
                    videoCount: item.answers?.['Số video edit sử dụng >50% source từ quay?'] || 0,
                    task_progress: item.task_progress || null,
                    questions: [
                        {
                            question: isLeaderReport ? 'ĐÃ KIỂM TRA CHẤT LƯỢNG VIDEO ĐẦU RA CỦA TEAM CHƯA?' : 'NGÀY HÔM QUA CÔNG VIỆC BẠN CÓ CẢI GÌ KHIẾN BẠN TỰ HÀO VÀ THÍCH THÚ NHẤT?',
                            answer: isLeaderReport
                                ? (item.answers?.['1. Bạn đã kiểm tra chất lượng nội dung video đầu ra của team mình chưa?'] || 'Không có')
                                : (item.answers?.['1. Ngày hôm qua công việc bạn có cái gì khiến bạn tự hào và thích thú nhất?'] ||
                                    item.answers?.['1.Ngày hôm qua công việc bạn có cái gì khiến bạn tự hào và thích thú nhất?'] ||
                                    'Không có')
                        },
                        {
                            question: isLeaderReport ? 'TEAM BẠN HÔM QUA CÓ THÀNH VIÊN NÀO CÓ VIDEO WIN NHẤT?' : 'HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỢC ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?',
                            answer: isLeaderReport
                                ? (item.answers?.['2. Team bạn hôm qua có thành viên nào có video Win nhất?'] || 'Không có')
                                : (item.answers?.['2. Hôm qua có đổi mới sáng tạo gì được áp dụng vào công việc của bạn không?'] ||
                                    item.answers?.['2. HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỂ ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?'] ||
                                    'Không có')
                        },
                        {
                            question: isLeaderReport ? 'TEAM BẠN HÔM QUA CÓ GÌ ĐỔI MỚI ĐƯỢC ÁP DỤNG KHÔNG?' : 'BẠN CÓ GẶP KHÓ KHĂN NÀO CẦN HỖ TRỢ KHÔNG?',
                            answer: isLeaderReport
                                ? (item.answers?.['3. Team bạn hôm qua có gì đổi mới được áp dụng không?'] || 'Không có')
                                : (item.answers?.['3. Bạn có gặp khó khăn nào cần hỗ trợ không?'] ||
                                    item.answers?.['3. BẠN CÓ GẶP KHÓ KHĂN NÀO CẦN HỖ TRỢ KHÔNG?'] ||
                                    'Không có')
                        },
                        {
                            question: isLeaderReport ? 'TEAM BẠN CÓ AI TRỄ DEADLINE HÔM QUA KHÔNG? LÝ DO?' : 'BẠN CÓ ĐÓNG GÓP Ý TƯỞNG HAY ĐỀ XUẤT GÌ KHÔNG?',
                            answer: isLeaderReport
                                ? (item.answers?.['4. Team bạn có ai trễ Deadline hôm qua không? Lý do và phương án?'] || 'Không có')
                                : (item.answers?.['4. Bạn có đóng góp ý tưởng hay đề xuất gì không?'] ||
                                    item.answers?.['4. BẠN CÓ ĐÓNG GÓP Ý TƯỞNG HAY ĐỀ XUẤT GÌ KHÔNG?'] ||
                                    'Không có')
                        },
                        {
                            question: isLeaderReport ? 'TEAM BẠN HÔM QUA CÓ SẢN PHẨM NÀO WIN MỚI KHÔNG?' : 'BẠN CÓ SẢN PHẨM (A4 - A5) NÀO WIN MỚI KHÔNG?',
                            answer: isLeaderReport
                                ? (item.answers?.['5. Team bạn hôm qua có sản phẩm nào win mới không? Đã thông tin lên Group New Product chưa?'] || 'Không có')
                                : (item.answers?.['5. Bạn có sản phẩm (A4 - A5) nào win mới không? (>5k view - >10 CMT hỏi giá?)'] ||
                                    item.answers?.['5. Bạn có sản phẩm (A4 - A5) nào win mới không? (>5k view - >10 cmt hỏi giá?)'] ||
                                    item.answers?.['5. BẠN CÓ SẢN PHẨM (A4 - A5) NÀO WIN MỚI KHÔNG? (>5K VIEW - >10 CMT HỎI GIÁ?)'] ||
                                    'Không có')
                        },
                    ]
                };
            });


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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/lark/update-outstanding-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                    status,
                    approvedBy: user?.full_name
                }),
            });

            if (response.ok) {
                // Update local state to reflect change immediately
                setReportOutstandings(prev => prev.map(r =>
                    r.id === id ? { ...r, status, approval_status: status, approved_by: user?.full_name } : r
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

    const allTabs = React.useMemo(() => [
        { id: 'performance', label: 'Hiệu Suất', icon: RefreshCw },
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'ranking', label: 'Bảng xếp hạng', icon: Layout },
        { id: 'personal', label: 'Tiến độ', icon: User },
        { id: 'daily_report', label: 'Báo cáo', icon: FileText },
        { id: 'daily_checklist', label: 'Checklist', icon: ClipboardList }
    ], []);

    const visibleTabs = React.useMemo(() => {
        // Super users always see everything
        if (isAdminUser) return allTabs;

        // Fallback: If no dynamic permissions fetched yet
        if (allowedMenuIds.length === 0) return allTabs;

        const tabMap: any = {
            'performance': 'activity_performance',
            'dashboard': 'activity_dashboard',
            'ranking': 'activity_ranking',
            'personal': 'activity_personal',
            'daily_checklist': 'activity_checklist',
            'daily_report': 'activity_report'
        };

        // Filter tabs: show if explicitly allowed (either sub-tab ID or parent ID)
        return allTabs.filter(tab => {
            const subId = tabMap[tab.id];
            return allowedMenuIds.includes(subId) || allowedMenuIds.includes(tab.id);
        });
    }, [allowedMenuIds, allTabs, isAdminUser]);

    return (
        <div id="report-view-container" className="min-h-screen bg-white p-2 sm:p-4 space-y-4 selection:bg-blue-500/30">
            {/* Top Header Section with Xanh Trắng Theme */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-blue-600 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent" />
            </div>

            <header className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <div
                        className="flex items-center gap-5 cursor-pointer group"
                        onClick={() => {
                            setActiveTab('performance');
                            setIsPersonalDetailed(false);
                        }}
                    >
                        <div className="bg-white p-3 rounded-2xl shadow-xl shadow-blue-900/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            {React.createElement(allTabs.find(t => t.id === activeTab)?.icon || Layout, {
                                className: "text-blue-600 w-7 h-7"
                            })}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-widest uppercase italic drop-shadow-sm group-hover:text-blue-100 transition-colors">
                                {allTabs.find(t => t.id === activeTab)?.label}
                            </h1>
                        </div>
                    </div>

                    {/* Navigation - Right Aligned & Glassmorphic - Only Directory remaining */}
                    <nav className="flex items-center gap-1.5 bg-white/90 backdrop-blur-2xl p-1.5 rounded-[1.8rem] border border-blue-100 shadow-2xl shadow-blue-900/10 transition-all duration-500 hover:shadow-blue-900/20">
                        {/* Directory Trigger Button */}
                        <button
                            onClick={() => setShowTabMenu(true)}
                            className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab !== 'performance'
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/40 -translate-y-0.5'
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50/50'
                                }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline-block">
                                {activeTab !== 'performance' ? allTabs.find(t => t.id === activeTab)?.label : 'Danh mục'}
                            </span>
                            <ChevronDown className="w-3 h-3" />
                        </button>
                    </nav>
                </div>
            </header>

            {/* Full Screen Navigation Overlay (Viettel Style) - Fixed position to cover everything */}
            {showTabMenu && (
                <div className="fixed inset-0 z-[9999] bg-white animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                    <div className="h-full flex flex-col bg-slate-50/20">
                        {/* Top Brand & Close Bar */}
                        <div className="bg-white flex items-center justify-between px-6 py-5 border-b border-slate-100/80 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/20">
                                    <LayoutGrid className="text-white w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 leading-none tracking-tight uppercase">
                                        Danh mục <span className="text-blue-600">tính năng</span>
                                    </h2>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">VCB REPORT</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTabMenu(false)}
                                className="p-3 bg-slate-50 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded-2xl transition-all duration-300 group"
                            >
                                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Main Menu List */}
                        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
                            {/* Current Selection Hint */}
                            <div className="mb-6 px-4">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 px-1">Đang chọn</p>
                                <div className="h-1 w-12 bg-blue-600 rounded-full" />
                            </div>

                            {visibleTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id as any);
                                        setShowTabMenu(false);
                                        if (tab.id === 'personal') setIsPersonalDetailed(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-6 rounded-[2.5rem] transition-all duration-500 group relative overflow-hidden ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 -translate-y-1'
                                        : 'bg-white text-slate-600 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1'
                                        }`}
                                >
                                    {activeTab === tab.id && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                    )}

                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className={`p-4 rounded-2xl transition-all duration-500 ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-100'}`}>
                                            <tab.icon className={`w-7 h-7 ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className={`text-base font-black uppercase tracking-tight ${activeTab === tab.id ? 'text-white' : 'text-slate-800'}`}>
                                                {tab.label}
                                            </h3>
                                            <p className={`text-[11px] font-medium mt-1 ${activeTab === tab.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {tab.id === 'performance' ? 'Trang chủ theo dõi hiệu suất' : `Hệ thống ${tab.label.toLowerCase()}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${activeTab === tab.id ? 'bg-white/10 text-white translate-x-1' : 'bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:translate-x-2'}`}>
                                        <ChevronDown className="-rotate-90 w-6 h-6 stroke-[3]" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer Info */}
                        <div className="p-8 text-center bg-white border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                                VCB REPORT PLATFORM • PREMIUM EDITION
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10 space-y-4">
                {activeTab !== 'daily_report' && (
                    <div className="relative z-30 bg-white/80 backdrop-blur-md p-2 rounded-[2rem] border border-white/20 shadow-xl shadow-slate-200/50">
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
                )}

                {/* KPI Cards section */}
                {activeTab !== 'personal' && activeTab !== 'daily_report' && (
                    <div className="relative z-10 transition-all duration-500 space-y-2">
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
                            {reports
                                .filter(r => {
                                    const safeUserTeam = normalize(userTeam);
                                    const safeReportTeam = normalize(r.team);
                                    const isTeamMatch = safeUserTeam && safeReportTeam === safeUserTeam;

                                    const isOwnName = r.name && user?.full_name && normalize(r.name) === normalize(user.full_name);
                                    const isOwnEmail = r.email && user?.email && normalize(r.email) === normalize(user.email);
                                    const isOwnCard = isOwnName || isOwnEmail;

                                    // Filter by team/role
                                    const isVisible = isAdminUser || isTeamMatch || isOwnCard;

                                    return isVisible && matchTeam(r.team) && (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase());
                                })
                                .map((report, idx) => {
                                    const isOwnName = report.name && user?.full_name && normalize(report.name) === normalize(user.full_name);
                                    const isOwnEmail = report.email && user?.email && normalize(report.email) === normalize(user.email);
                                    const isOwnCard = isOwnName || isOwnEmail;

                                    return (
                                        <UserActivityCard
                                            key={report.id || idx}
                                            data={{
                                                ...report,
                                                reportStatus: report.status
                                            }}
                                            timeType={timeType}
                                            canClick={
                                                isAdminUser ||
                                                (isLeaderUser && report.team && userTeam && normalize(report.team) === normalize(userTeam)) ||
                                                isOwnCard
                                            }
                                            onClick={() => {
                                                setSearchName(report.name);
                                                setIsPersonalDetailed(true);
                                                setActiveTab('personal');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        />
                                    );
                                })
                            }
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
                                members={personalHistory.members.filter(m => {
                                    const safeUserTeam = normalize(userTeam);
                                    const safeMemberTeam = normalize(m.team);
                                    const isTeamMatch = safeUserTeam && safeMemberTeam === safeUserTeam;

                                    const isOwnName = m.name && user?.full_name && normalize(m.name) === normalize(user.full_name);
                                    const isOwnEmail = m.email && user?.email && normalize(m.email) === normalize(user.email);
                                    return isAdminUser || isTeamMatch || isOwnName || isOwnEmail;
                                })}
                                allReports={reports.filter(r => {
                                    const safeUserTeam = normalize(userTeam);
                                    const safeReportTeam = normalize(r.team);
                                    const isTeamMatch = safeUserTeam && safeReportTeam === safeUserTeam;

                                    const isOwnName = r.name && user?.full_name && normalize(r.name) === normalize(user.full_name);
                                    const isOwnEmail = r.email && user?.email && normalize(r.email) === normalize(user.email);

                                    const isSearchMatch = (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase());
                                    return (isAdminUser || isTeamMatch || isOwnName || isOwnEmail) && isSearchMatch;
                                })}
                                setSearchName={setSearchName}
                                isDetailedMode={isPersonalDetailed}
                                setIsDetailedMode={setIsPersonalDetailed}
                                userRole={userRole || (isAdminUser ? 'admin' : isLeaderUser ? 'leader' : 'member')}
                                userTeam={userTeam}
                                currentUserName={user?.full_name}
                                currentUserEmail={user?.email}
                            />

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
                                                    Chức danh
                                                </th>
                                                <th className="px-3 py-2 text-[10px] font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                    Nhân viên
                                                </th>
                                                <th className="px-3 py-2 text-[8px] font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                    Phân loại
                                                </th>
                                                <th className="px-3 py-2 text-[8px] font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                    Nội dung
                                                </th>
                                                <th className="px-3 py-2 text-[8px] font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60 text-center">
                                                    Duyệt
                                                </th>
                                                <th className="px-3 py-2 text-[8px] font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60 text-center">
                                                    Người duyệt
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {reportOutstandings
                                                .filter(r => matchTeam(r.team))
                                                .filter(r => (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase()))
                                                .length > 0 ? reportOutstandings
                                                    .filter(r => matchTeam(r.team))
                                                    .filter(r => (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase()))
                                                    .map((r, idx) => {
                                                        const statusText = (r.approval_status || '').toLowerCase();
                                                        const isApproved = statusText.includes('đã duyệt') || (statusText.includes('duyệt') && !statusText.includes('chưa'));
                                                        return (
                                                            <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-all">
                                                                <td className="px-3 py-1.5 border-r border-slate-50 font-bold text-slate-500 text-[9px] uppercase">{r.role || 'Member'}</td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50">
                                                                    <div className="font-bold text-slate-700 text-[10px]">{r.name}</div>
                                                                    <div className="text-[8px] text-blue-500 font-black italic">{r.team} - {r.date}</div>
                                                                </td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 font-black text-amber-600 text-[9px] uppercase">{r.category || '-'}</td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 text-[10px] text-slate-600 max-w-[250px] whitespace-normal line-clamp-2">
                                                                    {r.content || 'Không có nội dung'}
                                                                </td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 text-center">
                                                                    {(isAdminUser || isLeaderUser) ? (
                                                                        <button
                                                                            onClick={() => handleUpdateStatus(r.id, isApproved ? 'Chưa Duyệt' : 'Đã Duyệt')}
                                                                            title="Nhấn để thay đổi trạng thái"
                                                                            className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition-all hover:scale-105 active:scale-95 ${isApproved ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200'}`}
                                                                        >
                                                                            {r.approval_status || 'Chưa duyệt'}
                                                                        </button>
                                                                    ) : (
                                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${isApproved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                                                                            {r.approval_status || 'Chưa duyệt'}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-1.5 text-center text-[9px] font-bold text-slate-500 italic">
                                                                    {r.approved_by || '-'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }) : (
                                                <tr><td colSpan={6} className="py-20 text-center opacity-30 text-[10px] uppercase font-black">Chưa có dữ liệu</td></tr>
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
                    ) : activeTab === 'daily_report' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {reportType === 'select' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-10">
                                    {/* Daily Report Option */}
                                    <button
                                        onClick={() => setReportType('daily')}
                                        className="group relative bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-blue-900/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-100 transition-colors" />
                                        <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                            <Calendar className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Báo cáo ngày</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Báo cáo và đánh giá công việc hàng ngày của Leader và Member.</p>
                                        <div className="mt-8 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                                            Chọn loại báo cáo <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                        </div>
                                    </button>

                                    {/* Monthly Report Option */}
                                    <button
                                        onClick={() => setReportType('monthly')}
                                        className="group relative bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-indigo-900/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-100 transition-colors" />
                                        <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                            <BarChart3 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Báo cáo tháng</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Tổng hợp dữ liệu hiệu suất, traffic và doanh thu theo chu kỳ tháng.</p>
                                        <div className="mt-8 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                                            Xem báo cáo tháng <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                        </div>
                                    </button>
                                </div>
                            ) : reportType === 'daily' ? (
                                <>
                                    {reportMode === 'select' ? (
                                        <div className="space-y-6">
                                            <div className="px-4">
                                                <button
                                                    onClick={() => setReportType('select')}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50/50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold transition-all group border border-blue-100/50 shadow-sm"
                                                >
                                                    <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                                    Quay lại chọn Loại
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                                {/* Member Report Option */}
                                                {(isAdminUser || !isLeaderUser) && (
                                                    <button
                                                        onClick={() => setReportMode('member')}
                                                        className="group relative bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-blue-900/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                                    >
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-100 transition-colors" />
                                                        <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                                            <User className="w-8 h-8" />
                                                        </div>
                                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Báo cáo Member</h3>
                                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Dành cho Editor & Content báo cáo tiến độ checklist và khó khăn hàng ngày.</p>
                                                        <div className="mt-8 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                                                            Bắt đầu báo cáo <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                                        </div>
                                                    </button>
                                                )}

                                                {/* Leader Report Option */}
                                                {(isAdminUser || isLeaderUser) && (
                                                    <button
                                                        onClick={() => setReportMode('leader')}
                                                        className="group relative bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-blue-900/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                                    >
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-100 transition-colors" />
                                                        <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                                            <ShieldCheck className="w-8 h-8" />
                                                        </div>
                                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Báo cáo Leader</h3>
                                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Dành cho Team Leader đánh giá chất lượng và quản lý nhân sự hàng ngày.</p>
                                                        <div className="mt-8 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                                                            Bắt đầu đánh giá <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between px-4">
                                                <button
                                                    onClick={() => setReportMode('select')}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50/50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold transition-all group border border-blue-100/50 shadow-sm"
                                                >
                                                    <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                                    Quay lại chọn Đối tượng
                                                </button>
                                            </div>
                                            <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-8 border border-slate-100 shadow-inner">
                                                <ChecklistContainer mode={reportMode} />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="px-4">
                                        <button
                                            onClick={() => setReportType('select')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50/50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold transition-all group border border-blue-100/50 shadow-sm"
                                        >
                                            <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                            Quay lại chọn Loại
                                        </button>
                                    </div>
                                    <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-20 border border-slate-100 shadow-inner text-center">
                                        <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em]">Tính năng Báo cáo tháng</h3>
                                        <p className="text-slate-400 mt-2 text-sm">Đang được phát triển. Vui lòng quay lại sau!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </main>
            </div >
        </div >
    );
};

export default UserActivityPage;
