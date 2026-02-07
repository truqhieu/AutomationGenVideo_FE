'use client';

import React from 'react';
import { Users, DollarSign } from 'lucide-react';

interface RankingUser {
    rank: number;
    name: string;
    avatar: string;
    value: string;
}

const RankingView = () => {
    const trafficRanking: RankingUser[] = [
        { rank: 1, name: 'Quang Đạt', avatar: 'https://i.pravatar.cc/150?u=r1', value: '580,266' },
        { rank: 2, name: 'Nguyễn Toàn', avatar: 'https://i.pravatar.cc/150?u=r2', value: '222,026' },
        { rank: 3, name: 'Nguyễn Phương Thảo', avatar: 'https://i.pravatar.cc/150?u=r3', value: '159,988' },
        { rank: 4, name: 'Nguyễn Quốc Huy', avatar: 'https://i.pravatar.cc/150?u=r4', value: '50,749' },
        { rank: 5, name: 'Nguyễn Văn Đạt', avatar: 'https://i.pravatar.cc/150?u=r5', value: '11,552' },
    ];

    const revenueRanking: RankingUser[] = [
        { rank: 1, name: 'Nguyễn Phương Thảo', avatar: 'https://i.pravatar.cc/150?u=r3', value: '0' },
        { rank: 2, name: 'Nguyễn Quốc Huy', avatar: 'https://i.pravatar.cc/150?u=r4', value: '0' },
        { rank: 3, name: 'Nguyễn Toàn', avatar: 'https://i.pravatar.cc/150?u=r2', value: '0' },
        { rank: 4, name: 'Nguyễn Văn Đạt', avatar: 'https://i.pravatar.cc/150?u=r5', value: '0' },
        { rank: 5, name: 'Quang Đạt', avatar: 'https://i.pravatar.cc/150?u=r1', value: '0' },
    ];

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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${title.includes('TRAFFIC') ? 'bg-blue-100' : 'bg-green-100'}`}>
                    <Icon className={`w-5 h-5 ${title.includes('TRAFFIC') ? 'text-blue-600' : 'text-green-600'}`} />
                </div>
                <h3 className="text-lg font-black text-gray-900">{title}</h3>
            </div>

            <div className="space-y-3">
                {users.map((user) => (
                    <div
                        key={user.rank}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${getRankBgColor(user.rank)}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 min-w-[60px]">
                                {getMedalEmoji(user.rank) ? (
                                    <span className="text-2xl">{getMedalEmoji(user.rank)}</span>
                                ) : (
                                    <span className="text-gray-400 font-bold text-sm">#{user.rank}</span>
                                )}
                            </div>
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            <span className="font-semibold text-gray-900">{user.name}</span>
                        </div>
                        <span className="text-blue-600 font-bold text-lg">{user.value}</span>
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
