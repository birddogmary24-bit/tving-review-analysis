import { NextResponse } from 'next/server';
import { seedInitialData } from '@/lib/seed';

export async function GET() {
    try {
        await seedInitialData();
        return NextResponse.json({ success: true, message: 'Initial data seeded successfully.' });
    } catch (error) {
        return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
    }
}
