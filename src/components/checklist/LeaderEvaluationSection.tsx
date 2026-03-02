'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck } from 'lucide-react';

export const LEADER_QUESTIONS = [
    { question: "1. Bạn đã kiểm tra chất lượng nội dung video đầu ra của team mình chưa?", placeholder: "Ví dụ: Đã kiểm tra 100% video..." },
    { question: "2. Team bạn hôm qua có thành viên nào có video Win nhất?", placeholder: "Ví dụ: Bạn A có video 10k view..." },
    { question: "3. Team bạn hôm qua có gì đổi mới được áp dụng không?", placeholder: "Ví dụ: Áp dụng kỹ thuật hook mới..." },
    { question: "4. Team bạn có ai trễ Deadline hôm qua không? Lý do và phương án?", placeholder: "Ví dụ: Không có ai trễ..." },
    { question: "5. Team bạn hôm qua có sản phẩm nào win mới không? Đã thông tin lên Group New Product chưa?", placeholder: "Ví dụ: Có sản phẩm X và đã báo cáo..." },
];

interface LeaderEvaluationSectionProps {
    values: string[];
    onChange: (index: number, value: string) => void;
}

const LeaderEvaluationSection = ({ values, onChange }: LeaderEvaluationSectionProps) => {
    return (
        <Card className="h-full border-none shadow-none">
            <CardHeader className="pb-4">
                <CardTitle className="text-blue-700 flex items-center gap-2 text-lg uppercase font-bold">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    III. ĐÁNH GIÁ (DÀNH CHO LEADER)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
                {LEADER_QUESTIONS.map((item, index) => {
                    const isNo = values[index] === "Không ạ";

                    return (
                        <div key={index} className="space-y-3">
                            <label className="text-xs font-bold text-blue-700/70 uppercase tracking-tight block">
                                {item.question}
                            </label>

                            <div className="flex bg-blue-50/50 p-1 rounded-xl w-fit">
                                <button
                                    type="button"
                                    onClick={() => onChange(index, "Không ạ")}
                                    className={`px-6 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${isNo ? "bg-white shadow-sm text-blue-600" : "text-blue-400 hover:text-blue-600"}`}
                                >
                                    Không ạ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { if (isNo || !values[index]) onChange(index, "") }}
                                    className={`px-6 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${!isNo && values[index] !== undefined ? "bg-white shadow-sm text-blue-600" : "text-blue-400 hover:text-blue-600"}`}
                                >
                                    Có
                                </button>
                            </div>

                            {!isNo && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Textarea
                                        value={isNo ? "" : (values[index] ?? '')}
                                        onChange={(e) => onChange(index, e.target.value)}
                                        placeholder={item.placeholder}
                                        className="min-h-[100px] border-blue-100 focus:border-blue-400 focus:ring-blue-400/20 bg-blue-50/10 text-sm text-gray-900 resize-none rounded-2xl"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default LeaderEvaluationSection;
