'use client';

import React from 'react';
import { Check, TrendingUp } from 'lucide-react';

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

const PLATFORM_STYLES: Record<string, { label: string; barColor: string; textColor: string }> = {
    fb: { label: 'FB', barColor: 'bg-blue-500', textColor: 'text-blue-700' },
    ig: { label: 'IG', barColor: 'bg-gradient-to-t from-pink-500 to-purple-500', textColor: 'text-pink-700' },
    tiktok: { label: 'TikTok', barColor: 'bg-gray-800', textColor: 'text-gray-800' },
    yt: { label: 'YT', barColor: 'bg-red-500', textColor: 'text-red-700' },
    thread: { label: 'Thread', barColor: 'bg-gray-600', textColor: 'text-gray-700' },
    zalo: { label: 'Zalo', barColor: 'bg-sky-500', textColor: 'text-sky-700' },
    lemon8: { label: 'Lemon8', barColor: 'bg-yellow-500', textColor: 'text-yellow-700' },
    twitter: { label: 'X', barColor: 'bg-gray-900', textColor: 'text-gray-800' },
};

const TrafficChart = ({ trafficToday }: { trafficToday: TrafficToday }) => {
    const platforms = Object.entries(PLATFORM_STYLES)
        .map(([key, style]) => ({
            key,
            ...style,
            value: trafficToday[key as keyof TrafficToday] as number || 0,
        }))
        .filter(p => p.value > 0);

    if (platforms.length === 0) return null;

    const maxVal = Math.max(...platforms.map(p => p.value));

    return (
        <div className="border border-purple-100 rounded-xl p-3 bg-white">
            <h4 className="text-xs font-bold text-purple-600 mb-3 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> BÁO CÁO TRAFFIC
            </h4>
            <div className="flex items-end justify-around gap-1.5" style={{ height: 120 }}>
                {platforms.map((p) => {
                    const pct = maxVal > 0 ? Math.max((p.value / maxVal) * 100, 10) : 0;
                    return (
                        <div key={p.key} className="flex flex-col items-center gap-1 flex-1 min-w-0 h-full justify-end">
                            <span className={`text-[10px] font-bold ${p.textColor} leading-none`}>
                                {formatTrafficNumber(p.value)}
                            </span>
                            <div className="w-full flex justify-center" style={{ height: `${pct}%` }}>
                                <div
                                    className={`w-full max-w-[32px] rounded-t-md ${p.barColor} transition-all duration-700 ease-out`}
                                    style={{ height: '100%' }}
                                />
                            </div>
                            <span className={`text-[10px] font-bold ${p.textColor} leading-none mt-0.5 truncate w-full text-center`}>
                                {p.label}
                            </span>
                        </div>
                    );
                })}
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


