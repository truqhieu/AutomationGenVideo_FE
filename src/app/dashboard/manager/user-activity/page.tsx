'use client';

import React from 'react';
import ActivityKPIs from './components/ActivityKPIs';
import ActivityFilters from './components/ActivityFilters';
import UserActivityCard, { UserActivity } from './components/UserActivityCard';
import ReportCard from './components/ReportCard';
import RankingView from './components/RankingView';
import {
    RefreshCw,
    Layout,
    User,
    FileText,
    LogOut,
    Settings
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

const mockUsers: UserActivity[] = [
    { name: 'Bùi Minh Quyết', team: 'TEAM K2', avatar: 'https://i.pravatar.cc/150?u=1', time: '07:00 07-02', dailyGoal: 6, done: 0, traffic: '138.586', revenue: '61.849.000', reportStatus: 'CHƯA BÁO CÁO', monthlyProgress: 18 },
    { name: 'Chung Đỗ', team: 'GLOBAL JP4', avatar: 'https://i.pravatar.cc/150?u=2', time: '07:00 07-02', dailyGoal: 3, done: 0, traffic: '423.789', revenue: '0', reportStatus: 'CHƯA BÁO CÁO', monthlyProgress: 22 },
    { name: 'Cường Đoàn Thạch', team: 'GLOBAL JP4', avatar: 'https://i.pravatar.cc/150?u=3', time: '07:00 07-02', dailyGoal: 6, done: 0, traffic: '0', revenue: '0', reportStatus: 'CHƯA BÁO CÁO', monthlyProgress: 13 },
    { name: 'Huyền Trang', team: 'TEAM K2', avatar: 'https://i.pravatar.cc/150?u=4', time: '07:00 07-02', dailyGoal: 6, done: 0, traffic: '2.074.800', revenue: '0', reportStatus: 'CHƯA BÁO CÁO', monthlyProgress: 17 },
    { name: 'Hằng Minh', team: 'GLOBAL JP2', avatar: 'https://i.pravatar.cc/150?u=5', time: '07:00 07-02', dailyGoal: 3, done: 0, traffic: '1.287.229', revenue: '0', reportStatus: 'CHƯA BÁO CÁO', monthlyProgress: 20 },
    { name: 'Khuc Quan', team: 'GLOBAL JP3', avatar: 'https://i.pravatar.cc/150?u=6', time: '07:00 07-02', dailyGoal: 5, done: 0, traffic: '214.690', revenue: '0', reportStatus: 'CHƯA BÁO CÁO', monthlyProgress: 20 },
    { name: 'Lương Lý Đức', team: 'GLOBAL JP2', avatar: 'https://i.pravatar.cc/150?u=7', time: '07:00 07-02', dailyGoal: 4, done: 0, traffic: '63.216', revenue: '0', reportStatus: 'CHƯA BÁO CÁO', monthlyProgress: 22 },
    { name: 'Lệnh Ngọc Khánh', team: 'GLOBAL JP2', avatar: 'https://i.pravatar.cc/150?u=8', time: 'Chưa báo cáo', dailyGoal: 0, done: 0, traffic: '0', revenue: '0', reportStatus: 'CHƯA BÁO CÁO', monthlyProgress: 0 },
    { name: 'Nguyễn An', team: 'TEAM K1', avatar: 'https://i.pravatar.cc/150?u=9', time: '07:00 07-02', dailyGoal: 6, done: 0, traffic: '1.048.471', revenue: '20.810.000', reportStatus: 'CHƯA BÁO CÁO', monthlyProgress: 18 },
    { name: 'Nguyễn Bá Tuấn Anh', team: 'TEAM K0', avatar: 'https://i.pravatar.cc/150?u=10', time: '07:00 07-02', dailyGoal: 4, done: 0, traffic: '0', revenue: '0', reportStatus: 'CHƯA BÁO CÁO', monthlyProgress: 20 },
];

const UserActivityPage = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = React.useState<'performance' | 'ranking' | 'report'>('performance');
    const [reports, setReports] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    // Filter states
    const [activeTeam, setActiveTeam] = React.useState('All');
    const [selectedDate, setSelectedDate] = React.useState(new Date());

    React.useEffect(() => {
        if (activeTab === 'report') {
            fetchReports();
        }
    }, [activeTab]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/lark/report`);
            const data = await response.json();

            // Map backend data to frontend interface
            const mappedReports = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                team: item.team,
                avatar: item.avatar,
                status: item.status,
                submittedAt: item.submitted_at, // Keep raw date for filtering
                checklist: {
                    fb: item.checklist?.fb || false,
                    ig: item.checklist?.ig || false,
                    tiktok: item.checklist?.tiktok || false,
                    youtube: item.checklist?.youtube || false,
                    zalo: item.checklist?.zalo || false,
                    lark: item.checklist?.lark || false,
                    reportLink: item.checklist?.reportLink || false,
                    captionHashtag: item.checklist?.caption_hashtag || false,
                },
                videoCount: item.video_source_count || 0,
                questions: [
                    { question: 'NGÀY HÔM QUA CÔNG VIỆC BẠN CÓ CẢI GÌ KHIẾN BẠN TỰ HÀO VÀ THÍCH THÚ NHẤT?', answer: item.questions?.q1 || 'Không có' },
                    { question: 'HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỢC ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?', answer: item.questions?.q2 || 'Không có' },
                    { question: 'BẠN CÓ GẶP KHÓ KHĂN NÀO CẦN HỖ TRỢ KHÔNG?', answer: item.questions?.q3 || 'Không có' },
                    { question: 'BẠN CÓ ĐÓNG GÓP Ý TƯỞNG HAY ĐỀ XUẤT GÌ KHÔNG?', answer: item.questions?.q4 || 'Không có' },
                    { question: 'BẠN CÓ SẢN PHẨM (A4 - A5) NÀO WIN MỚI KHÔNG? (>5K VIEW - >10 CMT HỎI GIÁ?)', answer: item.questions?.q5 || 'Không có' },
                ]
            }));
            setReports(mappedReports);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredReports = React.useMemo(() => {
        return reports.filter(report => {
            // Filter by Team
            if (activeTeam !== 'All') {
                // Approximate matching or exact matching depending on data
                // Data has "Team ADS", "Global - JP1", etc.
                if (report.team !== activeTeam) return false;
            }

            // Filter by Date
            if (selectedDate) {
                const reportDate = new Date(report.submittedAt);
                // Compare Year, Month, Day
                if (
                    reportDate.getDate() !== selectedDate.getDate() ||
                    reportDate.getMonth() !== selectedDate.getMonth() ||
                    reportDate.getFullYear() !== selectedDate.getFullYear()
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [reports, activeTeam, selectedDate]);

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
                    </nav>
                </div>
            </header>

            {/* Filters */}
            <ActivityFilters
                activeTeam={activeTeam}
                setActiveTeam={setActiveTeam}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />

            {activeTab === 'performance' ? (
                <>
                    {/* KPI Cards */}
                    <ActivityKPIs />

                    {/* User Activity Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {mockUsers.map((user, idx) => (
                            <UserActivityCard key={idx} data={user} />
                        ))}
                    </div>
                </>
            ) : activeTab === 'ranking' ? (
                <>
                    {/* KPI Cards */}
                    <ActivityKPIs />

                    {/* Ranking View */}
                    <RankingView />
                </>
            ) : (
                <>
                    {/* Report Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {loading ? (
                            <div className="col-span-full flex justify-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : filteredReports.length > 0 ? (
                            filteredReports.map((report) => (
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
