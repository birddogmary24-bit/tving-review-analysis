import { NextResponse } from 'next/server';
import { generateMonthlyInsight } from '@/lib/insight-generator';
import { loadReviews, loadInsights, saveInsights } from '@/lib/storage';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    const targetMonth = searchParams.get('month'); // YYYY-MM

    // Use environment variable for password protection instead of hardcoding
    const adminPassword = process.env.UPDATE_PASSWORD || 'tving2026';

    if (password !== adminPassword) {
        return NextResponse.json({
            success: false,
            error: 'UNAUTHORIZED',
            message: '올바른 비밀번호가 필요합니다.'
        }, { status: 401 });
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
