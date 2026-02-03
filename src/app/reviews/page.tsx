import Layout from '@/components/layout';
import { loadReviews } from '@/lib/storage';
import { ReviewList } from '@/components/review-list';

export default async function ReviewsPage() {
    const allReviews = await loadReviews();
    const sortedReviews = allReviews.sort((a, b) => b.date.localeCompare(a.date));

    return (
        <Layout>
            <div className="space-y-6">
                <section className="space-y-2">
                    <h1 className="text-3xl font-bold">전체 리뷰 목록</h1>
                    <p className="text-muted-foreground">수집된 모든 리뷰를 확인하고 필터링할 수 있습니다.</p>
                </section>

                <ReviewList initialReviews={sortedReviews} />
            </div>
        </Layout>
    );
}
