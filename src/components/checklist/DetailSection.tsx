'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

const detailItems = [
    {
        question: "SỐ VIDEO EDIT SỬ DỤNG >50% SOURCE TỰ QUAY?",
        placeholder: "Ví dụ..."
    },
    {
        question: "1. NGÀY HÔM QUA CÔNG VIỆC BẠN CÓ CÁI GÌ KHIẾN BẠN TỰ HÀO VÀ THÍCH THÚ NHẤT?",
        placeholder: "Ví dụ..."
    },
    {
        question: "2. HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỢC ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?",
        placeholder: "Ví dụ..."
    },
    {
        question: "3. BẠN CÓ GẶP KHÓ KHĂN NÀO CẦN HỖ TRỢ KHÔNG?",
        placeholder: "Ví dụ..."
    },
    {
        question: "4. BẠN CÓ ĐÓNG GÓP Ý TƯỞNG HAY ĐỀ XUẤT GÌ KHÔNG?",
        placeholder: "Ví dụ..."
    },
    {
        question: "5. BẠN CÓ SẢN PHẨM (A4 - A5) NÀO WIN MỚI KHÔNG? (>5K VIEW - >10 CMT HỎI GIÁ?)",
        placeholder: "Ví dụ..."
    }
];

const DetailSection = () => {
    return (
        <Card className="h-full border-none shadow-none">
            <CardHeader className="pb-4">
                <CardTitle className="text-[#334155] flex items-center gap-2 text-lg uppercase font-bold">
                    <FileText className="w-5 h-5 text-gray-500" />
                    II. CHI TIẾT
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {detailItems.map((item, index) => (
                    <div key={index} className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                            {item.question}
                        </label>
                        <Textarea
                            placeholder={item.placeholder}
                            className="min-h-[100px] border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 bg-gray-50/30 text-sm resize-none"
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default DetailSection;
