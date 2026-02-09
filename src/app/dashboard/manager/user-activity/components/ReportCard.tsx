'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface EmployeeReport {
    id: string;
    name: string;
    team: string;
    avatar: string;
    status: string;
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

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <img
                        src={avatarSrc}
                        alt={report.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(report.name)}&background=random`;
                        }}
                    />
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{report.name}</h3>
                        <span className="inline-block px-2 py-0.5 rounded border border-gray-200 text-xs text-gray-500 mt-1">
                            {report.team}
                        </span>
                    </div>
                </div>

                <span className={`px-4 py-1.5 rounded-lg text-xs font-bold ${report.status === 'submitted' || report.status === 'ĐÚNG HẠN'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    {report.status === 'submitted' || report.status === 'ĐÚNG HẠN' ? 'ĐÚNG HẠN' : 'TRỄ HẠN'}
                </span>
            </div>

            {/* Content for Submitted/Pending */}
            {(report.status === 'submitted' || report.status === 'ĐÚNG HẠN') ? (
                <div className="space-y-4 flex-1">
                    {/* Checklist Section */}
                    <div className="border border-blue-100 rounded-xl p-4 bg-white">
                        <h4 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
                            <span className="text-blue-600">☑️</span> TIẾN ĐỘ CHECKLIST
                        </h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                                <div key={item.key} className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center ${report.checklist[item.key as keyof typeof report.checklist]
                                        ? 'bg-green-500'
                                        : 'bg-gray-200'
                                        }`}>
                                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Video Count Section */}
                    <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between border border-blue-100">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-500 text-lg">📹</span>
                            <span className="text-xs font-bold text-blue-600 uppercase">
                                SỐ VIDEO EDIT SỬ DỤNG &gt;50% SOURCE TỰ QUAY:
                            </span>
                        </div>
                        <span className="text-3xl font-bold text-blue-600 leading-none">
                            {report.videoCount}
                        </span>
                    </div>

                    {/* Questions Section */}
                    <div className="space-y-3">
                        {report.questions.map((q, index) => (
                            <div key={index} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
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
