'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateContentButtonProps {
    videoId: number | string;   // DB integer id hoặc fallback string (video_id)
    videoTitle: string;
    className?: string;
    compact?: boolean;
}

export default function GenerateContentButton({
    videoId,
    videoTitle,
    className = '',
    compact = false
}: GenerateContentButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        if (!videoTitle) {
            console.error('Invalid video data: missing title', { videoId, videoTitle });
            return;
        }

        // Navigate to product selection page with video info
        const params = new URLSearchParams({
            videoId: videoId?.toString() ?? '0',
            videoTitle: encodeURIComponent(videoTitle)
        });
        router.push(`/dashboard/content/product-selection?${params.toString()}`);
    };

    // Chỉ disable nếu không có title (id = 0 vẫn hợp lệ)
    const isDisabled = !videoTitle;

    return (
        <button
            onClick={handleClick}
            disabled={isDisabled}
            className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded-lg
        bg-gradient-to-r from-purple-600 to-pink-600
        hover:from-purple-700 hover:to-pink-700
        text-white font-semibold text-sm
        transition-all duration-200
        shadow-lg hover:shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
        >
            <Sparkles className="w-4 h-4" />
            {compact ? 'AI' : 'Generate Content'}
        </button>
    );
}
