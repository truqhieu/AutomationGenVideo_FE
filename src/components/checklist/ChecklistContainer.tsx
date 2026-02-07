'use client';

import React from 'react';
import ChecklistSection from './ChecklistSection';
import DetailSection from './DetailSection';
import { Send } from 'lucide-react';

const ChecklistContainer = () => {
    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-pink-100/50">
                    <ChecklistSection />
                </div>
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-blue-100/50">
                    <DetailSection />
                </div>
            </div>

            <div className="flex justify-center pt-8 border-t border-gray-100">
                <button className="flex items-center gap-2 bg-[#dbeafe] text-blue-600 px-8 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-blue-200 transition-all shadow-sm">
                    <Send className="w-4 h-4" />
                    GỬI BÁO CÁO (MUỘN)
                </button>
            </div>
        </div>
    );
};

export default ChecklistContainer;
