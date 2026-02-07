'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardCheck } from 'lucide-react';

const checklistItems = [
    "Bạn đã đăng video lên FB chưa?",
    "Bạn đã đăng video lên Tiktok chưa?",
    "Bạn đã đăng video lên IG chưa?",
    "Bạn đã đăng video lên Youtube chưa?",
    "Bạn đã đăng video lên Zalovideo chưa?",
    "Bạn đã đăng video lên Twitter chưa?",
    "Bạn đã đăng video lên Threads chưa?",
    "Bạn đã đăng video lên Lemon8 chưa?",
    "Bạn đã check lại caption và hagtag video chưa?",
    "Bạn đã báo cáo đầy đủ thông tin công việc trên lark chưa?",
];

const ChecklistSection = () => {
    return (
        <Card className="h-full border-none shadow-none">
            <CardHeader className="pb-4">
                <CardTitle className="text-blue-600 flex items-center gap-2 text-lg uppercase font-bold">
                    <ClipboardCheck className="w-5 h-5" />
                    I. TIẾN ĐỘ CHECKLIST
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {checklistItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 group cursor-pointer">
                        <Checkbox id={`check-${index}`} className="mt-1 border-gray-300 w-6 h-6 rounded-md group-hover:border-blue-500 transition-colors" />
                        <label
                            htmlFor={`check-${index}`}
                            className="text-gray-700 font-medium leading-relaxed group-hover:text-blue-600 cursor-pointer transition-colors"
                        >
                            {item}
                        </label>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default ChecklistSection;
