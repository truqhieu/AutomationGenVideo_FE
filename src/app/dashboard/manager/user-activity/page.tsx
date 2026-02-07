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

    const mockReports = [
        { id: '1', name: 'Bùi Minh Quyết', team: 'Team K2', avatar: 'https://i.pravatar.cc/150?u=1', status: 'submitted' as const, checklist: { fb: true, ig: true, captionHashtag: true, tiktok: true, youtube: true, reportLink: true }, videoCount: 4, questions: [{ question: 'NGHỈ QUÁ CÓ MỚI SÁNG TẠO GÌ ĐƯỢC SỬ DỤNG VÀO CÔNG VIỆC CỦA MÌNH KHÔNG?', answer: 'Không có gì' }, { question: 'HÔM QUA CÓ GẶP MẤN SÁNG TẠO GÌ ĐƯỢC SỬ DỤNG VÀO CÔNG VIỆC CỦA MÌNH KHÔNG?', answer: 'Không có gì' }] },
        { id: '2', name: 'Chung Đỗ', team: 'Global JP4', avatar: 'https://i.pravatar.cc/150?u=2', status: 'pending' as const, checklist: { fb: false, ig: false, captionHashtag: false, tiktok: false, youtube: false, reportLink: false }, videoCount: 0, questions: [] },
    ];

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
            <ActivityFilters />

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
                        {mockReports.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default UserActivityPage;
