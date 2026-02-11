import { NextResponse } from 'next/server';
import { seedInitialData } from '@/lib/seed';

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
        await seedInitialData();
        return NextResponse.json({ success: true, message: 'Initial data seeded successfully.' });
    } catch (error) {
        return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
    }
}
