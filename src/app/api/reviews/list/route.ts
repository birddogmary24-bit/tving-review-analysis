import { NextResponse } from 'next/server';
import { loadReviews } from '@/lib/storage';
import { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 30));
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');
    const score = searchParams.get('score') ? Number(searchParams.get('score')) : null;
    const months = searchParams.get('months')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search')?.toLowerCase() || '';

    try {
        const allReviews = await loadReviews();

        const filtered = allReviews.filter(r => {
            if (category && r.category !== category) return false;
            if (subCategory && r.subCategory !== subCategory) return false;
            if (score && r.score !== score) return false;
            if (months.length > 0 && !months.includes(r.date.substring(0, 7))) return false;
            if (search && !r.text.toLowerCase().includes(search) && !r.userName.toLowerCase().includes(search)) return false;
            return true;
        });

        const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date));
        const total = sorted.length;
        const totalPages = Math.ceil(total / limit);
        const start = (page - 1) * limit;
        const reviews = sorted.slice(start, start + limit);

        // Collect available filters from all data
        const availableMonths = Array.from(new Set(allReviews.map(r => r.date.substring(0, 7)))).sort((a, b) => b.localeCompare(a));
        const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        allReviews.forEach(r => {
            if (starCounts[r.score as keyof typeof starCounts] !== undefined) {
                starCounts[r.score as keyof typeof starCounts]++;
            }
        });

        return NextResponse.json({
            reviews,
            total,
            page,
            totalPages,
            totalAll: allReviews.length,
            availableMonths,
            starCounts,
        });
    } catch (error) {
        console.error('[API] Error loading reviews:', error);
        return NextResponse.json({
            reviews: [],
            total: 0,
            page: 1,
            totalPages: 0,
            totalAll: 0,
            availableMonths: [],
            starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            error: 'Failed to load reviews',
        });
    }
}
