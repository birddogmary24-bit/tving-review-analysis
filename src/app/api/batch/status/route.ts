import { NextResponse } from 'next/server';
import { canUpdateToday } from '@/lib/storage';

export async function GET() {
    const status = await canUpdateToday();
    return NextResponse.json(status);
}
