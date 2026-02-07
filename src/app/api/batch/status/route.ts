import { NextResponse } from 'next/server';
import { canUpdateToday } from '@/lib/storage';

export async function GET() {
    return NextResponse.json({ canUpdate: true });
}
