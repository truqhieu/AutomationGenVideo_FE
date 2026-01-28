'use client';

import { LayoutGrid, Construction } from 'lucide-react';

export default function FacebookChannelsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in-up">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <LayoutGrid className="w-12 h-12 text-blue-600" />
      </div>
      
      <h1 className="text-3xl font-bold text-slate-900 mb-3">
        Channel Overview
      </h1>
      
      <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm mb-6">
        <Construction className="w-4 h-4" />
        <span>Tính năng đang phát triển</span>
      </div>

      <p className="max-w-md text-slate-500 mb-8 leading-relaxed">
        Hệ thống quản lý kênh Facebook đang được xây dựng. 
        Vui lòng quay lại sau!
      </p>
    </div>
  );
}
