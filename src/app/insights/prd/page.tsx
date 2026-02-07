import Layout from '@/components/layout';
import { loadInsights } from '@/lib/storage';
import { ArrowLeft, ClipboardList, Target, Zap, Users, Code, PenTool, BarChart } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PRDPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PRDDetailPage(props: PRDPageProps) {
    const searchParams = await props.searchParams;
    const month = searchParams.month as string;
    const title = searchParams.title as string;

    const insights = await loadInsights();
    const monthlyInsight = insights.find(i => i.month === month);
    const task = monthlyInsight?.tasks.find(t => t.title === title);

    if (!task || !task.prd) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <h1 className="text-2xl font-bold">PRD 정보를 찾을 수 없습니다.</h1>
                    <p className="text-muted-foreground">데이터를 다시 업데이트하거나 목록으로 돌아가주세요.</p>
                    <Link href="/insights" className="text-primary hover:underline font-bold">인사이트 목록으로 돌아가기</Link>
                </div>
            </Layout>
        );
    }

    const { prd } = task;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
                {/* Header */}
                <div className="space-y-4">
                    <Link href="/insights" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-bold">
                        <ArrowLeft className="w-4 h-4" /> 인사이트 리포트로 돌아가기
                    </Link>
                    <div className="space-y-2">
                        <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black w-fit uppercase tracking-wider">
                            PRD Proposition for {month}
                        </div>
                        <h1 className="text-4xl font-black tracking-tight leading-tight">{task.title}</h1>
                        <p className="text-xl text-muted-foreground leading-relaxed italic">
                            "{task.description}"
                        </p>
                    </div>
                </div>

                {/* PRD Content */}
                <div className="grid gap-8">
                    {/* Definition */}
                    <div className="bg-[#111] border border-border/50 p-8 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex items-center gap-3 text-blue-400">
                            <ClipboardList className="w-6 h-6" />
                            <h2 className="text-xl font-bold">1. 정의 및 배경 (Definition)</h2>
                        </div>
                        <p className="text-lg leading-relaxed text-slate-200">
                            {prd.definition}
                        </p>
                    </div>

                    {/* Purpose */}
                    <div className="bg-[#111] border border-border/50 p-8 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex items-center gap-3 text-green-400">
                            <Target className="w-6 h-6" />
                            <h2 className="text-xl font-bold">2. 목적 (Purpose)</h2>
                        </div>
                        <p className="text-lg leading-relaxed text-slate-200">
                            {prd.purpose}
                        </p>
                    </div>

                    {/* Expected Effect */}
                    <div className="bg-[#111] border border-border/50 p-8 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex items-center gap-3 text-yellow-400">
                            <Zap className="w-6 h-6" />
                            <h2 className="text-xl font-bold">3. 기대 효과 (Expected Effect)</h2>
                        </div>
                        <p className="text-lg leading-relaxed text-slate-200">
                            {prd.expectedEffect}
                        </p>
                    </div>

                    {/* Key Features */}
                    {prd.keyFeatures && prd.keyFeatures.length > 0 && (
                        <div className="bg-[#111] border border-border/50 p-8 rounded-3xl space-y-4 shadow-xl">
                            <div className="flex items-center gap-3 text-purple-400">
                                <ClipboardList className="w-6 h-6" />
                                <h2 className="text-xl font-bold">4. 핵심 구현 기능 (Key Features)</h2>
                            </div>
                            <ul className="space-y-3">
                                {prd.keyFeatures.map((feature, idx) => (
                                    <li key={idx} className="flex gap-3 items-start">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold mt-0.5">
                                            {idx + 1}
                                        </span>
                                        <span className="text-lg leading-relaxed text-slate-200 flex-1">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Roles by Department */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black flex items-center gap-3 px-2">
                            <Users className="w-7 h-7" /> 5. 직무별 실행 가이드 (Roles)
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Planning */}
                            <div className="bg-secondary/20 p-6 rounded-3xl border border-border/30 space-y-3">
                                <div className="flex items-center gap-2 text-blue-400 font-bold">
                                    <ClipboardList className="w-5 h-5" /> 서비스 기획 / 운영
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {prd.roles.planning || '해당 내용 협의 중입니다.'}
                                </p>
                            </div>

                            {/* Development */}
                            <div className="bg-secondary/20 p-6 rounded-3xl border border-border/30 space-y-3">
                                <div className="flex items-center gap-2 text-purple-400 font-bold">
                                    <Code className="w-5 h-5" /> 개발 (Frontend / Backend)
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {prd.roles.development || '해당 내용 협의 중입니다.'}
                                </p>
                            </div>

                            {/* Design */}
                            <div className="bg-secondary/20 p-6 rounded-3xl border border-border/30 space-y-3">
                                <div className="flex items-center gap-2 text-pink-400 font-bold">
                                    <PenTool className="w-5 h-5" /> UX/UI 디자인
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {prd.roles.design || '해당 내용 협의 중입니다.'}
                                </p>
                            </div>

                            {/* Marketing */}
                            <div className="bg-secondary/20 p-6 rounded-3xl border border-border/30 space-y-3">
                                <div className="flex items-center gap-2 text-orange-400 font-bold">
                                    <BarChart className="w-5 h-5" /> 마케팅 / 대외 정책
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {prd.roles.marketing || '해당 내용 협의 중입니다.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-border/30">
                    <Link
                        href="/insights"
                        className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-black transition-all transform hover:scale-105"
                    >
                        전체 리포트로 돌아가기
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
