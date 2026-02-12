import { NextResponse } from 'next/server';
import { getMonthlyStats } from '@/lib/storage';
import { getAppByIdOrThrow } from '@/lib/apps';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  getAppByIdOrThrow(appId);
  const stats = await getMonthlyStats(appId);
  return NextResponse.json(stats);
}
