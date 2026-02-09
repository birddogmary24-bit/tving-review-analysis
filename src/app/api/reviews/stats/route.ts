import { NextResponse } from 'next/server';
import { loadReviews } from '@/lib/storage';
import { MonthlyStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const subCategory = searchParams.get('subCategory') || '전체';

    try {
        const allReviews = await loadReviews();
        const statsMap: Record<string, MonthlyStats> = {};

        const filtered = subCategory !== '전체'
            ? allReviews.filter(r => r.subCategory === subCategory)
            : allReviews;

        filtered.forEach(r => {
            const month = r.date.substring(0, 7);
            if (!statsMap[month]) {
                statsMap[month] = { month, complaints: 0, compliments: 0, others: 0, total: 0 };
            }
            statsMap[month].total++;
            if (r.score >= 3) statsMap[month].compliments++;
            else statsMap[month].complaints++;
        });

        const stats = Object.values(statsMap).sort((a, b) => b.month.localeCompare(a.month));
        const subCategories = Array.from(new Set(allReviews.map(r => r.subCategory))).filter(Boolean).sort();

        return NextResponse.json({ stats, subCategories });
    } catch (error) {
        console.error('[API] Error loading stats:', error);
        return NextResponse.json({ stats: [], subCategories: [], error: 'Failed to load stats' });
    }
}
