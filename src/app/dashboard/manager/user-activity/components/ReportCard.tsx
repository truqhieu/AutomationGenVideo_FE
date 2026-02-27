'use client';

import React from 'react';
import { Check } from 'lucide-react';

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
    questions: {
        question: string;
        answer: string;
    }[];
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

const ReportCard = ({ report }: { report: EmployeeReport }) => {
    const avatarSrc = getAvatarUrl(report.avatar, report.name);

    const statusRaw = (report.status || '').toString().toUpperCase();
    const isOnTime = statusRaw === 'SUBMITTED' || statusRaw.includes('ĐÚNG HẠN');
    const isUnreported = statusRaw.includes('CHƯA BÁO CÁO') || statusRaw === '' || statusRaw === 'PENDING';
    const isLate = !isOnTime && !isUnreported && (statusRaw.includes('TRỄ') || statusRaw.includes('LATE'));
    const showTime = report.time && report.time !== 'Chưa báo cáo';

    return (
        <div
            className={`rounded-2xl p-4 shadow-sm h-full flex flex-col gap-3 border transition-colors duration-200 ${
                isOnTime
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
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${report.position.toLowerCase().includes('lead')
                                    ? 'bg-orange-50 text-orange-600 border-orange-100'
                                    : 'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>
                                    {report.position}
                                </span>
                            )}
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded border border-gray-200 text-[10px] text-gray-500 mt-0.5">
                            {report.team}
                        </span>
                    </div>
                </div>

                <span
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center justify-end gap-1 ${
                        isOnTime
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
                        <span className="text-[9px] font-medium opacity-90">
                            • {report.time}
                        </span>
                    )}
                </span>
            </div>

            {/* Content for Submitted/Pending */}
            {(report.status === 'submitted' || report.status === 'ĐÚNG HẠN') ? (
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
                            <span className="text-[10px] font-bold text-blue-600 uppercase">
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
                                <p className="text-[10px] text-gray-500 mb-2 uppercase font-bold tracking-wide">
                                    {index + 1}. {q.question}
                                </p>
                                <p className="text-sm text-gray-900 font-medium">
                                    {q.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <span className="text-4xl mb-2">📋</span>
                    <span className="text-sm font-medium">Chưa có báo cáo hôm nay</span>
                </div>
            )}
        </div>
    );
};

export default ReportCard;
