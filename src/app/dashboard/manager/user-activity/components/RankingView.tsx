'use client';

import React from 'react';
import { Users, DollarSign } from 'lucide-react';

interface RankingUser {
    rank: number;
    name: string;
    position?: string;
    avatar: string;
    value: string;
}

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

interface RankingViewProps {
    rankings?: {
        traffic: RankingUser[];
        revenue: RankingUser[];
    };
}

const RankingView = ({ rankings }: RankingViewProps) => {
    const defaultTraffic: RankingUser[] = [
        { rank: 1, name: 'Quang Đạt', avatar: 'https://i.pravatar.cc/150?u=r1', value: '580,266' },
        { rank: 2, name: 'Nguyễn Toàn', avatar: 'https://i.pravatar.cc/150?u=r2', value: '222,026' },
        { rank: 3, name: 'Nguyễn Phương Thảo', avatar: 'https://i.pravatar.cc/150?u=r3', value: '159,988' },
        { rank: 4, name: 'Nguyễn Quốc Huy', avatar: 'https://i.pravatar.cc/150?u=r4', value: '50,749' },
        { rank: 5, name: 'Nguyễn Văn Đạt', avatar: 'https://i.pravatar.cc/150?u=r5', value: '11,552' },
    ];

    const defaultRevenue: RankingUser[] = [
        { rank: 1, name: 'Nguyễn Phương Thảo', avatar: 'https://i.pravatar.cc/150?u=r3', value: '0' },
        { rank: 2, name: 'Nguyễn Quốc Huy', avatar: 'https://i.pravatar.cc/150?u=r4', value: '0' },
        { rank: 3, name: 'Nguyễn Toàn', avatar: 'https://i.pravatar.cc/150?u=r2', value: '0' },
        { rank: 4, name: 'Nguyễn Văn Đạt', avatar: 'https://i.pravatar.cc/150?u=r5', value: '0' },
        { rank: 5, name: 'Quang Đạt', avatar: 'https://i.pravatar.cc/150?u=r1', value: '0' },
    ];

    const trafficRanking = rankings?.traffic || defaultTraffic;
    const revenueRanking = rankings?.revenue || defaultRevenue;

    const getMedalEmoji = (rank: number) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return null;
        }
    };

    const getRankBgColor = (rank: number) => {
        switch (rank) {
            case 1: return 'bg-yellow-50 border-yellow-200';
            case 2: return 'bg-gray-50 border-gray-200';
            case 3: return 'bg-orange-50 border-orange-200';
            default: return 'bg-white border-gray-100';
        }
    };

    const RankingCard = ({ title, icon: Icon, users }: { title: string; icon: any; users: RankingUser[] }) => (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${title.includes('TRAFFIC') ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-900 shadow-lg shadow-slate-900/20'}`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Top 5 Bùng nổ nhất</p>
                    </div>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Tháng 2/2026</span>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {users.map((user) => (
                    <div
                        key={user.rank}
                        className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${user.rank === 1 ? 'border-blue-500 bg-blue-50/30' :
                                user.rank === 2 ? 'border-slate-200 bg-slate-50/50' :
                                    user.rank === 3 ? 'border-slate-100 bg-slate-50/30' :
                                        'border-slate-50 bg-white'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 text-center">
                                {getMedalEmoji(user.rank) ? (
                                    <span className="text-2xl drop-shadow-sm">{getMedalEmoji(user.rank)}</span>
                                ) : (
                                    <span className="text-slate-300 font-black text-lg">0{user.rank}</span>
                                )}
                            </div>
                            <div className="relative">
                                <img
                                    src={getAvatarUrl(user.avatar, user.name)}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-2xl object-cover ring-4 ring-white shadow-md"
                                    onError={(e) => {
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                                    }}
                                />
                                {user.rank === 1 && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 tracking-tight">{user.name}</span>
                                <span className="text-[9px] font-black text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-lg w-fit uppercase tracking-wider mt-1">
                                    {user.position || 'Thành viên'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-black text-slate-900 block leading-none">{user.value}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                {title.includes('TRAFFIC') ? 'Lượt xem' : 'VND'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RankingCard title="BXH TRAFFIC" icon={Users} users={trafficRanking} />
            <RankingCard title="BXH DOANH THU" icon={DollarSign} users={revenueRanking} />
        </div>
    );
};

export default RankingView;
