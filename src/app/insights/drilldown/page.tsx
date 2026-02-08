import Layout from '@/components/layout';
import { loadReviews } from '@/lib/storage';
import { ArrowLeft, MessageSquare, Star, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface DrilldownPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InsightDrilldownPage(props: DrilldownPageProps) {
    const searchParams = await props.searchParams;
    const month = searchParams.month as string;
    const title = searchParams.title as string;
    const categories = (searchParams.categories as string)?.split(',') || [];

    const allReviews = await loadReviews();

    // Calculate 6 months range for the target month
    const targetDate = new Date(month + "-01");
    const sixMonthsAgo = new Date(targetDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const formatMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const sixMonthsRange: string[] = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(sixMonthsAgo);
        d.setMonth(d.getMonth() + i);
        sixMonthsRange.push(formatMonth(d));
    }

    // Filter reviews by 6 months range and categories
    const filteredReviews = allReviews.filter(r => {
        const rMonth = r.date.substring(0, 7);
        const matchesMonth = sixMonthsRange.includes(rMonth); // Changed to 6 months
        const matchesCategory = categories.length === 0 || (r.subCategory && categories.includes(r.subCategory));
        return matchesMonth && matchesCategory;
    }).sort((a, b) => b.date.localeCompare(a.date));

    return (
        <Layout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <Link href="/insights" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-bold">
                        <ArrowLeft className="w-4 h-4" /> 인사이트 리포트로 돌아가기
                    </Link>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                            <Tag className="w-3 h-3" /> Related Reviews for {month}
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">{title}</h1>
                        <p className="text-muted-foreground text-lg italic">
                            "{categories.join(', ')}" 카테고리와 연관된 실제 리뷰 리스트입니다.
                        </p>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-secondary/20 border border-border/50 p-6 rounded-3xl">
                        <div className="text-xs font-black uppercase text-muted-foreground mb-2">Total Relevant</div>
                        <div className="text-3xl font-black">{filteredReviews.length} 건</div>
                    </div>
                    <div className="bg-secondary/20 border border-border/50 p-6 rounded-3xl">
                        <div className="text-xs font-black uppercase text-green-400 mb-2">Positive Reviews</div>
                        <div className="text-3xl font-black text-green-400">
                            {filteredReviews.filter(r => r.score >= 3).length} 건
                        </div>
                    </div>
                    <div className="bg-secondary/20 border border-border/50 p-6 rounded-3xl">
                        <div className="text-xs font-black uppercase text-primary mb-2">Negative Reviews</div>
                        <div className="text-3xl font-black text-primary">
                            {filteredReviews.filter(r => r.score < 3).length} 건
                        </div>
                    </div>
                </div>

                {/* Review List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" /> 리뷰 내용 상세
                    </h2>
                    {filteredReviews.length === 0 ? (
                        <div className="p-20 text-center border border-dashed border-border rounded-3xl bg-secondary/10">
                            <p className="text-muted-foreground italic">관련된 리뷰를 찾을 수 없습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredReviews.map((review, idx) => (
                                <div key={idx} className="bg-card border border-border/60 p-6 rounded-2xl hover:bg-secondary/10 transition-colors space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${i < review.score ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                                            <Calendar className="w-3 h-3" /> {review.date}
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed">{review.text}</p>
                                    <div className="flex items-center gap-2 pt-2">
                                        <span className="text-[10px] font-black uppercase bg-secondary px-2 py-0.5 rounded text-muted-foreground tracking-tight">
                                            {review.category}
                                        </span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-tight ${review.category === '불만' ? 'bg-primary/10 text-primary' :
                                            review.category === '칭찬' ? 'bg-green-500/10 text-green-400' :
                                                'bg-blue-500/10 text-blue-400'
                                            }`}>
                                            {review.subCategory || '미분류'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
