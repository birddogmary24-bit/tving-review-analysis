import { NextResponse } from 'next/server';
import { OTT_APPS } from '@/lib/apps';
import { getLastUpdateTimestamp } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const appsWithStatus = await Promise.all(
    OTT_APPS.map(async (app) => {
      const lastUpdate = await getLastUpdateTimestamp(app.id);
      return { ...app, lastUpdate };
    })
  );

  return NextResponse.json(appsWithStatus);
}
