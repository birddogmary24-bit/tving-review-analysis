import { NextResponse } from 'next/server';
import { fetchGooglePlayReviews, fetchAppStoreReviews } from '@/lib/scrapers';
import { categorizeReviewsBatch } from '@/lib/ai';
import { saveReviews, canUpdateToday } from '@/lib/storage';

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
        // Fetch substantially more reviews to reach the target volume
        const [gpReviews, asReviews] = await Promise.all([
            fetchGooglePlayReviews('net.cj.cjhv.gs.tving', 30), // Increased to 30 pages (~3000 reviews)
            fetchAppStoreReviews('400101401', 10)         // App Store max pages (up to ~500 reviews)
        ]);

        const allReviews = [...gpReviews, ...asReviews];

        // Split into chunks to avoid hitting AI rate limits or timeout during massive batch
        const analyzed = await categorizeReviewsBatch(allReviews);
        await saveReviews(analyzed);

        return NextResponse.json({
            success: true,
            total_fetched: allReviews.length,
            count: analyzed.length,
            message: 'Batch processing completed with full volume'
        });
    } catch (error) {
        console.error('Batch processing failed:', error);
        return NextResponse.json({ error: 'Batch processing failed' }, { status: 500 });
    }
}
