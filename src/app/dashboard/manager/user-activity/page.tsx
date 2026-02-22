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
    CheckSquare
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

    const [activeTab, setActiveTab] = React.useState<'performance' | 'ranking' | 'personal' | 'report' | 'checklist'>('performance');
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
    }, [activeTab, user?.email]);

    const fetchHistory = async () => {
        if (!user?.email) return;
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/lark/personal-history?email=${user.email}`;
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
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    // Tabs filtering
    const allTabs = [
        { id: 'performance', label: 'Hiệu Suất', icon: RefreshCw },
        { id: 'ranking', label: 'BXH', icon: Layout },
        { id: 'personal', label: 'Cá nhân', icon: User },
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
                    ) : activeTab === 'checklist' ? (
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
