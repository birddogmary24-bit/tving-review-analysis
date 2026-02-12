import { getAppByIdOrThrow, OTT_APPS, SUB_CATEGORIES } from '@/lib/apps';
import { loadReviews } from '@/lib/storage';
import { ReviewListClient } from '@/components/reviews/review-list';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return OTT_APPS.map(app => ({ appId: app.id }));
}

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = getAppByIdOrThrow(appId);
  const reviews = await loadReviews(appId);

  const allSubCategories = [
    ...SUB_CATEGORIES['불만'],
    ...SUB_CATEGORIES['칭찬'],
    ...SUB_CATEGORIES['기타'],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: app.color }} />
        <h1 className="text-2xl font-bold">{app.name} - 전체 리뷰</h1>
        <span className="text-sm text-muted-foreground">({reviews.length.toLocaleString()}건)</span>
      </div>

      <ReviewListClient
        reviews={reviews}
        appId={appId}
        subCategories={allSubCategories}
      />
    </div>
  );
}
