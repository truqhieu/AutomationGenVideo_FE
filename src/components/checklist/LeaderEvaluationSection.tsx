'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck } from 'lucide-react';

export const LEADER_QUESTIONS = [
    { question: "1. BẠN ĐÃ KIỂM TRA CHẤT LƯỢNG NỘI DUNG VIDEO ĐẦU RA CỦA TEAM MÌNH CHƯA?", placeholder: "Ví dụ..." },
    { question: "2. TEAM BẠN HÔM QUA CÓ THÀNH VIÊN NÀO CÓ VIDEO WIN NHẤT?", placeholder: "Ví dụ..." },
    { question: "3. TEAM BẠN HÔM QUA CÓ GÌ ĐỔI MỚI ĐƯỢC ÁP DỤNG KHÔNG?", placeholder: "Ví dụ..." },
    { question: "4. TEAM BẠN CÓ AI TRỄ DEADLINE HÔM QUA KHÔNG? LÝ DO VÀ PHƯƠNG ÁN?", placeholder: "Ví dụ..." },
    { question: "5. TEAM BẠN HÔM QUA CÓ SẢN PHẨM NÀO WIN MỚI KHÔNG? ĐÃ THÔNG TIN LÊN GROUP NEW PRODUCT CHƯA?", placeholder: "Ví dụ..." },
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
