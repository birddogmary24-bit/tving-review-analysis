import Link from 'next/link';
import Layout from '@/components/layout';
import { loadInsights, loadReviews } from '@/lib/storage';
import { Lightbulb, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Calendar, Sparkles, BarChart2, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
    const insights = await loadInsights();

    // Sort by month descending
    const sortedInsights = [...insights].sort((a, b) => b.month.localeCompare(a.month));
    const latestInsight = sortedInsights[0];

    const allReviews = await loadReviews();

    /**
     * 카운트 산정 기준 (Standard for Review Count):
     * 특정 인사이트와 연관된 '실제 리뷰'의 개수를 보여주기 위해 
     * AI가 분석한 '관련 서브 카테고리(relatedSubCategories)'와 '해당 월'이 일치하는 
     * 원본 리뷰 데이터의 개수를 실시간으로 집계하여 노출합니다.
     */
    const getCalculatedCount = (month: string, relatedCategories: string[]) => {
        return allReviews.filter(r => {
            const rMonth = r.date.substring(0, 7);
            const matchesMonth = rMonth === month;
            const matchesCategory = relatedCategories.length === 0 ||
                (r.subCategory && relatedCategories.includes(r.subCategory));
            return matchesMonth && matchesCategory;
        }).length;
    };

    if (!latestInsight) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="p-6 bg-secondary rounded-full">
                        <Lightbulb className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold italic">아직 생성된 인사이트가 없습니다.</h2>
                    <p className="text-muted-foreground">매월 1일 수집 완료 후 자동으로 생성됩니다.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-10 pb-20">
                {/* Header */}
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold tracking-tighter text-sm uppercase">
                            <Sparkles className="w-4 h-4" /> monthly intelligence
                        </div>
                        <h1 className="text-5xl font-black tracking-tight italic flex items-center gap-4">
                            INSIGHTS <span className="text-muted-foreground font-thin">/</span> {latestInsight.month}
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                            {latestInsight.summary}
                        </p>
                        <p className="text-muted-foreground/60 text-xs mt-2">
                            💡 인사이트는 매월 2일 새벽 3시(KST)에 자동 갱신됩니다
                        </p>
                    </div>
                    <div className="bg-secondary/30 backdrop-blur-md border border-border/50 p-6 rounded-3xl space-y-1 min-w-[200px]">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                            <Calendar className="w-3 h-3" /> Analysis Date
                        </div>
                        <div className="text-lg font-mono font-bold">
                            {new Date(latestInsight.generatedAt).toLocaleDateString()}
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Positive Insights */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-green-400">
                            <TrendingUp className="w-6 h-6" /> 긍정 인사이트 (Strengths)
                        </h2>
                        <div className="space-y-4">
                            {latestInsight.positiveInsights.map((item, idx) => (
                                <Link
                                    key={idx}
                                    href={`/insights/drilldown?month=${latestInsight.month}&title=${encodeURIComponent(item.title || (item as any).categories || (item as any).category || '')}&categories=${encodeURIComponent(item.relatedSubCategories?.join(',') || (item as any).categories || '')}`}
                                    className="block group relative bg-[#111] border border-green-500/20 p-6 rounded-3xl hover:border-green-500/50 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    {item.isSpiked && (
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-green-500/20 animate-bounce z-10">
                                            RECENT SPIKE
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-white group-hover:text-green-400 transition-colors">
                                                {item.title || (item as any).categories || (item as any).category || '인사이트'}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {item.jobLabels && item.jobLabels.length > 0 ? (
                                                    <>
                                                        {item.jobLabels.slice(0, 5).map((label, lidx) => (
                                                            <span key={lidx} className="text-[11px] font-bold bg-green-500/10 text-green-400 px-2.5 py-1 rounded-md border border-green-500/20">
                                                                {label}
                                                            </span>
                                                        ))}
                                                        {item.jobLabels.length > 5 && (
                                                            <span className="text-[11px] font-bold bg-secondary text-muted-foreground px-2.5 py-1 rounded-md border border-border">
                                                                +{item.jobLabels.length - 5}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-[11px] font-bold bg-secondary/50 text-muted-foreground px-2.5 py-1 rounded-md border border-border/30">
                                                        라벨 없음
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${item.severity === 'high' ? 'bg-green-500 text-black' :
                                            item.severity === 'medium' ? 'bg-green-500/20 text-green-400' :
                                                'bg-secondary text-muted-foreground'
                                            }`}>
                                            {item.severity.toUpperCase()} IMPACT
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                                        "{item.description || (item as any).summary || '상세 내용 분석 중입니다.'}"
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1 font-bold">
                                            <span className="text-green-400">
                                                {getCalculatedCount(latestInsight.month, item.relatedSubCategories || [])}
                                            </span>
                                            <span className="text-muted-foreground">Reviews</span>
                                        </div>
                                        <div className="text-green-500 font-bold text-xs">
                                            상세 리뷰 보기 →
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Negative Insights */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
                            <TrendingDown className="w-6 h-6" /> 부정 인사이트 (Pain Points)
                        </h2>
                        <div className="space-y-4">
                            {latestInsight.negativeInsights.map((item, idx) => (
                                <Link
                                    key={idx}
                                    href={`/insights/drilldown?month=${latestInsight.month}&title=${encodeURIComponent(item.title || (item as any).categories || (item as any).category || '')}&categories=${encodeURIComponent(item.relatedSubCategories?.join(',') || (item as any).categories || '')}`}
                                    className="block group relative bg-[#111] border border-primary/20 p-6 rounded-3xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    {item.isSpiked && (
                                        <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-primary/20 animate-bounce z-10">
                                            RECENT SPIKE
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">
                                                {item.title || (item as any).categories || (item as any).category || '인사이트'}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {item.jobLabels && item.jobLabels.length > 0 ? (
                                                    <>
                                                        {item.jobLabels.slice(0, 5).map((label, lidx) => (
                                                            <span key={lidx} className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20">
                                                                {label}
                                                            </span>
                                                        ))}
                                                        {item.jobLabels.length > 5 && (
                                                            <span className="text-[11px] font-bold bg-secondary text-muted-foreground px-2.5 py-1 rounded-md border border-border">
                                                                +{item.jobLabels.length - 5}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-[11px] font-bold bg-secondary/50 text-muted-foreground px-2.5 py-1 rounded-md border border-border/30">
                                                        라벨 없음
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${item.severity === 'high' ? 'bg-primary text-white' :
                                            item.severity === 'medium' ? 'bg-primary/20 text-primary' :
                                                'bg-secondary text-muted-foreground'
                                            }`}>
                                            {item.severity.toUpperCase()} IMPACT
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                                        "{item.description || (item as any).summary || '상세 내용 분석 중입니다.'}"
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1 font-bold">
                                            <span className="text-primary">
                                                {getCalculatedCount(latestInsight.month, item.relatedSubCategories || [])}
                                            </span>
                                            <span className="text-muted-foreground">Reviews</span>
                                        </div>
                                        <div className="text-primary font-bold text-xs">
                                            상세 리뷰 보기 →
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Tasks Section */}
                <section className="space-y-8 bg-secondary/10 border border-border/50 p-10 rounded-[3rem]">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black italic tracking-tighter flex items-center gap-3">
                                <BarChart2 className="w-8 h-8 text-blue-400" /> AI 추천 Task & PRD
                            </h2>
                            <p className="text-muted-foreground">분석 결과를 바탕으로 제안하는 개선 과제입니다.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {latestInsight.tasks.map((task, idx) => (
                            <Link
                                key={idx}
                                href={`/insights/prd?month=${latestInsight.month}&title=${encodeURIComponent(task.title)}`}
                                className="group relative bg-[#111] border border-blue-500/10 p-6 rounded-3xl hover:border-blue-500/40 transition-all duration-300 transform hover:-translate-y-1 flex flex-col gap-4 shadow-lg"
                            >
                                <div className="flex justify-between items-start">
                                    <div className={`text-[10px] font-black px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-blue-500 text-white' :
                                        task.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-secondary text-muted-foreground'
                                        }`}>
                                        {task.priority.toUpperCase()} PRIORITY
                                    </div>
                                    <div className="flex items-center gap-1.5 text-blue-500 font-bold text-[11px]">
                                        <Sparkles className="w-3.5 h-3.5" /> PRD 제안
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight">{task.title}</h3>
                                    {task.jobLabels && task.jobLabels.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {task.jobLabels.slice(0, 5).map((label, lidx) => (
                                                <span key={lidx} className="text-[11px] font-bold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20">
                                                    {label}
                                                </span>
                                            ))}
                                            {task.jobLabels.length > 5 && (
                                                <span className="text-[11px] font-bold bg-secondary text-muted-foreground px-2.5 py-1 rounded-md border border-border">
                                                    +{task.jobLabels.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] font-bold bg-secondary/50 text-muted-foreground px-2.5 py-1 rounded-md border border-border/30">
                                            라벨 없음
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                    "{task.description}"
                                </p>
                                <div className="mt-2 pt-4 border-t border-blue-500/10">
                                    <div className="text-blue-400 font-bold text-xs flex items-center justify-between">
                                        PRD 기획서 제안 보러가기 →
                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* History Section */}
                {sortedInsights.length > 1 && (
                    <section className="space-y-6">
                        <h2 className="text-xl font-bold text-muted-foreground italic">Previous Insights</h2>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {sortedInsights.slice(1).map((history, idx) => (
                                <a key={idx} href={`/insights?month=${history.month}`} className="flex-shrink-0 bg-secondary/20 border border-border p-4 rounded-2xl hover:bg-secondary/40 transition-colors">
                                    <div className="text-xs font-black text-muted-foreground mb-1">{history.month}</div>
                                    <div className="text-sm font-bold truncate w-32">{history.summary}</div>
                                </a>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </Layout>
    );
}
