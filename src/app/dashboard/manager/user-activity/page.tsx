'use client';

import React from 'react';
import ActivityKPIs from './components/ActivityKPIs';
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
    ClipboardList
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

    const [activeTab, setActiveTab] = React.useState<'performance' | 'ranking' | 'personal' | 'report' | 'checklist' | 'daily_checklist'>('performance');
    const [reportOutstandings, setReportOutstandings] = React.useState<any[]>([]);
    const [reports, setReports] = React.useState<any[]>([]);
    const [summary, setSummary] = React.useState<any>(null);
    const [rankings, setRankings] = React.useState<any>(null);
    const [teamContributions, setTeamContributions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [userRole, setUserRole] = React.useState<string | null>(null);
    const [userTeam, setUserTeam] = React.useState<string | null>(null);
    const [personalHistory, setPersonalHistory] = React.useState<{ history: any[], teamStats: any | null }>({ history: [], teamStats: null });

    // Filter states
    const [activeTeam, setActiveTeam] = React.useState('All');
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [searchName, setSearchName] = React.useState('');
    const [dailyFilter, setDailyFilter] = React.useState<'all' | 'win' | 'idea' | 'difficulty'>('all');

    React.useEffect(() => {
        if (tabParam === 'checklist') {
            setActiveTab('checklist');
        }
    }, [tabParam]);

    React.useEffect(() => {
        fetchReports();
    }, [selectedDate, activeTeam, user?.email]); // Fetch data whenever filters or user changes

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
            if (searchName && (userRole === 'admin' || userRole === 'leader')) {
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
            if (selectedDate) {
                // Format date as YYYY-MM-DD
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                params.append('date', `${year}-${month}-${day}`);
            }
            if (activeTeam !== 'All') {
                params.append('team', activeTeam);
            }
            params.append('requesterEmail', user.email);

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
                time: item.date ? new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Chưa báo cáo',
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
                questions: [
                    {
                        question: 'NGÀY HÔM QUA CÔNG VIỆC BẠN CÓ CẢI GÌ KHIẾN BẠN TỰ HÀO VÀ THÍCH THÚ NHẤT?',
                        answer: item.answers?.['1.NGÀY HÔM QUA CÔNG VIỆC BẠN CÓ CẢI GÌ KHIẾN BẠN TỰ HÀO VÀ THÍCH THÚ NHẤT?'] ||
                            item.answers?.['1. BẠN ĐÃ KIỂM TRA CHẤT LƯỢNG NỘI DUNG VIDEO ĐẦU RA CỦA TEAM MÌNH CHƯA?'] ||
                            'Không có'
                    },
                    {
                        question: 'HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỢC ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?',
                        answer: item.answers?.['2. HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỢC ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?'] ||
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
            setSummary(summaryData);
            setRankings(rankingsData);
            setTeamContributions(data.teamContributions || []);
            setReportOutstandings(data.reportOutstandings || []);
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

    // Tabs filtering
    const allTabs = [
        { id: 'performance', label: 'Hiệu Suất', icon: RefreshCw },
        { id: 'ranking', label: 'BXH', icon: Layout },
        { id: 'personal', label: 'Cá nhân', icon: User },
        { id: 'daily_checklist', label: 'Checklist ngày', icon: ClipboardList },
        { id: 'checklist', label: 'Checklist', icon: CheckSquare },
        { id: 'report', label: 'Báo cáo', icon: FileText }
    ];

    const visibleTabs = allTabs.filter(tab => {
        if (userRole === 'member' && tab.id === 'report') return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-white p-6 space-y-10 selection:bg-blue-500/30">
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
                    <div />
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
                {/* Filters Section */}
                {activeTab !== 'checklist' && (
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
                        />
                    </div>
                )}

                {/* KPI Cards section */}
                {activeTab !== 'report' && activeTab !== 'checklist' && activeTab !== 'personal' && (
                    <div className="relative z-10 transition-all duration-500">
                        <ActivityKPIs summary={summary} teamContributions={teamContributions} />
                    </div>
                )}

                {/* Main Content Area */}
                <main className="min-h-[60vh]">
                    {activeTab === 'performance' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {reports.filter(r => r.name.toLowerCase().includes(searchName.toLowerCase())).map((report, idx) => (
                                <UserActivityCard key={report.id || idx} data={{
                                    name: report.name,
                                    position: report.position,
                                    team: report.team,
                                    avatar: report.avatar,
                                    time: report.time,
                                    dailyGoal: report.dailyGoal,
                                    done: report.done,
                                    traffic: report.traffic,
                                    revenue: report.revenue,
                                    reportStatus: report.status,
                                    monthlyProgress: report.monthlyProgress
                                }} />
                            ))}
                        </div>
                    ) : activeTab === 'ranking' ? (
                        <RankingView rankings={rankings} />
                    ) : activeTab === 'personal' ? (
                        <div className="space-y-12">
                            {(userRole === 'admin' || userRole === 'leader') ? (
                                <>
                                    {/* Grid of Team Members for Admin/Leader */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-4">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                                {userRole === 'admin' ? 'Tất cả thành viên' : `Thành viên Team ${userTeam}`}
                                            </h3>
                                            <span className="text-[10px] font-bold text-slate-400">Chọn một thành viên để xem chi tiết</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                            {reports
                                                .filter(r => {
                                                    // For Admin, show all or filter by team if selected
                                                    if (userRole === 'admin') {
                                                        return activeTeam === 'All' || r.team === activeTeam;
                                                    }
                                                    // For Leader, show their team members (already filtered by API usually, but good to be sure)
                                                    return r.team === userTeam;
                                                })
                                                .filter(r => r.name.toLowerCase().includes(searchName.toLowerCase()))
                                                .map((report, idx) => (
                                                    <UserActivityCard
                                                        key={report.id || idx}
                                                        isActive={searchName === report.name}
                                                        onClick={() => setSearchName(report.name)}
                                                        data={{
                                                            ...report,
                                                            reportStatus: report.status
                                                        }}
                                                    />
                                                ))}
                                        </div>
                                    </div>

                                    {/* Detail View for Selected Member */}
                                    {searchName && (
                                        <div className="pt-12 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="text-center mb-10">
                                                <h2 className="text-xl font-black text-blue-600 uppercase tracking-tighter">
                                                    Biểu đồ hiệu suất: {searchName}
                                                </h2>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dữ liệu tổng hợp theo tháng</p>
                                            </div>
                                            <PersonalCharts
                                                history={personalHistory.history}
                                                teamStats={personalHistory.teamStats}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-12">
                                    <div className="flex justify-center">
                                        {reports.find(r => r.name.toLowerCase() === user?.full_name?.toLowerCase()) ? (
                                            <div className="w-full max-w-sm">
                                                <UserActivityCard data={{
                                                    ...reports.find(r => r.name.toLowerCase() === user?.full_name?.toLowerCase()),
                                                    reportStatus: reports.find(r => r.name.toLowerCase() === user?.full_name?.toLowerCase()).status
                                                }} />
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/20 shadow-inner w-full">
                                                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <User className="w-8 h-8 text-blue-400" />
                                                </div>
                                                <p className="text-slate-500 font-bold">Không tìm thấy dữ liệu cá nhân của bạn</p>
                                                <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest font-black">Vui lòng kiểm tra lại họ tên trong hệ thống</p>
                                            </div>
                                        )}
                                    </div>

                                    {personalHistory.history.length > 0 && (
                                        <div className="pt-12 border-t border-slate-100/50">
                                            <PersonalCharts history={personalHistory.history} teamStats={personalHistory.teamStats} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'daily_checklist' ? (() => {
                        const filteredOutstandings = reportOutstandings
                            .filter(r => activeTeam === 'All' || r.team === activeTeam)
                            .filter(r => r.name.toLowerCase().includes(searchName.toLowerCase()))
                            .filter(r => {
                                if (dailyFilter === 'all') return true;
                                const content = (r.content?.toLowerCase() || '').normalize('NFC');
                                if (dailyFilter === 'win') return content.includes('win');
                                if (dailyFilter === 'idea') return content.includes('đóng góp') || content.includes('ý kiến') || content.includes('cải tiến');
                                if (dailyFilter === 'difficulty') return !content.includes('win') && !content.includes('đóng góp') && !content.includes('ý kiến') && !content.includes('cải tiến');
                                return true;
                            });

                        const getReportStats = (items: any[]) => {
                            // Stats should always be calculated from the list BEFORE the dailyFilter but AFTER team/search filters
                            const baseItems = reportOutstandings
                                .filter(r => activeTeam === 'All' || r.team === activeTeam)
                                .filter(r => r.name.toLowerCase().includes(searchName.toLowerCase()));

                            let wins = 0;
                            let ideas = 0;
                            let difficulties = 0;

                            baseItems.forEach(r => {
                                const content = (r.content?.toLowerCase() || '').normalize('NFC');
                                if (content.includes('win')) {
                                    wins++;
                                } else if (content.includes('đóng góp') || content.includes('ý kiến') || content.includes('cải tiến')) {
                                    ideas++;
                                } else {
                                    difficulties++;
                                }
                            });

                            return { wins, ideas, difficulties };
                        };

                        const stats = getReportStats(filteredOutstandings);

                        return (
                            <div className="space-y-3">
                                {/* Stats Summary Table/Grid */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-4">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                                <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                                                Vấn đề nổi bật & Video Win
                                            </h3>
                                            {dailyFilter !== 'all' && (
                                                <button
                                                    onClick={() => setDailyFilter('all')}
                                                    className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md hover:bg-slate-200 transition-colors uppercase tracking-widest"
                                                >
                                                    Xem tất cả ✕
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                            {activeTeam === 'All' ? 'Toàn công ty' : `Team ${activeTeam}`} • {selectedDate.toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-1">
                                        <button
                                            onClick={() => setDailyFilter(dailyFilter === 'win' ? 'all' : 'win')}
                                            className={`border rounded-xl p-2.5 flex items-center justify-between group transition-all duration-300 ${dailyFilter === 'win'
                                                ? 'bg-green-600 border-green-600 shadow-md shadow-green-600/20'
                                                : 'bg-green-50/50 border-green-100 hover:bg-green-50'
                                                }`}
                                        >
                                            <div>
                                                <p className={`text-[8px] font-black uppercase tracking-widest mb-0 ${dailyFilter === 'win' ? 'text-green-100' : 'text-green-600/70'}`}>Video Win</p>
                                                <h4 className={`text-xl font-black leading-none ${dailyFilter === 'win' ? 'text-white' : 'text-green-600'}`}>{stats.wins}</h4>
                                            </div>
                                            <div className={`w-7 h-7 rounded-lg shadow-sm flex items-center justify-center text-xs group-hover:scale-110 transition-transform ${dailyFilter === 'win' ? 'bg-green-500 text-white' : 'bg-white'}`}>🏆</div>
                                        </button>

                                        <button
                                            onClick={() => setDailyFilter(dailyFilter === 'idea' ? 'all' : 'idea')}
                                            className={`border rounded-xl p-2.5 flex items-center justify-between group transition-all duration-300 ${dailyFilter === 'idea'
                                                ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-600/20'
                                                : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                                                }`}
                                        >
                                            <div>
                                                <p className={`text-[8px] font-black uppercase tracking-widest mb-0 ${dailyFilter === 'idea' ? 'text-blue-100' : 'text-blue-600/70'}`}>Ý kiến</p>
                                                <h4 className={`text-xl font-black leading-none ${dailyFilter === 'idea' ? 'text-white' : 'text-blue-600'}`}>{stats.ideas}</h4>
                                            </div>
                                            <div className={`w-7 h-7 rounded-lg shadow-sm flex items-center justify-center text-xs group-hover:scale-110 transition-transform ${dailyFilter === 'idea' ? 'bg-blue-500 text-white' : 'bg-white'}`}>💡</div>
                                        </button>

                                        <button
                                            onClick={() => setDailyFilter(dailyFilter === 'difficulty' ? 'all' : 'difficulty')}
                                            className={`border rounded-xl p-2.5 flex items-center justify-between group transition-all duration-300 ${dailyFilter === 'difficulty'
                                                ? 'bg-orange-600 border-orange-600 shadow-md shadow-orange-600/20'
                                                : 'bg-orange-50/50 border-orange-100 hover:bg-orange-50'
                                                }`}
                                        >
                                            <div>
                                                <p className={`text-[8px] font-black uppercase tracking-widest mb-0 ${dailyFilter === 'difficulty' ? 'text-orange-100' : 'text-orange-600/70'}`}>Khó khăn</p>
                                                <h4 className={`text-xl font-black leading-none ${dailyFilter === 'difficulty' ? 'text-white' : 'text-orange-600'}`}>{stats.difficulties}</h4>
                                            </div>
                                            <div className={`w-7 h-7 rounded-lg shadow-sm flex items-center justify-center text-xs group-hover:scale-110 transition-transform ${dailyFilter === 'difficulty' ? 'bg-orange-500 text-white' : 'bg-white'}`}>🛡️</div>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[1rem] border border-slate-200 shadow-lg overflow-hidden">
                                    <div className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                        <table className="w-full border-collapse text-left">
                                            <thead className="sticky top-0 z-20 shadow-sm">
                                                <tr className="bg-[#FAEEDD]">
                                                    <th className="px-3 py-1.5 text-[8px] font-black text-slate-800 uppercase tracking-widest border-b border-orange-100/50">ND</th>
                                                    <th className="px-3 py-1.5 text-[8px] font-black text-slate-800 uppercase tracking-widest border-b border-orange-100/50">Nhân viên</th>
                                                    <th className="px-3 py-1.5 text-[8px] font-black text-slate-800 uppercase tracking-widest border-b border-orange-100/50">Team</th>
                                                    <th className="px-3 py-1.5 text-[8px] font-black text-slate-800 uppercase tracking-widest border-b border-orange-100/50">ND Ý tưởng</th>
                                                    <th className="px-3 py-1.5 text-[8px] font-black text-slate-800 uppercase tracking-widest border-b border-orange-100/50 text-center">Xử lý</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredOutstandings.length > 0 ? (
                                                    filteredOutstandings.map((r, idx) => {
                                                        const contentLower = (r.content?.toLowerCase() || '').normalize('NFC');
                                                        const isWin = contentLower.includes('win');
                                                        const isIdea = contentLower.includes('đóng góp') || contentLower.includes('ý kiến') || contentLower.includes('cải tiến');

                                                        return (
                                                            <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-all duration-200 group">
                                                                <td className="px-3 py-1.5 border-r border-slate-50">
                                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border shadow-sm ${isWin ? 'bg-green-50 text-green-600 border-green-100' :
                                                                        isIdea ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                            'bg-orange-50 text-orange-600 border-orange-100'
                                                                        }`}>
                                                                        {r.content?.toUpperCase().replace('VIDEO SẢN PHẨM WIN', 'WIN').replace('Ý KIẾN ĐÓNG GÓP CẢI TIẾN MỚI', 'Ý TƯỞNG').replace('KHÓ KHĂN CẦN HỖ TRỢ', 'KHÓ KHĂN')}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 font-bold text-slate-700 text-[10px]">
                                                                    {r.name}
                                                                </td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50 font-black text-blue-600 text-[9px] italic tracking-tighter">
                                                                    {r.team}
                                                                </td>
                                                                <td className="px-3 py-1.5 border-r border-slate-50">
                                                                    <p className="text-[10px] text-slate-600 font-medium leading-tight italic max-w-[200px] truncate">
                                                                        "{r.idea_content}"
                                                                    </p>
                                                                </td>
                                                                <td className="px-3 py-1.5 text-center">
                                                                    <button
                                                                        onClick={() => !r.status && handleUpdateStatus(r.id, isWin || isIdea ? 'đã duyệt' : 'đã hỗ trợ')}
                                                                        disabled={!!r.status}
                                                                        className={`px-3 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-500 shadow-sm active:scale-95 whitespace-nowrap ${r.status === 'đã duyệt' ? 'bg-green-100/50 text-green-700 border border-green-200/50 cursor-default opacity-80' :
                                                                            r.status === 'đã hỗ trợ' ? 'bg-orange-100/50 text-orange-700 border border-orange-200/50 cursor-default opacity-80' :
                                                                                isWin ? 'bg-green-600 text-white hover:bg-green-700' :
                                                                                    isIdea ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                                                                        'bg-orange-500 text-white hover:bg-orange-600'
                                                                            }`}>
                                                                        {r.status === 'đã duyệt' ? '✓ Duyệt' :
                                                                            r.status === 'đã hỗ trợ' ? '✓ Hỗ trợ' :
                                                                                (isWin || isIdea ? 'Duyệt' : 'Hỗ trợ')}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-32 text-center">
                                                            <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                                                                <ClipboardList className="w-12 h-12 text-slate-400" />
                                                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">
                                                                    Chưa có dữ liệu cho ngày hôm nay
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Detailed Report Cards */}
                                <div className="space-y-4 mt-8">
                                    <div className="flex items-center justify-between px-4">
                                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                                            Chi tiết báo cáo ngày
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {reports.length > 0 ? (
                                            reports
                                                .filter((r: any) => activeTeam === 'All' || r.team === activeTeam)
                                                .filter((r: any) => r.name.toLowerCase().includes(searchName.toLowerCase()))
                                                .map((report: any) => (
                                                    <ReportCard key={report.id} report={report} />
                                                ))
                                        ) : (
                                            <div className="col-span-full text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                                    Không tìm thấy báo cáo chi tiết
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                        : activeTab === 'checklist' ? (
                            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
                                <ChecklistContainer />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {loading ? (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur rounded-[2rem] border border-white/20">
                                        <div className="relative">
                                            <RefreshCw className="w-12 h-12 animate-spin text-blue-600 opacity-20" />
                                            <RefreshCw className="w-12 h-12 animate-spin text-blue-600 absolute top-0 left-0 [animation-delay:-0.5s]" />
                                        </div>
                                        <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
                                    </div>
                                ) : reports.length > 0 ? (
                                    reports.filter((r: any) => r.name.toLowerCase().includes(searchName.toLowerCase())).map((report: any) => (
                                        <ReportCard key={report.id} report={report} />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-20 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/20 shadow-inner">
                                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-500 italic">
                                            Không tìm thấy báo cáo nào cho {activeTeam !== 'All' ? `team ${activeTeam}` : ''} ngày {selectedDate.toLocaleDateString('vi-VN')}.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                </main>
            </div>
        </div>
    );
};

export default UserActivityPage;
