import { NextResponse } from 'next/server';
import { generateMonthlyInsight } from '@/lib/insight-generator';
import { loadReviews, loadInsights, saveInsights } from '@/lib/storage';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const targetMonth = searchParams.get('month'); // YYYY-MM

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const allReviews = await loadReviews();

        let monthToAnalyze = targetMonth;
        if (!monthToAnalyze) {
            // Default to previous month
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            monthToAnalyze = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
        }

        const insight = await generateMonthlyInsight(monthToAnalyze, allReviews);

        const existingInsights = await loadInsights();
        const updatedInsights = [
            ...existingInsights.filter(i => i.month !== insight.month),
            insight
        ].sort((a, b) => b.month.localeCompare(a.month));

        await saveInsights(updatedInsights);

        return NextResponse.json({
            success: true,
            month: insight.month,
            insight
        });
    } catch (error) {
        console.error('Insight generation failed:', error);
        return NextResponse.json({ error: 'Insight generation failed' }, { status: 500 });
    }
}
