import { NextResponse } from 'next/server';

/**
 * Real-time Search Suggestion Proxy
 * Calls AI service → YouTube Suggest → Google Suggest
 * Returns suggestions for the EXACT query typed (no artificial suffixes).
 */

const AI_SERVICE_URL =
    process.env.AI_SERVICE_URL ||
    process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
    'http://localhost:8001';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const count = Math.min(Number(searchParams.get('count') || 8), 20);

    if (!query) {
        return NextResponse.json({ suggestions: [], source: 'none' });
    }

    // ── Primary: AI Service (YouTube Suggest via Django, cached) ─────────────
    try {
        const url = `${AI_SERVICE_URL}/api/tiktok/suggest/?q=${encodeURIComponent(query)}&count=${count}`;
        const res = await fetch(url, {
            signal: AbortSignal.timeout(3000),
            headers: { Accept: 'application/json' },
        });

        if (res.ok) {
            const data = await res.json();
            const suggestions: string[] = data.suggestions || [];
            if (suggestions.length > 0) {
                return NextResponse.json({ suggestions, source: data.source || 'youtube' });
            }
        }
    } catch (err: any) {
        // Fall through to direct YouTube
    }

    // ── Fallback: Direct YouTube Suggest ─────────────────────────────────────
    try {
        const ytUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}&hl=vi&gl=vn&oe=utf-8`;
        const res = await fetch(ytUrl, {
            signal: AbortSignal.timeout(2000),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'vi-VN,vi;q=0.9',
            },
        });

        if (res.ok) {
            const data = JSON.parse(await res.text());
            const suggestions: string[] = (data[1] || []).slice(0, count);
            if (suggestions.length > 0) {
                return NextResponse.json({ suggestions, source: 'youtube' });
            }
        }
    } catch { /* ignore */ }

    return NextResponse.json({ suggestions: [], source: 'none' });
}
