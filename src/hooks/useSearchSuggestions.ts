import { useState, useCallback, useRef, useEffect } from 'react';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

export interface SearchSuggestion {
    text: string;
    type: 'history' | 'trending' | 'ai';
    count?: number;
    score?: number;
}

export interface UseSuggestionsOptions {
    platform: string;
    debounceMs?: number;
    minQueryLength?: number;
    maxResults?: number;
}

export function useSearchSuggestions(options: UseSuggestionsOptions) {
    const {
        platform,
        debounceMs = 200, // Google API cần debounce nhẹ để tránh spam
        minQueryLength = 1,
        maxResults = 10
    } = options;

    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    // Cache: Lưu trữ kết quả đã fetch để tăng tốc { query: suggestions[] }
    const cache = useRef<Record<string, SearchSuggestion[]>>({});

    const abortController = useRef<AbortController | null>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const fetchSuggestions = useCallback(async (query: string) => {
        const normalizedQuery = query.trim().toLowerCase();

        // 1. Check Cache (Instant Response)
        if (cache.current[normalizedQuery]) {
            setSuggestions(cache.current[normalizedQuery]);
            setLoading(false);
            return;
        }

        if (!query || query.length < minQueryLength) {
            setSuggestions([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Cancel previous request if any
        if (abortController.current) {
            abortController.current.abort();
        }
        abortController.current = new AbortController();

        try {
            // 2. Fetch Google Suggest API (Via Proxy)
            // Đây là nguồn dữ liệu thông minh nhất thế giới hiện nay
            const response = await fetch(
                `/api/proxy-suggest?q=${encodeURIComponent(query)}`,
                { signal: abortController.current.signal }
            );

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            const rawSuggestions: string[] = data.suggestions || [];

            // 3. Format & Limit Results
            const formattedSuggestions: SearchSuggestion[] = rawSuggestions
                .slice(0, maxResults)
                .map(text => ({
                    text: text,
                    type: 'ai' // Google Suggest is AI/Trend based
                }));

            if (formattedSuggestions.length > 0) {
                setSuggestions(formattedSuggestions);
                cache.current[normalizedQuery] = formattedSuggestions; // Cache lại
            } else {
                setSuggestions([]);
            }

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Google Suggest Error:', err);
                // Giữ nguyên suggestions cũ nếu lỗi mạng, hoặc clear nếu cần
            }
        } finally {
            if (abortController.current?.signal.aborted) return;
            setLoading(false);
        }
    }, [platform, minQueryLength, maxResults]);

    const debouncedFetch = useCallback((query: string) => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            fetchSuggestions(query);
        }, debounceMs);
    }, [fetchSuggestions, debounceMs]);

    const trackSearch = useCallback(async (query: string, resultCount?: number) => {
        try {
            await fetch(`${AI_SERVICE_URL}/api/search/track/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    platform,
                    result_count: resultCount
                })
            });
        } catch (err) {
            console.error('Track error:', err);
        }
    }, [platform]);

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
        setLoading(false);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            if (abortController.current) abortController.current.abort();
        };
    }, []);

    return {
        suggestions,
        loading,
        error: null,
        fetchSuggestions: debouncedFetch,
        trackSearch,
        clearSuggestions
    };
}
