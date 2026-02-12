import { OTT_APPS } from '@/lib/apps';
import { loadReviews, getMonthlyStats } from '@/lib/storage';
import { CompareClient } from '@/components/compare/compare-client';
import { AppComparisonData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ComparePage() {
  const comparisons: AppComparisonData[] = await Promise.all(
    OTT_APPS.map(async (app) => {
      const reviews = await loadReviews(app.id);
      const stats = await getMonthlyStats(app.id);

      const total = reviews.length;
      const avgScore = total > 0
        ? Math.round((reviews.reduce((s, r) => s + r.score, 0) / total) * 100) / 100
        : 0;
      const positive = reviews.filter(r => r.score >= 3).length;
      const negative = reviews.filter(r => r.score < 3).length;

      const complaintCounts: Record<string, number> = {};
      const complimentCounts: Record<string, number> = {};
      const categoryBreakdown: Record<string, number> = {};
      reviews.forEach(r => {
        categoryBreakdown[r.subCategory] = (categoryBreakdown[r.subCategory] || 0) + 1;
        if (r.score < 3) {
          complaintCounts[r.subCategory] = (complaintCounts[r.subCategory] || 0) + 1;
        } else {
          complimentCounts[r.subCategory] = (complimentCounts[r.subCategory] || 0) + 1;
        }
      });

      return {
        appId: app.id,
        appName: app.name,
        totalReviews: total,
        avgScore,
        positiveRatio: total > 0 ? Math.round((positive / total) * 100) : 0,
        negativeRatio: total > 0 ? Math.round((negative / total) * 100) : 0,
        monthlyStats: stats,
        topComplaints: Object.entries(complaintCounts)
          .map(([subCategory, count]) => ({ subCategory, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        topCompliments: Object.entries(complimentCounts)
          .map(([subCategory, count]) => ({ subCategory, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        categoryBreakdown,
      };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">OTT 비교 분석</h1>
        <p className="text-muted-foreground text-sm mt-1">
          국내 주요 OTT 서비스의 사용자 리뷰를 비교합니다.
        </p>
      </div>

      <CompareClient comparisons={comparisons} apps={OTT_APPS} />
    </div>
  );
}
