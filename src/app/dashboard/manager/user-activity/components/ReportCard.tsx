'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface EmployeeReport {
    id: string;
    name: string;
    team: string;
    avatar: string;
    status: 'submitted' | 'pending';
    checklist: {
        fb: boolean;
        ig: boolean;
        captionHashtag: boolean;
        tiktok: boolean;
        youtube: boolean;
        reportLink: boolean;
    };
    videoCount: number;
    questions: {
        question: string;
        answer: string;
    }[];
}

const ReportCard = ({ report }: { report: EmployeeReport }) => {
    return (
        <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${report.status === 'pending' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
            }`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <img
                        src={report.avatar}
                        alt={report.name}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                        <h3 className="font-bold text-gray-900">{report.name}</h3>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {report.team}
                        </span>
                    </div>
                </div>

                <span className={`px-4 py-1.5 rounded-lg text-xs font-bold ${report.status === 'submitted'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                    {report.status === 'submitted' ? 'ĐĂNG HẢN' : 'CHƯA BÁO CÁO'}
                </span>
            </div>

            {/* Pending State */}
            {report.status === 'pending' && (
                <div className="text-center py-12 text-gray-400 text-sm italic">
                    Chưa có dữ liệu báo cáo
                </div>
            )}

            {/* Submitted State */}
            {report.status === 'submitted' && (
                <>
                    {/* Checklist Section */}
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
                            <span className="text-blue-500">📋</span> TIẾN ĐỘ CHECKLIST
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'fb', label: 'FB' },
                                { key: 'tiktok', label: 'Tiktok' },
                                { key: 'ig', label: 'IG' },
                                { key: 'youtube', label: 'Youtube' },
                                { key: 'captionHashtag', label: 'Caption & Hashtag' },
                                { key: 'reportLink', label: 'Báo cáo Link' },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded flex items-center justify-center ${report.checklist[item.key as keyof typeof report.checklist]
                                            ? 'bg-green-500'
                                            : 'bg-gray-200'
                                        }`}>
                                        {report.checklist[item.key as keyof typeof report.checklist] && (
                                            <Check className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-700">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Video Count Section */}
                    <div className="mb-6 bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-blue-600 mb-2 flex items-center gap-2">
                            <span className="text-blue-500">📹</span> SỐ VIDEO EDIT SỬ DỤNG &gt;50% SOURCE TỰ QUAY:
                            <span className="ml-auto text-blue-700">{report.videoCount}</span>
                        </h4>
                    </div>

                    {/* Questions Section */}
                    <div className="space-y-4">
                        {report.questions.map((q, index) => (
                            <div key={index} className="border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-600 mb-2 uppercase font-semibold">
                                    {index + 1}. {q.question}
                                </p>
                                <p className="text-sm text-gray-800 italic">
                                    {q.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportCard;
