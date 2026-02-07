import Layout from '@/components/layout';
import { loadInsights } from '@/lib/storage';
import { Lightbulb, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Calendar, Sparkles, BarChart2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
    const insights = await loadInsights();

    // Sort by month descending
    const sortedInsights = [...insights].sort((a, b) => b.month.localeCompare(a.month));
    const latestInsight = sortedInsights[0];

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
                                <div key={idx} className="group relative bg-[#111] border border-green-500/20 p-6 rounded-3xl hover:border-green-500/50 transition-all duration-300">
                                    {item.isSpiked && (
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-green-500/20 animate-bounce">
                                            RECENT SPIKE
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-black text-white">{item.title}</h3>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${item.severity === 'high' ? 'bg-green-500 text-black' :
                                                item.severity === 'medium' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-secondary text-muted-foreground'
                                            }`}>
                                            {item.severity.toUpperCase()} IMPACT
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                                        "{item.description}"
                                    </p>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1 font-bold">
                                            <span className="text-green-400">{item.count}</span>
                                            <span className="text-muted-foreground">Reviews</span>
                                        </div>
                                    </div>
                                </div>
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
                                <div key={idx} className="group relative bg-[#111] border border-primary/20 p-6 rounded-3xl hover:border-primary/50 transition-all duration-300">
                                    {item.isSpiked && (
                                        <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-primary/20 animate-bounce">
                                            RECENT SPIKE
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-black text-white">{item.title}</h3>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${item.severity === 'high' ? 'bg-primary text-white' :
                                                item.severity === 'medium' ? 'bg-primary/20 text-primary' :
                                                    'bg-secondary text-muted-foreground'
                                            }`}>
                                            {item.severity.toUpperCase()} IMPACT
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                                        "{item.description}"
                                    </p>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1 font-bold">
                                            <span className="text-primary">{item.count}</span>
                                            <span className="text-muted-foreground">Reviews</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Tasks Section */}
                <section className="space-y-8 bg-secondary/10 border border-border/50 p-10 rounded-[3rem]">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black italic tracking-tighter flex items-center gap-3">
                                <BarChart2 className="w-8 h-8 text-blue-400" /> RECOMMENDED TASKS
                            </h2>
                            <p className="text-muted-foreground">분석 결과를 바탕으로 제안하는 개선 과제입니다.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {latestInsight.tasks.map((task, idx) => (
                            <div key={idx} className="bg-card border border-border p-6 rounded-3xl space-y-4 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-2 h-full ${task.priority === 'high' ? 'bg-primary' :
                                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`} />
                                <div className="flex items-center gap-2">
                                    {task.priority === 'high' ? (
                                        <AlertCircle className="w-5 h-5 text-primary" />
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {task.priority} priority
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold leading-tight">{task.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {task.description}
                                </p>
                            </div>
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
