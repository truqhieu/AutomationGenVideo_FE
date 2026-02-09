'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateContentButtonProps {
    videoId: number;
    videoTitle: string;
    className?: string;
    compact?: boolean; // Show shorter text for compact layouts
}

export default function GenerateContentButton({
    videoId,
    videoTitle,
    className = '',
    compact = false
}: GenerateContentButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        // Validate inputs before navigation
        if (!videoId || !videoTitle) {
            console.error('Invalid video data:', { videoId, videoTitle });
            return;
        }

        // Navigate to product selection page with video info
        const params = new URLSearchParams({
            videoId: videoId.toString(),
            videoTitle: encodeURIComponent(videoTitle)
        });
        router.push(`/dashboard/content/product-selection?${params.toString()}`);
    };

    // Disable button if invalid data
    const isDisabled = !videoId || !videoTitle;

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
