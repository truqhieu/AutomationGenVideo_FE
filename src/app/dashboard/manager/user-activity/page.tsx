'use client';

import React, { Suspense } from 'react';
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
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    ShieldCheck,
    Calendar,
    BarChart3,
    Check,
    Clock
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

const CardSkeleton = () => (
    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-white animate-pulse">
        <div className="p-4 flex flex-col items-center">
            <div className="mt-2 mb-3">
                <div className="w-16 h-16 rounded-full bg-slate-200" />
            </div>
            <div className="text-center mb-4 w-full flex flex-col items-center">
                <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                <div className="flex gap-1.5">
                    <div className="h-4 w-14 bg-slate-100 rounded" />
                    <div className="h-4 w-16 bg-slate-100 rounded" />
                </div>
            </div>
            <div className="w-full space-y-1.5 mb-4 px-1">
                <div className="h-9 bg-slate-100 rounded-2xl" />
                <div className="h-9 bg-slate-100 rounded-2xl" />
                <div className="h-9 bg-slate-100 rounded-2xl" />
            </div>
            <div className="h-7 w-28 bg-slate-200 rounded-2xl mb-4" />
            <div className="w-full space-y-1.5 mb-4 px-1">
                <div className="flex justify-between">
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                    <div className="h-3 w-8 bg-slate-100 rounded" />
                </div>
                <div className="h-2 bg-slate-100 rounded-full" />
            </div>
            <div className="grid grid-cols-2 w-full gap-2 px-1">
                <div className="h-14 bg-slate-100 rounded-2xl" />
                <div className="h-14 bg-slate-100 rounded-2xl" />
            </div>
        </div>
    </div>
);

const CARDS_PER_BATCH = 100;

