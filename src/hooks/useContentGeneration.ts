import { useState } from 'react';
import axios from 'axios';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

export interface GeneratedContent {
    id: number;
    title: string;
    script: string;
    hook: string;
    problem: string;
    solution: string;
    cta: string;
    word_count: number;
    content_type: string;
    content_type_display: string;
    created_at: string;
}

export interface GenerateContentRequest {
    video_id?: number; // Optional - only if video exists in DB
    video_description?: string; // Required if video_id not provided
    video_title?: string; // Optional
    content_type: string; // A1, A2, A3, A4, A5
    brand_name?: string;
    industry?: string;
    additional_context?: string;
    // Product info
    product_id?: string;
    product_name?: string;
    product_category?: string;
    product_description?: string;
    product_price?: string;
    // Advanced prompt
    custom_prompt?: string; // Custom prompt for advanced regeneration
}

export function useContentGeneration() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateContent = async (request: GenerateContentRequest): Promise<GeneratedContent | null> => {
        setIsGenerating(true);
        setError(null);

        try {
            const response = await axios.post<{
                success: boolean;
                content_id: number;
                title: string;
                script: string;
                hook: string;
                problem: string;
                solution: string;
                cta: string;
                word_count: number;
                content_type: string;
                created_at: string;
            }>(`${AI_SERVICE_URL}/api/content/generate/`, request);

            if (response.data.success) {
                // Map content_type to display name
                const contentTypeMap: Record<string, string> = {
                    'A1': 'Traffic (Viral)',
                    'A2': 'Knowledge (Giáo dục)',
                    'A3': 'Credibility (Uy tín)',
                    'A4': 'Conversion (Bán hàng)',
                    'A5': 'Combined (Tổng hợp)'
                };

                return {
                    id: response.data.content_id,
                    title: response.data.title,
                    script: response.data.script,
                    hook: response.data.hook,
                    problem: response.data.problem,
                    solution: response.data.solution,
                    cta: response.data.cta,
                    word_count: response.data.word_count,
                    content_type: response.data.content_type,
                    content_type_display: contentTypeMap[response.data.content_type] || response.data.content_type,
                    created_at: response.data.created_at
                };
            }

            throw new Error('Generation failed');
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to generate content';
            setError(errorMessage);
            console.error('Content generation error:', err);
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    const getGeneratedContents = async (videoId: number): Promise<GeneratedContent[]> => {
        try {
            const response = await axios.get<{
                success: boolean;
                contents: Array<{
                    id: number;
                    content_type: string;
                    content_type_display: string;
                    title: string;
                    script: string;
                    hook: string;
                    problem: string;
                    solution: string;
                    cta: string;
                    word_count: number;
                    is_approved: boolean;
                    created_at: string;
                }>;
            }>(`${AI_SERVICE_URL}/api/content/video/${videoId}/`);

            if (response.data.success) {
                return response.data.contents.map(c => ({
                    id: c.id,
                    title: c.title,
                    script: c.script,
                    hook: c.hook,
                    problem: c.problem,
                    solution: c.solution,
                    cta: c.cta,
                    word_count: c.word_count,
                    content_type: c.content_type,
                    content_type_display: c.content_type_display,
                    created_at: c.created_at
                }));
            }

            return [];
        } catch (err) {
            console.error('Failed to fetch generated contents:', err);
            return [];
        }
    };

    const generatePrompt = async (request: GenerateContentRequest): Promise<string | null> => {
        setIsGenerating(true);
        setError(null);
        try {
            const response = await axios.post<{
                success: boolean;
                prompt: string;
            }>(`${AI_SERVICE_URL}/api/content/generate-prompt/`, request);

            if (response.data.success) {
                return response.data.prompt;
            }
            throw new Error('Failed to generate prompt');
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to generate prompt';
            setError(errorMessage);
            console.error('Prompt generation error:', err);
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        generateContent,
        getGeneratedContents,
        generatePrompt,
        isGenerating,
        error
    };
}
