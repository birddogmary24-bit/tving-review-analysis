import { NextResponse } from 'next/server';
import { fetchGooglePlayReviews, fetchAppStoreReviews } from '@/lib/scrapers';
import { categorizeReviewsBatch } from '@/lib/ai';
import { saveReviews, loadReviews, canUpdateToday, loadInsights, saveInsights } from '@/lib/storage';
import { MonthlyInsight } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    let password: string | null = null;
    try {
        const body = await request.json();
        password = body.password || null;
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const adminPassword = process.env.UPDATE_PASSWORD;
    if (!adminPassword) {
        console.error('[Batch] UPDATE_PASSWORD environment variable is not set');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (password !== adminPassword) {
        return NextResponse.json({
            success: false,
            error: 'UNAUTHORIZED',
            message: '올바른 비밀번호가 필요합니다.'
        }, { status: 401 });
    }

    /* Limit check removed as requested by user - password protection is now used.
    const { canUpdate } = await canUpdateToday();
    if (!canUpdate) {
        return NextResponse.json({
            success: false,
            error: 'ALREADY_UPDATED',
            message: '오늘은 이미 업데이트가 완료되었습니다.'
        }, { status: 429 });
    }
    */

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

        if (newReviewsOnly.length > 0) {
            // 4. Analyze ONLY the new reviews (Huge cost saving!)
            const analyzed = await categorizeReviewsBatch(newReviewsOnly);
            await saveReviews(analyzed);
            console.log(`[Batch] Analyzed ${analyzed.length} new reviews.`);
        } else {
            console.log('[Batch] No new reviews to analyze.');
        }

        // 5. Generate/Refresh insights for the current/previous month (Always do this to ensure data consistency)
        console.log('[Insight] Refreshing monthly insights...');
        const now = new Date();
        const monthToRefresh = now.getDate() < 5
            ? `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}` // Previous month
            : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // Current month

        const { generateMonthlyInsight } = await import('@/lib/insight-generator');
        const allReviewsAfterUpdate = await loadReviews();
        const insight = await generateMonthlyInsight(monthToRefresh, allReviewsAfterUpdate);

        // Only save if the insight has actual data (not a failed/empty result)
        const hasData = insight.positiveInsights.length > 0 || insight.negativeInsights.length > 0 || insight.tasks.length > 0;

        if (hasData) {
            const existingInsights = await loadInsights();
            const updatedInsights = [
                ...existingInsights.filter((i: MonthlyInsight) => i.month !== insight.month),
                insight
            ].sort((a, b) => b.month.localeCompare(a.month));

            await saveInsights(updatedInsights);
            console.log(`[Insight] Monthly insight for ${monthToRefresh} refreshed successfully.`);
        } else {
            console.warn(`[Insight] Insight for ${monthToRefresh} was empty (AI error?). Keeping existing data.`);
        }

        return NextResponse.json({
            success: true,
            total_fetched: allFetched.length,
            count: newReviewsOnly.length,
            message: newReviewsOnly.length > 0
                ? `${newReviewsOnly.length}개의 새로운 리뷰 분석 및 인사이트 갱신이 완료되었습니다.`
                : '새로운 리뷰는 없으나 최신 데이터를 바탕으로 인사이트를 갱신했습니다.'
        });
    } catch (error) {
        console.error('Batch processing failed:', error);
        return NextResponse.json({ error: 'Batch processing failed' }, { status: 500 });
    }
}
