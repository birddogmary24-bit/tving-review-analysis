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

    // Check if update is allowed today
    const { canUpdate } = await canUpdateToday();
    if (!canUpdate) {
        return NextResponse.json({
            success: false,
            error: 'ALREADY_UPDATED',
            message: '오늘은 이미 업데이트가 완료되었습니다. 내일 다시 시도해주세요.'
        }, { status: 429 });
    }

    try {
        const [gpReviews, asReviews] = await Promise.all([
            fetchGooglePlayReviews('net.cj.cjhv.gs.tving', 5),
            fetchAppStoreReviews('400101401', 5)
        ]);

        const allReviews = [...gpReviews, ...asReviews];
        const analyzed = await categorizeReviewsBatch(allReviews);
        await saveReviews(analyzed);

        return NextResponse.json({
            success: true,
            count: analyzed.length,
            message: 'Batch processing completed successfully'
        });
    } catch (error) {
        console.error('Batch processing failed:', error);
        return NextResponse.json({ error: 'Batch processing failed' }, { status: 500 });
    }
}
