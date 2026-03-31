'use client';

import Image from "next/image";
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

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1: return {
                container: 'border-2 border-yellow-400/70 bg-gradient-to-r from-yellow-50 via-amber-50/80 to-yellow-50 shadow-[0_0_20px_-4px_rgba(234,179,8,0.3)]',
                nameColor: 'text-yellow-900',
                valueColor: 'text-yellow-700',
                accentBar: 'bg-gradient-to-b from-yellow-400 to-amber-500',
                avatarRing: 'ring-yellow-300/60 shadow-[0_0_12px_-2px_rgba(234,179,8,0.4)]',
                badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            };
            case 2: return {
                container: 'border-2 border-slate-300/70 bg-gradient-to-r from-slate-50 via-gray-50/80 to-slate-100/50 shadow-[0_0_16px_-4px_rgba(148,163,184,0.3)]',
                nameColor: 'text-slate-800',
                valueColor: 'text-slate-600',
                accentBar: 'bg-gradient-to-b from-slate-400 to-slate-500',
                avatarRing: 'ring-slate-300/60 shadow-[0_0_10px_-2px_rgba(148,163,184,0.3)]',
                badge: 'bg-slate-100 text-slate-600 border-slate-200',
            };
            case 3: return {
                container: 'border-2 border-orange-300/60 bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-orange-50/60 shadow-[0_0_14px_-4px_rgba(251,146,60,0.25)]',
                nameColor: 'text-orange-900',
                valueColor: 'text-orange-600',
                accentBar: 'bg-gradient-to-b from-orange-400 to-amber-600',
                avatarRing: 'ring-orange-300/50 shadow-[0_0_8px_-2px_rgba(251,146,60,0.3)]',
                badge: 'bg-orange-100 text-orange-600 border-orange-200',
            };
            default: return {
                container: 'border border-slate-100 bg-white hover:bg-slate-50/50',
                nameColor: 'text-slate-900',
                valueColor: 'text-slate-700',
                accentBar: '',
                avatarRing: 'ring-white',
                badge: 'bg-blue-100/50 text-blue-600',
            };
        }
    };

    const RankingCard = ({ title, icon: Icon, users }: { title: string; icon: any; users: RankingUser[] }) => (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${title.includes('TRAFFIC') ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-blue-800 shadow-lg shadow-blue-800/20'}`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Top 5 Bùng nổ nhất</p>
                    </div>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase">Tháng 2/2026</span>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {users.map((user) => {
                    const style = getRankStyle(user.rank);
                    const isTop3 = user.rank <= 3;

                    return (
                        <div
                            key={user.rank}
                            className={`relative flex items-center justify-between p-5 rounded-3xl transition-all duration-300 hover:scale-[1.01] hover:shadow-lg overflow-hidden ${style.container}`}
                        >
                            {/* Accent bar for top 3 */}
                            {isTop3 && (
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl ${style.accentBar}`} />
                            )}

                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 text-center">
                                    {getMedalEmoji(user.rank) ? (
                                        <span className={`text-2xl drop-shadow-sm ${isTop3 ? 'animate-[bounce_2s_ease-in-out_infinite]' : ''}`}>
                                            {getMedalEmoji(user.rank)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-300 font-black text-lg">0{user.rank}</span>
                                    )}
                                </div>
                                <div className="relative">
                                    <Image
                                        src={getAvatarUrl(user.avatar, user.name)}
                                        alt={user.name}
                                        className={`w-12 h-12 rounded-2xl object-cover ring-4 shadow-md ${style.avatarRing}`}
                                        onError={(e) => {
                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                                        }}
                                     width={48} height={48} sizes="48px" unoptimized/>
                                    {user.rank === 1 && (
                                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                                                <span className="text-[10px]">👑</span>
                                            </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`font-black tracking-tight ${isTop3 ? 'text-base' : 'text-sm'} ${style.nameColor} truncate max-w-[120px] sm:max-w-[200px]`}>
                                        {user.name}
                                    </span>
                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg w-fit uppercase tracking-wider mt-1 border ${style.badge}`}>
                                        {user.position || 'Member'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`font-black block leading-none ${isTop3 ? 'text-xl' : 'text-lg'} ${style.valueColor}`}>
                                    {user.value}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                                    {title.includes('TRAFFIC') ? 'Lượt xem' : 'VND'}
                                </span>
                            </div>
                        </div>
                    );
                })}
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
