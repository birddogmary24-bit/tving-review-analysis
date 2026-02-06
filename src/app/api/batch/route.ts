import { NextResponse } from 'next/server';
import { fetchGooglePlayReviews, fetchAppStoreReviews } from '@/lib/scrapers';
import { categorizeReviewsBatch } from '@/lib/ai';
import { saveReviews, loadReviews, canUpdateToday } from '@/lib/storage';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { canUpdate } = await canUpdateToday();
    if (!canUpdate) {
        return NextResponse.json({
            success: false,
            error: 'ALREADY_UPDATED',
            message: '오늘은 이미 업데이트가 완료되었습니다.'
        }, { status: 429 });
    }

    try {
        // 1. Fetch existing reviews to skip duplicates
        const existingReviews = await loadReviews();
        const existingIds = new Set(existingReviews.map(r => `${r.store}-${r.id}`));

        // 2. Fetch new reviews from stores
        const [gpReviews, asReviews] = await Promise.all([
            fetchGooglePlayReviews('net.cj.cjhv.gs.tving', 15), // ~1500 reviews
            fetchAppStoreReviews('400101401', 5)          // ~250 reviews
        ]);

        const allFetched = [...gpReviews, ...asReviews];

        // 3. Filter only NEW reviews that haven't been analyzed yet
        const newReviewsOnly = allFetched.filter(r => !existingIds.has(`${r.store}-${r.id}`));

        if (newReviewsOnly.length === 0) {
            return NextResponse.json({
                success: true,
                total_fetched: allFetched.length,
                count: 0,
                message: '새로운 리뷰가 없어 분석을 건너뛰었습니다.'
            });
        }

        // 4. Analyze ONLY the new reviews (Huge cost saving!)
        const analyzed = await categorizeReviewsBatch(newReviewsOnly);
        await saveReviews(analyzed);

        return NextResponse.json({
            success: true,
            total_fetched: allFetched.length,
            count: analyzed.length,
            message: `${analyzed.length}개의 새로운 리뷰 분석이 완료되었습니다.`
        });
    } catch (error) {
        console.error('Batch processing failed:', error);
        return NextResponse.json({ error: 'Batch processing failed' }, { status: 500 });
    }
}
