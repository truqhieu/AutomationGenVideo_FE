'use client';

import React from 'react';
import ActivityKPIs from './components/ActivityKPIs';
import ActivityFilters from './components/ActivityFilters';
import UserActivityCard, { UserActivity } from './components/UserActivityCard';
import ReportCard from './components/ReportCard';
import RankingView from './components/RankingView';
import ChecklistContainer from '@/components/checklist/ChecklistContainer';
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

    const [activeTab, setActiveTab] = React.useState<'performance' | 'ranking' | 'report' | 'checklist'>('performance');
    const [reports, setReports] = React.useState<any[]>([]);
    const [summary, setSummary] = React.useState<any>(null);
    const [rankings, setRankings] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);

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
    }, [selectedDate, activeTeam]); // Fetch data whenever filters change, regardless of tab

    const fetchReports = async () => {
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

            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/lark/user-activity?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();

            // Handle new response format { reports, summary, rankings }
            const reportsList = data.reports || data;
            const summaryData = data.summary || null;
            const rankingsData = data.rankings || null;

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
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    // No need for client-side filtering - API handles it
    // Use reports directly since they're already filtered by the backend

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-6 space-y-8">
            {/* Top Header */}
            <header className="space-y-4">
                {/* Logo Section - Top Left */}
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Layout className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-[#1e293b] tracking-tighter uppercase italic">VCB REPORT</h1>
                        <p className="text-xs font-bold text-gray-400 italic">Hi, {user?.full_name || 'Trung Hiếu'}</p>
                    </div>
                </div>

                {/* Navigation - Centered */}
                <div className="flex justify-center">
                    <nav className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100/50">
                        <button
                            onClick={() => setActiveTab('performance')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'performance'
                                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                                : 'text-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <RefreshCw className="w-4 h-4" /> Hiệu Suất
                        </button>
                        <button
                            onClick={() => setActiveTab('ranking')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'ranking'
                                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                                : 'text-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <Layout className="w-4 h-4" /> BXH
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50">
                            <User className="w-4 h-4" /> Cá Nhân
                        </button>
                        <button
                            onClick={() => setActiveTab('report')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'report'
                                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                                : 'text-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <FileText className="w-4 h-4" /> Báo cáo
                        </button>
                        <button
                            onClick={() => setActiveTab('checklist')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'checklist'
                                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                                : 'text-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <CheckSquare className="w-4 h-4" /> Checklist
                        </button>
                    </nav>
                </div>
            </header>

            {/* Filters */}
            {activeTab !== 'checklist' && (
                <ActivityFilters
                    activeTeam={activeTeam}
                    setActiveTeam={setActiveTeam}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    searchName={searchName}
                    setSearchName={setSearchName}
                />
            )}

            {/* KPI Cards - Only visible in Performance and Ranking tabs */}
            {activeTab !== 'report' && activeTab !== 'checklist' && (
                <ActivityKPIs summary={summary} />
            )}

            {activeTab === 'performance' ? (
                <>

                    {/* User Activity Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
                </>
            ) : activeTab === 'ranking' ? (
                <>
                    {/* Ranking View */}
                    <RankingView rankings={rankings} />
                </>
            ) : activeTab === 'checklist' ? (
                <>
                    <ChecklistContainer />
                </>
            ) : (
                <>
                    {/* Report Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {loading ? (
                            <div className="col-span-full flex justify-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : reports.length > 0 ? (
                            reports.filter((r: any) => r.name.toLowerCase().includes(searchName.toLowerCase())).map((report: any) => (
                                <ReportCard key={report.id} report={report} />
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-400 italic py-12">
                                Không tìm thấy báo cáo nào cho {activeTeam !== 'All' ? `team ${activeTeam}` : ''} ngày {selectedDate.toLocaleDateString('vi-VN')}.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default UserActivityPage;
