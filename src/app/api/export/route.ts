import { NextResponse } from 'next/server';
import { loadReviews, getMonthlyStats } from '@/lib/storage';
import { generateExcelBuffer } from '@/lib/excel';

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
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (password !== adminPassword) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

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
