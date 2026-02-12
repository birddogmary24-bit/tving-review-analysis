import { NextRequest, NextResponse } from 'next/server';
import { loadReviews } from '@/lib/storage';
import { getAppByIdOrThrow } from '@/lib/apps';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  getAppByIdOrThrow(appId); // validate

  const reviews = await loadReviews(appId);

  // Query params for filtering
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const subCategory = searchParams.get('subCategory');
  const minScore = searchParams.get('minScore');
  const maxScore = searchParams.get('maxScore');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '30');

  let filtered = reviews;

  if (category) filtered = filtered.filter(r => r.category === category);
  if (subCategory) filtered = filtered.filter(r => r.subCategory === subCategory);
  if (minScore) filtered = filtered.filter(r => r.score >= parseInt(minScore));
  if (maxScore) filtered = filtered.filter(r => r.score <= parseInt(maxScore));
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(r => r.text.toLowerCase().includes(q));
  }

  // Sort by date desc
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ reviews: paginated, total, page, limit });
}
