import { NextResponse } from 'next/server';
import { loadReviews, getMonthlyStats } from '@/lib/storage';
import { generateExcelBuffer } from '@/lib/excel';

export async function GET() {
    try {
        const reviews = await loadReviews();
        const stats = await getMonthlyStats();

        const buffer = generateExcelBuffer(reviews, stats);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=tving_reviews_analysis.xlsx',
            },
        });
    } catch (error) {
        console.error('Export failed:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
