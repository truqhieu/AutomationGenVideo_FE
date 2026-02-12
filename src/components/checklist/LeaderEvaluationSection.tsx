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
                <CardTitle className="text-[#c2410c] flex items-center gap-2 text-lg uppercase font-bold">
                    <ShieldCheck className="w-5 h-5 text-orange-600" />
                    III. ĐÁNH GIÁ (DÀNH CHO LEADER)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {LEADER_QUESTIONS.map((item, index) => (
                    <div key={index} className="space-y-2">
                        <label className="text-xs font-bold text-orange-700/70 uppercase tracking-tight">
                            {item.question}
                        </label>
                        <Textarea
                            value={values[index] ?? ''}
                            onChange={(e) => onChange(index, e.target.value)}
                            placeholder={item.placeholder}
                            className="min-h-[100px] border-orange-100 focus:border-orange-400 focus:ring-orange-400/20 bg-orange-50/10 text-sm text-gray-900 resize-none"
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default LeaderEvaluationSection;