const UserActivityPageContent = () => {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [activeTab, setActiveTab] = React.useState<'dashboard' | 'performance' | 'ranking' | 'personal' | 'daily_checklist' | 'daily_report'>('performance');
    const [reportType, setReportType] = React.useState<'select' | 'daily' | 'monthly'>('select');
    const [dailySubtype, setDailySubtype] = React.useState<'select' | 'traffic' | 'work'>('select');
    const [reportMode, setReportMode] = React.useState<'select' | 'member' | 'leader'>('select');
    const [allowedMenuIds, setAllowedMenuIds] = React.useState<string[]>([]);
    const [reportOutstandings, setReportOutstandings] = React.useState<any[]>([]);
    const [reports, setReports] = React.useState<any[]>([]);
    const [summary, setSummary] = React.useState<any>(null);
    const [rankings, setRankings] = React.useState<any>(null);
    const [teamContributions, setTeamContributions] = React.useState<any[]>([]);
    const [groupContributions, setGroupContributions] = React.useState<any>(null);
    const [kpiMeta, setKpiMeta] = React.useState<{ kpiTotalInDb?: number; kpiFilteredForMonth?: number; kpiMonthFallback?: boolean } | null>(null);
    const [loading, setLoading] = React.useState(true);
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

                    // Priority 1: Use tab from URL if valid
                    if (tabParam && Object.values(tabMap).includes(tabParam)) {
                        // Prevent non-admins from accessing dashboard tab
                        if (tabParam === 'dashboard' && !isAdminUser) {
                            setActiveTab('performance');
                        } else {
                            setActiveTab(tabParam as any);
                        }
                    } else {
                        // Priority 2: Use default if allowed, or find first allowed
                        const isPerformanceAllowed = data.includes('activity_performance') || data.includes('performance');
                        const allowedSubTabs = data.filter((id: string) => id.startsWith('activity_') || id === 'performance');

                        if (!isAdminUser && allowedSubTabs.length > 0 && !isPerformanceAllowed) {
                            const firstAllowed = allowedSubTabs[0];
                            if (tabMap[firstAllowed]) {
                                setActiveTab(tabMap[firstAllowed]);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch activity permissions", err);
            }
        };
        fetchPermissions();
    }, [token, tabParam]);

    // Filter states
    const [activeTeam, setActiveTeam] = React.useState('All');
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [searchName, setSearchName] = React.useState('');
    const [dailyFilter, setDailyFilter] = React.useState<'all' | 'video_win' | 'product_win' | 'idea' | 'difficulty'>('all');
    const [isPersonalDetailed, setIsPersonalDetailed] = React.useState(false);
    const [showTabMenu, setShowTabMenu] = React.useState(false);
    const [visibleCount, setVisibleCount] = React.useState(CARDS_PER_BATCH);
    const [checklistPage, setChecklistPage] = React.useState(1);
    const [checklistRoleFilter, setChecklistRoleFilter] = React.useState<'all' | 'member' | 'leader'>('all');
    const CHECKLIST_PAGE_SIZE = 6;
    const loadMoreRef = React.useRef<HTMLDivElement>(null);

    // Time filter states
    const [timeType, setTimeType] = React.useState('today');
    const [dateRange, setDateRange] = React.useState<{ start: Date; end: Date }>(() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return { start, end };
    });

    // Reset visible count when filters change
    React.useEffect(() => {
        setVisibleCount(CARDS_PER_BATCH);
        setChecklistPage(1);
    }, [activeTeam, searchName, dateRange]);

    // Infinite scroll: load more cards when sentinel enters viewport
    React.useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisibleCount(prev => prev + CARDS_PER_BATCH);
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [reports.length]);

    // Maintain a persistent list of teams so filtering doesn't clear the dropdowns
    const [allKnownTeams, setAllKnownTeams] = React.useState<string[]>([]);

    React.useEffect(() => {
        if (!teamContributions || teamContributions.length === 0) return;
        setAllKnownTeams(prev => {
            const next = new Set(prev);
            let changed = false;
            teamContributions.forEach(item => {
                const t = item.team;
                if (t && t !== 'Khác' && !next.has(t)) {
                    next.add(t);
                    changed = true;
                }
            });
            return changed ? Array.from(next) : prev;
        });
    }, [teamContributions]);

    // Categorize teams dynamically based on all known teams
    const { globalTeams, vnTeams } = React.useMemo(() => {
        const globals: string[] = [];
        const vns: string[] = [];

        // Common keywords for Global teams
        const globalKeywords = ['global', 'jp', 'thái lan', 'đài loan', 'indo'];

        allKnownTeams.forEach(teamName => {
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
    }, [allKnownTeams]);

    const matchTeam = React.useCallback((teamName: string | null | undefined): boolean => {
        if (activeTeam === 'All') return true;

        const safeTeam = normalize(teamName || 'Khác');
        const safeActive = normalize(activeTeam);

        if (activeTeam === 'All Global') return globalTeams.some(t => normalize(t) === safeTeam);
        if (activeTeam === 'All VN') return vnTeams.some(t => normalize(t) === safeTeam);

        return safeTeam === safeActive;
    }, [activeTeam, globalTeams, vnTeams]);

    // Role helpers (memoized to avoid re-compute on every render)
    const sysRoles = user?.roles || [];
    const isAdminUser = React.useMemo(
        () => sysRoles.includes(UserRole.ADMIN) || sysRoles.includes(UserRole.MANAGER) || userRole === 'admin' || userRole === 'manager',
        [userRole, sysRoles]  // eslint-disable-line react-hooks/exhaustive-deps
    );
    const isLeaderUser = React.useMemo(
        () => sysRoles.includes(UserRole.LEADER) || userRole === 'leader',
        [userRole, sysRoles]  // eslint-disable-line react-hooks/exhaustive-deps
    );

    React.useEffect(() => {
        fetchReports(true);

        // Tự động cập nhật dữ liệu (real-time realtime refresh) mỗi 10 giây
        const intervalId = setInterval(() => {
            fetchReports(false);
        }, 10000);

        return () => clearInterval(intervalId);
    }, [dateRange, activeTeam, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

    // fetchHistory only re-runs when tab or user changes, NOT on every searchName keystroke.
    // When a card is clicked, searchName + activeTab are set together (batched), so the
    // updated searchName is already available when the effect fires for activeTab change.
    React.useEffect(() => {
        if (activeTab === 'personal' || activeTab === 'performance') {
            fetchHistory();
        }
    }, [activeTab, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const fetchReports = async (showLoading: boolean = true) => {
        if (!user?.email) return;
        if (showLoading) setLoading(true);
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
            if (activeTeam !== 'All') {
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
                    dailyGoal: item.dailyGoal || 0,
                    done: item.done || 0,
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
                    videoCount: item.answers ? Number(item.answers[Object.keys(item.answers).find(k => k.toLowerCase().includes('50%')) || ''] || 0) : 0,
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
            if (showLoading) setLoading(false);
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
        if (isAdminUser) return allTabs;
        return allTabs.filter(tab => tab.id !== 'dashboard');
    }, [allTabs, isAdminUser]);

    // Memoize filtered report lists to avoid expensive re-filtering on every render
    const filteredPerformanceReports = React.useMemo(() => {
        return reports.filter(r => {
            const safeUserTeam = normalize(userTeam);
            const safeReportTeam = normalize(r.team);
            const isTeamMatch = safeUserTeam && safeReportTeam === safeUserTeam;
            const isOwnName = r.name && user?.full_name && normalize(r.name) === normalize(user.full_name);
            const isOwnEmail = r.email && user?.email && normalize(r.email) === normalize(user.email);
            const isOwnCard = isOwnName || isOwnEmail;
            const hasNoTeam = !userTeam;
            const isVisible = isAdminUser || hasNoTeam || isTeamMatch || isOwnCard;
            return isVisible && matchTeam(r.team) && (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase());
        });
    }, [reports, userTeam, isAdminUser, matchTeam, searchName, user?.full_name, user?.email]);

    const filteredPersonalMembers = React.useMemo(() => {
        return personalHistory.members.filter(m => {
            const safeUserTeam = normalize(userTeam);
            const safeMemberTeam = normalize(m.team);
            const isTeamMatch = safeUserTeam && safeMemberTeam === safeUserTeam;
            const isOwnName = m.name && user?.full_name && normalize(m.name) === normalize(user.full_name);
            const isOwnEmail = m.email && user?.email && normalize(m.email) === normalize(user.email);
            const hasNoTeam = !userTeam;
            return isAdminUser || hasNoTeam || isTeamMatch || isOwnName || isOwnEmail;
        });
    }, [personalHistory.members, userTeam, isAdminUser, user?.full_name, user?.email]);

    const filteredAllReports = React.useMemo(() => {
        return reports.filter(r => {
            const safeUserTeam = normalize(userTeam);
            const safeReportTeam = normalize(r.team);
            const isTeamMatch = safeUserTeam && safeReportTeam === safeUserTeam;
            const isOwnName = r.name && user?.full_name && normalize(r.name) === normalize(user.full_name);
            const isOwnEmail = r.email && user?.email && normalize(r.email) === normalize(user.email);
            const hasNoTeam = !userTeam;
            const isSearchMatch = (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase());
            return (isAdminUser || hasNoTeam || isTeamMatch || isOwnName || isOwnEmail) && isSearchMatch;
        });
    }, [reports, userTeam, isAdminUser, searchName, user?.full_name, user?.email]);

    const filteredChecklistReports = React.useMemo(() => {
        return reportOutstandings.filter(r => matchTeam(r.team) && (r.name || 'Unknown').toLowerCase().includes(searchName.toLowerCase()));
    }, [reportOutstandings, matchTeam, searchName]);

    const checklistFilteredReports = React.useMemo(() => {
        return filteredPerformanceReports.filter(r => {
            if (checklistRoleFilter === 'all') return true;
            const pos = (r.position || '').toLowerCase();
            const isReportLeader = pos === 'leader' || pos.includes('leader') || pos.includes('trưởng nhóm');
            if (checklistRoleFilter === 'leader') return isReportLeader;
            return !isReportLeader; // 'member'
        });
    }, [filteredPerformanceReports, checklistRoleFilter]);

    return (
        <div id="report-view-container" className="min-h-screen bg-[#f8fafc] p-2 sm:p-4 space-y-4 selection:bg-blue-500/30">
            <div className="relative z-10 space-y-4">
                {activeTab !== 'daily_report' && (
                    <div className="relative z-30 bg-blue-50/50 backdrop-blur-md p-3 rounded-[2rem] border border-blue-100/50 shadow-xl shadow-blue-500/5">
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
                {activeTab !== 'personal' && activeTab !== 'daily_report' && activeTab !== 'daily_checklist' && (
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
                        {loading && !summary ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-3xl border border-slate-200/60 p-3 animate-pulse">
                                        <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-16 h-16 rounded-full bg-slate-100" />
                                            <div className="flex-1">
                                                <div className="h-8 w-20 bg-slate-200 rounded mb-2" />
                                                <div className="h-3 w-28 bg-slate-100 rounded" />
                                            </div>
                                        </div>
                                        <div className="border-t border-slate-100 pt-3 flex justify-between">
                                            <div className="h-6 w-16 bg-slate-100 rounded" />
                                            <div className="h-6 w-16 bg-slate-100 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ActivityKPIs summary={summary} teamContributions={teamContributions} groupContributions={groupContributions} />
                        )}
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
                        loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <CardSkeleton key={i} />
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                                    {filteredPerformanceReports.slice(0, visibleCount).map((report, idx) => {
                                        const isOwnName = report.name && user?.full_name && normalize(report.name) === normalize(user.full_name);
                                        const isOwnEmail = report.email && user?.email && normalize(report.email) === normalize(user.email);
                                        const isOwnCard = isOwnName || isOwnEmail;
                                        return (
                                            <div
                                                key={report.id || idx}
                                                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                                                style={{ animationDelay: `${Math.min(idx, 9) * 50}ms`, animationFillMode: 'backwards' }}
                                            >
                                                <UserActivityCard
                                                    data={{ ...report, reportStatus: report.status }}
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
                                            </div>
                                        );
                                    })}
                                </div>
                                {visibleCount < filteredPerformanceReports.length && (
                                    <div ref={loadMoreRef} className="flex justify-center py-8">
                                        <div className="flex items-center gap-2 text-sm text-slate-400 font-bold">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Đang tải thêm...
                                        </div>
                                    </div>
                                )}
                            </>
                        )
                    ) : activeTab === 'ranking' ? (
                        <RankingView rankings={rankings} />
                    ) : activeTab === 'personal' ? (
                        <div className="space-y-12">
                            <PersonalCharts
                                history={personalHistory.history}
                                teamStats={personalHistory.teamStats}
                                companyStats={personalHistory.companyStats}
                                userActivity={personalHistory.userActivity}
                                members={filteredPersonalMembers}
                                allReports={filteredAllReports}
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
                            {/* Stats Summary & Table - Only show if data exists */}
                            {filteredChecklistReports.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-4">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                                <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                                                Vấn đề nổi bật & Video Win
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Outstanding Items Table */}
                                    <div className="bg-white rounded-[1rem] border border-slate-200 shadow-lg overflow-x-auto">
                                        <div className="max-h-[280px] overflow-y-auto scrollbar-thin min-w-[1000px]">
                                            <table className="w-full border-collapse text-left">
                                                <thead className="sticky top-0 z-20 bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-100 shadow-md">
                                                    <tr>
                                                        <th className="px-3 py-2 text-xs font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                            Chức danh
                                                        </th>
                                                        <th className="px-3 py-2 text-xs font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                            Nhân viên
                                                        </th>
                                                        <th className="px-3 py-2 text-xs font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                            Phân loại
                                                        </th>
                                                        <th className="px-3 py-2 text-xs font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60">
                                                            Nội dung
                                                        </th>
                                                        <th className="px-3 py-2 text-xs font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60 text-center">
                                                            Người duyệt
                                                        </th>
                                                        <th className="px-3 py-2 text-xs font-black uppercase border-b border-orange-200/70 text-orange-700 tracking-widest bg-orange-50/60 text-center">
                                                            Duyệt
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {filteredChecklistReports.map((r, idx) => {
                                                        const statusText = (r.approval_status || '').toLowerCase();
                                                        let isApproved = statusText.includes('đã duyệt') || (statusText.includes('duyệt') && !statusText.includes('chưa') && !statusText.includes('không'));
                                                        let isRejected = statusText.includes('từ chối') || statusText.includes('không duyệt');
                                                        let isPending = !isApproved && !isRejected;

                                                        if (isPending && r.date) {
                                                            let rDateObj = new Date(r.date);
                                                            if (r.date.includes('/')) {
                                                                const parts = r.date.split('/');
                                                                if (parts.length === 3) {
                                                                    rDateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                                                                }
                                                            }
                                                            if (!isNaN(rDateObj.getTime())) {
                                                                const msDiff = new Date().getTime() - rDateObj.getTime();
                                                                // 30 days in milliseconds: 30 * 24 * 60 * 60 * 1000 = 2592000000
                                                                if (msDiff > 2592000000) {
                                                                    isPending = false;
                                                                    isRejected = true;
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-all">
                                                                <td className="px-3 py-1.5 border-r border-slate-50 font-bold text-slate-500 text-xs uppercase">{r.role || 'Member'}</td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50">
                                                                    <div className="font-bold text-slate-700 text-xs">{r.name}</div>
                                                                    <div className="text-[10px] text-blue-500 font-black italic">{r.team} - {r.date}</div>
                                                                </td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 font-black text-amber-600 text-xs uppercase">{r.category || '-'}</td>
                                                                <td className="px-3 py-1 border-r border-slate-50 cursor-pointer group hover:bg-slate-50/50 transition-colors">
                                                                    <div className="text-xs text-slate-700 font-medium leading-relaxed max-w-[350px] whitespace-normal line-clamp-2 group-hover:line-clamp-none py-1.5 px-2 rounded-lg group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-100 transition-all duration-300">
                                                                        {r.content || 'Không có nội dung'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 text-center text-xs font-bold text-slate-500 italic">
                                                                    {r.approved_by || '-'}
                                                                </td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 text-center">
                                                                    <div className="flex justify-center flex-wrap gap-1">
                                                                        {isAdminUser ? (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <button
                                                                                    onClick={() => handleUpdateStatus(r.id, isApproved ? 'Chưa duyệt' : 'Đã duyệt')}
                                                                                    title={isApproved ? "Đã duyệt - Nhấn để chuyển về Đang xem xét" : "Duyệt báo cáo này"}
                                                                                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-90 flex items-center justify-center ${
                                                                                        isApproved 
                                                                                        ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200' 
                                                                                        : 'bg-slate-50 text-slate-300 border-slate-200 hover:bg-green-50 hover:text-green-500 hover:border-green-500/50'
                                                                                    }`}
                                                                                >
                                                                                    <Check className="w-3.5 h-3.5" strokeWidth={isApproved ? 4 : 3} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleUpdateStatus(r.id, isRejected ? 'Chưa duyệt' : 'Từ chối')}
                                                                                    title={isRejected ? "Từ chối - Nhấn để chuyển về Đang xem xét" : "Từ chối báo cáo này"}
                                                                                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-90 flex items-center justify-center ${
                                                                                        isRejected 
                                                                                        ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200' 
                                                                                        : 'bg-slate-50 text-slate-300 border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-500/50'
                                                                                    }`}
                                                                                >
                                                                                    <X className="w-3.5 h-3.5" strokeWidth={isRejected ? 4 : 3} />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center justify-center">
                                                                                {isApproved && (
                                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                                                                                        <Check className="w-3 h-3" strokeWidth={3} /> Đã duyệt
                                                                                    </span>
                                                                                )}
                                                                                {isRejected && (
                                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                                                                                        <X className="w-3 h-3" strokeWidth={3} /> Từ chối
                                                                                    </span>
                                                                                )}
                                                                                {isPending && (
                                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1 tracking-wider">
                                                                                        <Clock className="w-3 h-3" strokeWidth={3} /> Đang xem xét
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Detailed Report Cards */}
                            <div className="space-y-4 mt-8">
                                <div className="flex items-center justify-between px-4">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-blue-600" /> Chi tiết báo cáo ngày
                                    </h3>
                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            onClick={() => { setChecklistRoleFilter('all'); setChecklistPage(1); }}
                                            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${checklistRoleFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => { setChecklistRoleFilter('leader'); setChecklistPage(1); }}
                                            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${checklistRoleFilter === 'leader' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Leader
                                        </button>
                                        <button
                                            onClick={() => { setChecklistRoleFilter('member'); setChecklistPage(1); }}
                                            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${checklistRoleFilter === 'member' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Member
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 animate-pulse">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                                                    <div><div className="h-4 w-28 bg-slate-200 rounded mb-2" /><div className="h-3 w-20 bg-slate-100 rounded" /></div>
                                                </div>
                                                <div className="space-y-2"><div className="h-3 w-full bg-slate-100 rounded" /><div className="h-3 w-3/4 bg-slate-100 rounded" /></div>
                                            </div>
                                        ))
                                    ) : checklistFilteredReports.length > 0 ? (
                                        <>
                                            {checklistFilteredReports.slice((checklistPage - 1) * CHECKLIST_PAGE_SIZE, checklistPage * CHECKLIST_PAGE_SIZE).map((report, idx) => (
                                                <div key={report.id || idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <ReportCard report={report} />
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="col-span-full text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 text-xs font-black text-slate-400 italic">KHÔNG TÌM THẤY BÁO CÁO CHI TIẾT</div>
                                    )}
                                </div>

                                {/* Pagination for Checklist */}
                                {!loading && checklistFilteredReports.length > CHECKLIST_PAGE_SIZE && (
                                    <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                                        <button
                                            onClick={() => setChecklistPage(p => Math.max(1, p - 1))}
                                            disabled={checklistPage === 1}
                                            className={`p-2 rounded-xl border transition-all ${checklistPage === 1 ? 'opacity-30 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-100' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50/50 hover:border-blue-200'}`}
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.ceil(checklistFilteredReports.length / CHECKLIST_PAGE_SIZE) }).map((_, i) => {
                                                const pageNum = i + 1;
                                                const isCurrent = pageNum === checklistPage;
                                                // Only show current, first, last, and neighbors
                                                const totalPages = Math.ceil(checklistFilteredReports.length / CHECKLIST_PAGE_SIZE);
                                                if (pageNum === 1 || pageNum === totalPages || (pageNum >= checklistPage - 1 && pageNum <= checklistPage + 1)) {
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setChecklistPage(pageNum)}
                                                            className={`min-w-[40px] h-10 rounded-xl font-black text-sm transition-all border ${isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'}`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                }
                                                if (pageNum === 2 && checklistPage > 3) return <span key="dots1" className="px-2 text-slate-400 font-bold">...</span>;
                                                if (pageNum === totalPages - 1 && checklistPage < totalPages - 2) return <span key="dots2" className="px-2 text-slate-400 font-bold">...</span>;
                                                return null;
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setChecklistPage(p => Math.min(Math.ceil(checklistFilteredReports.length / CHECKLIST_PAGE_SIZE), p + 1))}
                                            disabled={checklistPage === Math.ceil(checklistFilteredReports.length / CHECKLIST_PAGE_SIZE)}
                                            className={`p-2 rounded-xl border transition-all ${checklistPage === Math.ceil(checklistFilteredReports.length / CHECKLIST_PAGE_SIZE) ? 'opacity-30 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-100' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50/50 hover:border-blue-200'}`}
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'daily_report' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {reportType === 'select' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-10">
                                    {/* Daily Report Option */}
                                    <button
                                        onClick={() => setReportType('daily')}
                                        className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-900/40 transition-colors" />
                                        <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-500 shadow-inner">
                                            <Calendar className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Báo cáo ngày</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">Báo cáo và đánh giá công việc hàng ngày của Leader và Member.</p>
                                        <div className="mt-8 flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                            Chọn loại báo cáo <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                        </div>
                                    </button>

                                    {/* Monthly Report Option */}
                                    <button
                                        onClick={() => setReportType('monthly')}
                                        className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-900/40 transition-colors" />
                                        <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all duration-500 shadow-inner">
                                            <BarChart3 className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Báo cáo tháng</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">Tổng hợp dữ liệu hiệu suất, traffic và doanh thu theo chu kỳ tháng.</p>
                                        <div className="mt-8 flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                            Xem báo cáo tháng <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                        </div>
                                    </button>
                                </div>
                            ) : reportType === 'daily' ? (
                                <>
                                    {dailySubtype === 'select' ? (
                                        <div className="space-y-6">
                                            <div className="px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setReportType('select')}
                                                    className="relative z-[500] flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 text-slate-700 hover:bg-slate-200 font-bold transition-all group border border-slate-200 shadow-sm cursor-pointer"
                                                >
                                                    <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                                    Quay lại chọn Loại
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                                {/* Traffic Report Option */}
                                                <button
                                                    onClick={() => setDailySubtype('traffic')}
                                                    className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                                >
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-purple-900/40 transition-colors" />
                                                    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500 transition-all duration-500 shadow-inner">
                                                        <BarChart3 className="w-8 h-8 text-purple-400" />
                                                    </div>
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Báo cáo Traffic</h3>
                                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">Cập nhật số liệu truy cập từ các nền tảng mạng xã hội hôm nay.</p>
                                                    <div className="mt-8 flex items-center gap-2 text-purple-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                                        Nhập số liệu <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                                    </div>
                                                </button>

                                                {/* Work Report Option */}
                                                <button
                                                    onClick={() => setDailySubtype('work')}
                                                    className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                                >
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-900/40 transition-colors" />
                                                    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-500 shadow-inner">
                                                        <ClipboardList className="w-8 h-8 text-blue-400" />
                                                    </div>
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Công việc hôm nay</h3>
                                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">Báo cáo tiến độ checklist, khó khăn và kế hoạch làm việc.</p>
                                                    <div className="mt-8 flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                                        Báo cáo công việc <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    ) : dailySubtype === 'traffic' ? (
                                        <div className="space-y-6">
                                            <div className="px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setDailySubtype('select')}
                                                    className="relative z-[500] flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50/50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold transition-all group border border-blue-100/50 shadow-sm cursor-pointer"
                                                >
                                                    <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                                    Quay lại
                                                </button>
                                            </div>
                                            <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-8 border border-slate-100 shadow-inner">
                                                <ChecklistContainer mode="member" showOnlyTraffic={true} />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {reportMode === 'select' ? (
                                                <div className="space-y-6">
                                                    <div className="px-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDailySubtype('select')}
                                                            className="relative z-[500] flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 text-slate-700 hover:bg-slate-200 font-bold transition-all group border border-slate-200 shadow-sm cursor-pointer"
                                                        >
                                                            <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                                            Quay lại
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                                        {/* Member Report Option */}
                                                        {(isAdminUser || !isLeaderUser) && (
                                                            <button
                                                                onClick={() => setReportMode('member')}
                                                                className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                                            >
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-900/40 transition-colors" />
                                                                <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-500 shadow-inner">
                                                                    <User className="w-8 h-8 text-blue-400" />
                                                                </div>
                                                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Báo cáo Member</h3>
                                                                <p className="text-sm text-slate-400 font-medium leading-relaxed">Dành cho Editor & Content báo cáo tiến độ checklist và khó khăn hàng ngày.</p>
                                                                <div className="mt-8 flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                                                    Bắt đầu báo cáo <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                                                </div>
                                                            </button>
                                                        )}

                                                        {/* Leader Report Option */}
                                                        {(isAdminUser || isLeaderUser) && (
                                                            <button
                                                                onClick={() => setReportMode('leader')}
                                                                className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                                            >
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-900/40 transition-colors" />
                                                                <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all duration-500 shadow-inner">
                                                                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                                                                </div>
                                                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Báo cáo Leader</h3>
                                                                <p className="text-sm text-slate-400 font-medium leading-relaxed">Dành cho Team Leader đánh giá chất lượng và quản lý nhân sự hàng ngày.</p>
                                                                <div className="mt-8 flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
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
                                                            type="button"
                                                            onClick={() => setReportMode('select')}
                                                            className="relative z-[500] flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 text-slate-700 hover:bg-slate-200 font-bold transition-all group border border-slate-200 shadow-sm cursor-pointer"
                                                        >
                                                            <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                                            Quay lại chọn Đối tượng
                                                        </button>
                                                    </div>
                                                    <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-8 border border-slate-100 shadow-inner">
                                                        <ChecklistContainer mode={reportMode} showOnlyWork={true} />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>

                            ) : (
                                <div className="space-y-6">
                                    <div className="px-4">
                                        <button
                                            type="button"
                                            onClick={() => setReportType('select')}
                                            className="relative z-[500] flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 text-slate-700 hover:bg-slate-200 font-bold transition-all group border border-slate-200 shadow-sm cursor-pointer"
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
            </div>
        </div>
    );
};

const UserActivityPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
                </div>
            </div>
        }>
            <UserActivityPageContent />
        </Suspense>
    );
};

export default UserActivityPage;
