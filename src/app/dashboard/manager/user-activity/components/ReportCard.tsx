'use client';

import React from 'react';
import { Check, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface TrafficToday {
    fb: number;
    ig: number;
    tiktok: number;
    yt: number;
    thread: number;
    lemon8: number;
    zalo: number;
    twitter: number;
    total: number;
    details?: {
        id: string;
        value: string;
        channel: string;
        evidences?: { url: string; name: string; token: string }[];
    }[];
}

interface EmployeeReport {
    id: string;
    name: string;
    position?: string;
    team: string;
    avatar: string;
    status: string;
    submittedAt?: string;
    time?: string;
    checklist: {
        fb: boolean;
        ig: boolean;
        captionHashtag: boolean;
        tiktok: boolean;
        youtube: boolean;
        zalo: boolean;
        lark: boolean;
        reportLink: boolean;
    };
    videoCount: number;
    trafficToday?: TrafficToday | null;
    questions: {
        question: string;
        answer: string;
    }[];
}

const getAvatarUrl = (url: string | null, name: string) => {
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    if (url.includes('drive.google.com')) {
        const match = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200`;
        }
    }
    return url;
};

const formatTrafficNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('vi-VN');
};

const PLATFORM_STYLES: Record<string, { label: string; color: string; bgColor: string }> = {
    fb: { label: 'Facebook', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.85)' },
    ig: { label: 'Instagram', color: '#ec4899', bgColor: 'rgba(236,72,153,0.85)' },
    tiktok: { label: 'TikTok', color: '#1f2937', bgColor: 'rgba(31,41,55,0.85)' },
    yt: { label: 'Youtube', color: '#ef4444', bgColor: 'rgba(239,68,68,0.85)' },
    thread: { label: 'Thread', color: '#6b7280', bgColor: 'rgba(107,114,128,0.85)' },
    zalo: { label: 'Zalo', color: '#0ea5e9', bgColor: 'rgba(14,165,233,0.85)' },
    lemon8: { label: 'Lemon8', color: '#eab308', bgColor: 'rgba(234,179,8,0.85)' },
    twitter: { label: 'X', color: '#111827', bgColor: 'rgba(17,24,39,0.85)' },
};

const TrafficChart = ({ trafficToday }: { trafficToday: TrafficToday }) => {
    const platforms = Object.entries(PLATFORM_STYLES)
        .map(([key, style]) => ({
            key,
            ...style,
            value: trafficToday[key as keyof TrafficToday] as number || 0,
        }))
        .filter(p => p.value > 0)
        .sort((a, b) => b.value - a.value);

    if (platforms.length === 0) return null;

    const maxVal = Math.max(...platforms.map(p => p.value));

    const generateTicks = (max: number) => {
        if (max <= 0) return [0];
        const rawStep = max / 4;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const step = Math.ceil(rawStep / magnitude) * magnitude;
        const ticks: number[] = [];
        for (let i = 0; i <= max; i += step) ticks.push(i);
        if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
        return ticks;
    };

    const ticks = generateTicks(maxVal);
    const chartMax = ticks[ticks.length - 1] || 1;

    return (
        <div className="border border-purple-100 rounded-3xl p-4 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all mt-2">
            <h4 className="text-[11px] font-black text-purple-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp className="w-4 h-4" strokeWidth={3} /> TRAFFIC TIẾP CẬN
            </h4>

            {/* Chart Area */}
            <div className="flex" style={{ height: 100 }}>
                <div className="flex flex-col justify-between pr-3 shrink-0" style={{ height: 100 }}>
                    {[...ticks].reverse().map((tick, i) => (
                        <span key={i} className="text-[10px] text-gray-400 font-black leading-none text-right min-w-[30px]">
                            {formatTrafficNumber(tick)}
                        </span>
                    ))}
                </div>

                <div className="flex-1 relative">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {ticks.map((_, i) => (
                            <div key={i} className="border-b border-slate-50 w-full h-0" />
                        ))}
                    </div>

                    <div className="relative flex items-end justify-center gap-8 h-full pt-4">
                        {platforms.map((p) => {
                            const pct = chartMax > 0 ? (p.value / chartMax) * 100 : 0;
                            return (
                                <div key={p.key} className="flex flex-col items-center w-8 h-full justify-end group shrink-0 relative">
                                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-none scale-90 group-hover:scale-100">
                                        <div className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-lg whitespace-nowrap shadow-xl">
                                            {p.label}: {formatTrafficNumber(p.value)}
                                        </div>
                                    </div>
                                    <div
                                        className="w-full rounded-t-xl transition-all duration-500 hover:scale-x-110 shadow-sm"
                                        style={{ height: `${pct}%`, backgroundColor: p.bgColor }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend Section */}
            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2.5 px-2 border-t border-slate-50 pt-4">
                {platforms.map((p) => (
                    <div key={p.key} className="flex items-center gap-2 group">
                        <div 
                            className="w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-white transition-all group-hover:scale-125" 
                            style={{ backgroundColor: p.bgColor }} 
                        />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">
                            {p.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Detailed Breakdown with Images */}
            {trafficToday.details && trafficToday.details.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4 flex items-center gap-2">
                        <PieIcon className="w-3.5 h-3.5" /> Phân phối Traffic theo kênh
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                        {trafficToday.details.map((entry, idx) => (
                            <div key={entry.id || idx} className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-purple-400 rounded-full" />
                                        <span className="text-xs font-black text-slate-700 uppercase">{entry.channel || 'Kênh hệ thống'}</span>
                                    </div>
                                    <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                                        {Number(entry.value || 0).toLocaleString('vi-VN')}
                                    </span>
                                </div>

                                {entry.evidences && entry.evidences.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2.5">
                                        {entry.evidences.filter(ev => ev).map((ev, evIdx) => (
                                            <div 
                                                key={evIdx} 
                                                className="w-11 h-11 rounded-xl border border-white shadow-sm overflow-hidden cursor-zoom-in hover:scale-110 transition-all duration-300"
                                                onClick={() => window.open(ev.url, '_blank')}
                                            >
                                                <img src={ev.url} alt={ev.name} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ReportCard = ({ report }: { report: EmployeeReport }) => {
    const avatarSrc = getAvatarUrl(report.avatar, report.name);

    const statusRaw = (report.status || '').toString().toUpperCase();
    const isOnTime = statusRaw === 'SUBMITTED' || statusRaw.includes('ĐÚNG HẠN');
    const isUnreported = statusRaw.includes('CHƯA BÁO CÁO') || statusRaw === '' || statusRaw === 'PENDING';
    const isLate = !isOnTime && !isUnreported && (statusRaw.includes('TRỄ') || statusRaw.includes('LATE'));
    const showTime = report.time && report.time !== 'Chưa báo cáo';

    const hasTraffic = report.trafficToday && Object.entries(PLATFORM_STYLES).some(
        ([key]) => (report.trafficToday?.[key as keyof TrafficToday] as number || 0) > 0
    );

    return (
        <div
            className={`rounded-2xl p-4 shadow-sm h-full flex flex-col gap-3 border transition-colors duration-200 ${isOnTime
                    ? 'bg-emerald-50 border-emerald-200'
                    : isLate
                        ? 'bg-amber-50 border-amber-200'
                        : isUnreported
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-gray-100'
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={avatarSrc}
                        alt={report.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(report.name)}&background=random`;
                        }}
                    />
                    <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{report.name}</h3>
                            {report.position && (
                                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded border ${report.position.toLowerCase().includes('lead')
                                    ? 'bg-orange-50 text-orange-600 border-orange-100'
                                    : 'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>
                                    {report.position}
                                </span>
                            )}
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded border border-gray-200 text-xs text-gray-500 mt-0.5">
                            {report.team}
                        </span>
                    </div>
                </div>

                <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center justify-end gap-1 ${isOnTime
                            ? 'bg-emerald-500 text-white'
                            : isLate
                                ? 'bg-amber-400 text-white'
                                : isUnreported
                                    ? 'bg-red-500 text-white'
                                    : 'bg-slate-300 text-slate-800'
                        }`}
                >
                    <span>
                        {isOnTime
                            ? 'ĐÚNG HẠN'
                            : isLate
                                ? 'TRỄ HẠN'
                                : isUnreported
                                    ? 'CHƯA BÁO CÁO'
                                    : report.status || 'TRẠNG THÁI?'}
                    </span>
                    {showTime && (
                        <span className="text-[11px] font-medium opacity-90">
                            • {report.time}
                        </span>
                    )}
                </span>
            </div>

            {/* Content for Submitted/Pending */}
            {(report.status === 'submitted' || report.status === 'ĐÚNG HẠN' || (report.questions && report.questions.length > 0)) ? (
                <div className="space-y-3 flex-1">
                    {/* Checklist Section */}
                    <div className="border border-blue-100 rounded-xl p-3 bg-white">
                        <h4 className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-2">
                            <span className="text-blue-600">☑️</span> TIẾN ĐỘ CHECKLIST
                        </h4>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            {[
                                { key: 'fb', label: 'FB' },
                                { key: 'tiktok', label: 'Tiktok' },
                                { key: 'ig', label: 'IG' },
                                { key: 'youtube', label: 'Youtube' },
                                { key: 'zalo', label: 'ZaloVideo' },
                                { key: 'captionHashtag', label: 'Caption & Hashtag' },
                                { key: 'lark', label: 'Báo cáo Lark' },
                                { key: 'reportLink', label: 'Báo cáo Link' },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center gap-1.5">
                                    <div className={`w-4 h-4 rounded flex items-center justify-center ${report.checklist[item.key as keyof typeof report.checklist]
                                        ? 'bg-green-500'
                                        : 'bg-gray-200'
                                        }`}>
                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    </div>
                                    <span className="text-xs text-gray-700 font-medium">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Video Count Section */}
                    <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between border border-blue-100">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-500 text-base">📹</span>
                            <span className="text-xs font-bold text-blue-600 uppercase">
                                SỐ VIDEO EDIT SỬ DỤNG &gt;50% SOURCE TỰ QUAY:
                            </span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600 leading-none">
                            {report.videoCount}
                        </span>
                    </div>

                    {/* Questions Section */}
                    <div className="space-y-2.5">
                        {report.questions.map((q, index) => (
                            <div key={index} className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm">
                                <p className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wide">
                                    {index + 1}. {q.question}
                                </p>
                                <p className="text-sm text-gray-900 font-medium">
                                    {q.answer}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Traffic Chart - Below questions */}
                    {hasTraffic && report.trafficToday && (
                        <TrafficChart trafficToday={report.trafficToday} />
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-3">
                    {/* Show traffic chart even when work report is missing */}
                    {hasTraffic && report.trafficToday && (
                        <TrafficChart trafficToday={report.trafficToday} />
                    )}
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <span className="text-4xl mb-2">📋</span>
                        <span className="text-sm font-medium">Chưa có báo cáo hôm nay</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportCard;


