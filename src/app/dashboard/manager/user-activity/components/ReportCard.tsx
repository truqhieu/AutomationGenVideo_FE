'use client';

import React from 'react';
import { Check, PieChart as PieIcon } from 'lucide-react';
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
        platform?: string;
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

import { 
    SiFacebook, 
    SiInstagram, 
    SiTiktok, 
    SiYoutube, 
    SiThreads, 
    SiZalo, 
    SiX 
} from 'react-icons/si';

const PLATFORM_STYLES: Record<string, { label: string; color: string; bgColor: string; icon?: React.ElementType }> = {
    fb: { label: 'Facebook', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.85)', icon: SiFacebook },
    ig: { label: 'Instagram', color: '#ec4899', bgColor: 'rgba(236,72,153,0.85)', icon: SiInstagram },
    tiktok: { label: 'TikTok', color: '#1f2937', bgColor: 'rgba(31,41,55,0.85)', icon: SiTiktok },
    yt: { label: 'Youtube', color: '#ef4444', bgColor: 'rgba(239,68,68,0.85)', icon: SiYoutube },
    thread: { label: 'Thread', color: '#6b7280', bgColor: 'rgba(107,114,128,0.85)', icon: SiThreads },
    zalo: { label: 'Zalo', color: '#0ea5e9', bgColor: 'rgba(14,165,233,0.85)', icon: SiZalo },
    lemon8: { label: 'Lemon8', color: '#eab308', bgColor: 'rgba(234,179,8,0.85)' },
    twitter: { label: 'X', color: '#111827', bgColor: 'rgba(17,24,39,0.85)', icon: SiX },
};

const TrafficChart = ({ trafficToday }: { trafficToday: TrafficToday }) => {
    if (!trafficToday.details || trafficToday.details.length === 0) return null;

    const platformTotals = Object.entries(PLATFORM_STYLES)
        .map(([key, style]) => ({
            key,
            ...style,
            value: trafficToday[key as keyof TrafficToday] as number || 0,
        }))
        .filter(p => p.value > 0)
        .sort((a, b) => b.value - a.value);

    return (
        <div className="border border-purple-100 rounded-3xl p-4 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all mt-2">
            <div className="mt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4 flex items-center gap-2">
                    <PieIcon className="w-3.5 h-3.5" /> Phân phối Traffic theo kênh
                </p>
                
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50">
                    {/* Interactive Pie Chart - Centered */}
                    <div className="w-full h-[260px] max-w-[260px] relative mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={trafficToday.details.map((entry, idx) => ({
                                        name: entry.channel || 'Hệ thống',
                                        value: Number(entry.value || 0),
                                        platform: entry.platform,
                                        id: entry.id || idx
                                    })).filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={110}
                                    paddingAngle={4}
                                    dataKey="value"
                                    animationDuration={1500}
                                    animationBegin={200}
                                >
                                    {(trafficToday.details.filter(e => Number(e.value || 0) > 0)).map((entry, idx) => {
                                        const platformStyle = PLATFORM_STYLES[entry.platform || ''];
                                        return (
                                            <Cell 
                                                key={`cell-${idx}`} 
                                                fill={platformStyle?.bgColor || '#8b5cf6'} 
                                                stroke="#fff"
                                                strokeWidth={3}
                                                className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                                            />
                                        );
                                    })}
                                </Pie>
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-200">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }} />
                                                        <span className="text-[10px] font-black text-slate-800 uppercase">{data.name}</span>
                                                    </div>
                                                    <p className="text-xs font-black text-purple-600">
                                                        {formatTrafficNumber(data.value)} Traffic
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Central Summary */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Tổng kênh</span>
                            <span className="text-xl font-black text-slate-800 leading-none">
                                {formatTrafficNumber(trafficToday.details.reduce((sum, e) => sum + Number(e.value || 0), 0))}
                            </span>
                        </div>
                    </div>

                    {/* Platform Traffic Notes (Notes màu và Tổng Traffic nền tảng) */}
                    <div className="w-full flex flex-wrap justify-center gap-3">
                        {platformTotals.map((p) => (
                            <div key={p.key} className="flex items-center gap-3 bg-white px-3 py-2 rounded-2xl border border-slate-100/50 hover:shadow-sm transition-all group">
                                <div 
                                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm transition-transform group-hover:scale-125" 
                                    style={{ backgroundColor: p.bgColor }} 
                                />
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">
                                            {p.label}
                                        </span>
                                        {p.icon && (
                                            <p.icon 
                                                className="w-3 h-3 transition-colors group-hover:opacity-100 opacity-80" 
                                                style={{ color: p.color }} 
                                            />
                                        )}
                                    </div>
                                    <span className="text-xs font-black text-slate-800 leading-none">
                                        {formatTrafficNumber(p.value)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
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
