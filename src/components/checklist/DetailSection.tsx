'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

export const DETAIL_ITEMS = [
    { question: "Số video edit sử dụng >50% source tự quay?", placeholder: "Ví dụ: 3 video..." },
    { question: "1. Ngày hôm qua công việc bạn có cái gì khiến bạn tự hào và thích thú nhất?", placeholder: "Mô tả ngắn gọn..." },
    { question: "2. Hôm qua có đổi mới sáng tạo gì được áp dụng vào công việc của bạn không?", placeholder: "Mô tả ngắn gọn..." },
    { question: "3. Bạn có gặp khó khăn nào cần hỗ trợ không?", placeholder: "Mô tả ngắn gọn..." },
    { question: "4. Bạn có đóng góp ý tưởng hay đề xuất gì không?", placeholder: "Mô tả ngắn gọn..." },
    { question: "5. Bạn có sản phẩm (A4 - A5) nào win mới không? (>5k view - >10 cmt hỏi giá?)", placeholder: "Ghi rõ tên sản phẩm và link (nếu có)..." },
];

interface DetailSectionProps {
    values: string[];
    onChange: (index: number, value: string) => void;
}

const DetailSection = ({ values, onChange }: DetailSectionProps) => {
    return (
        <Card className="h-full border-none shadow-none">
            <CardHeader className="pb-4">
                <CardTitle className="text-[#334155] flex items-center gap-2 text-lg uppercase font-bold">
                    <FileText className="w-5 h-5 text-gray-500" />
                    II. CHI TIẾT
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
                {DETAIL_ITEMS.map((item, index) => {
                    const isNo = values[index] === "Không ạ";
                    const hasValue = values[index] && values[index] !== "Không ạ";

                    return (
                        <div key={index} className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tight block">
                                {item.question}
                            </label>

                            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                                <button
                                    type="button"
                                    onClick={() => onChange(index, "Không ạ")}
                                    className={`px-6 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${isNo ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    Không ạ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { if (isNo || !values[index]) onChange(index, "") }}
                                    className={`px-6 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${!isNo && values[index] !== undefined ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
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
                                        className="min-h-[100px] border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 bg-gray-50/30 text-sm text-gray-900 resize-none rounded-2xl"
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

export default DetailSection;
