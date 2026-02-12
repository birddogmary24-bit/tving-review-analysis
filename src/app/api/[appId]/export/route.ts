import { NextResponse } from 'next/server';
import { loadReviews, getMonthlyStats } from '@/lib/storage';
import { getAppByIdOrThrow } from '@/lib/apps';
import { generateExcelBuffer } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  const app = getAppByIdOrThrow(appId);

  const [reviews, stats] = await Promise.all([
    loadReviews(appId),
    getMonthlyStats(appId),
  ]);

  const buffer = generateExcelBuffer(reviews, stats, app.name);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${app.name}_reviews_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
