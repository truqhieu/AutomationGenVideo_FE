'use client';
import { useEffect } from 'react';

export default function SocialCallbackPage() {
  useEffect(() => {
    if (window.opener) {
      window.close();
    } else {
      window.location.href = '/dashboard/social/channels';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Đang hoàn tất kết nối...</p>
      </div>
    </div>
  );
}
