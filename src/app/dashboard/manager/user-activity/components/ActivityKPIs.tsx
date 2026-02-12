'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface ActivityKPIsProps {
    summary?: {
        totalVideoTarget: number;
        totalVideoCompleted: number;
        totalTrafficTarget: number;
        totalTrafficCompleted: number;
        totalRevenueTarget: number;
        totalRevenueCompleted: number;
    };
    teamContributions?: {
        team: string;
        videoPct: number;
        trafficPct: number;
        revenuePct: number;
    }[];
}

const ActivityKPIs = ({ summary, teamContributions }: ActivityKPIsProps) => {
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const calculatePercentage = (current: number, target: number) => {
        if (!target) return 0;
        return Math.min(100, Math.round((current / target) * 100));
    };

    const kpis = [
        {
            title: 'MỤC TIÊU VIDEO',
            value: formatNumber(summary?.totalVideoCompleted || 0),
            total: `${formatNumber(summary?.totalVideoTarget || 0)} Video`,
            percentage: calculatePercentage(summary?.totalVideoCompleted || 0, summary?.totalVideoTarget || 0),
            key: 'videoPct'
        },
        {
            title: 'TỔNG TRAFFIC',
            value: formatNumber(summary?.totalTrafficCompleted || 0),
            total: formatNumber(summary?.totalTrafficTarget || 0),
            percentage: calculatePercentage(summary?.totalTrafficCompleted || 0, summary?.totalTrafficTarget || 0),
            key: 'trafficPct'
        },
        {
            title: 'TỔNG DOANH THU',
            value: formatNumber(summary?.totalRevenueCompleted || 0),
            total: formatNumber(summary?.totalRevenueTarget || 0),
            percentage: calculatePercentage(summary?.totalRevenueCompleted || 0, summary?.totalRevenueTarget || 0),
            key: 'revenuePct'
        }
    ];

    const getTeamColor = (idx: number) => {
        const colors = [
            'bg-blue-500',
            'bg-red-500',
            'bg-orange-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-cyan-500',
            'bg-emerald-500'
        ];
        return colors[idx % colors.length];
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((kpi, idx) => (
                <Card key={idx} className="bg-[#0f172a] border-slate-800 shadow-xl rounded-[2.5rem] overflow-hidden hover:scale-[1.02] transition-all duration-300 border-b-4 border-b-blue-500/50">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em]">{kpi.title}</h3>
                            <div className="bg-blue-500/10 p-2 rounded-xl">
                                <Target className="w-4 h-4 text-blue-400" />
                            </div>
                        </div>

                        <div className="flex flex-col xl:flex-row items-center justify-between gap-6 mb-8">
                            <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                                {/* Enhanced Circular Progress */}
                                <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="38"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-slate-800"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="38"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={238.76}
                                        strokeDashoffset={238.76 * (1 - kpi.percentage / 100)}
                                        strokeLinecap="round"
                                        className={`transition-all duration-1000 ${kpi.percentage >= 100 ? "text-emerald-400" : "text-blue-500"}`}
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-xl font-black text-white">
                                        {kpi.percentage}%
                                    </span>
                                </div>
                            </div>

                            <div className="text-center xl:text-right min-w-0 flex-1">
                                <div className="text-3xl 2xl:text-4xl font-black text-white leading-tight mb-3 tracking-tighter break-all">
                                    {kpi.value}
                                </div>
                                <div className="inline-block px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap uppercase">MT: {kpi.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Team Contributions Section */}
                        <div className="pt-6 border-t border-slate-800/50 space-y-4">
                            <div className="flex justify-between items-center mr-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đóng góp theo Team</span>
                                <span className="text-[10px] font-black text-blue-400">Tháng này</span>
                            </div>

                            {/* Stacked Percentage Bar */}
                            <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-slate-800 p-0.5">
                                {teamContributions?.map((team, tIdx) => {
                                    const pct = team[kpi.key as keyof typeof team] as number;
                                    if (!pct) return null;
                                    return (
                                        <div
                                            key={tIdx}
                                            className={`h-full rounded-full border-r-2 border-slate-900 transition-all duration-700 ${getTeamColor(tIdx)}`}
                                            style={{ width: `${pct}%` }}
                                            title={`${team.team}: ${pct}%`}
                                        />
                                    );
                                })}
                            </div>

                            {/* Legend Grid - Modern Layout */}
                            <div className="grid grid-cols-2 gap-3">
                                {teamContributions?.filter(team => (team[kpi.key as keyof typeof team] as number) > 0).slice(0, 4).map((team, tIdx) => {
                                    const pct = team[kpi.key as keyof typeof team] as number;
                                    return (
                                        <div key={tIdx} className="bg-slate-800/30 p-2 rounded-xl border border-slate-800/50 hover:bg-slate-800 flex items-center gap-2 transition-colors">
                                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${getTeamColor(tIdx)}`} />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[9px] font-bold text-slate-400 truncate uppercase">{team.team}</span>
                                                <span className="text-xs font-black text-white">{pct}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
            }
        </div>
    );
};

export default ActivityKPIs;
