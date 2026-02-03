import Layout from '@/components/layout';
import { getMonthlyStats, loadReviews } from '@/lib/storage';

export const dynamic = 'force-dynamic';

import { TrendingUp, MessageSquare, ThumbsUp, ThumbsDown, ArrowRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { DashboardStats } from '@/components/dashboard-stats';

export default async function DashboardPage() {
  const stats = await getMonthlyStats();
  const allReviews = await loadReviews();
  const recentReviews = [...allReviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Month-over-Month calculation exclusion logic
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filter out current month for MoM calculation to get "finished" month data
  const finishedStats = stats.filter(s => s.month !== currentMonthStr);

  const growthRate = finishedStats.length >= 2
    ? Math.round(((finishedStats[0].total - finishedStats[1].total) / (finishedStats[1].total || 1)) * 100)
    : 0;

  return (
    <Layout>
      <div className="space-y-10">
        {/* Hero */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <BarChart3 className="text-primary w-10 h-10" />
              리뷰 분석 리포트
            </h1>
            <p className="text-muted-foreground text-lg italic">TVING App Store & Play Store Analysis</p>
          </div>
          <div className="bg-secondary/50 border border-border px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground">
            데이터 업데이트: {new Date().toLocaleString()}
          </div>
        </section>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="연간 누적 리뷰" value={allReviews.length.toLocaleString()} icon={<MessageSquare className="text-blue-400" />} description="최근 12개월 수집 총량" />
          <StatCard title="긍정 반응" value={allReviews.filter(r => r.category === '칭찬').length.toLocaleString()} icon={<ThumbsUp className="text-green-400" />} description="AI 긍정 분류 리뷰" />
          <StatCard title="개선 필요" value={allReviews.filter(r => r.category === '불만').length.toLocaleString()} icon={<ThumbsDown className="text-primary" />} description="AI 부정 분류 리뷰" />
          <StatCard title="월간 성장세" value={`${growthRate > 0 ? '+' : ''}${growthRate}%`} icon={<TrendingUp className="text-purple-400" />} description="전월 대비 리뷰 유입량 (확정월 기준)" trend={growthRate >= 0 ? 'up' : 'down'} />
        </div>

        {/* Filterable Monthly Stats Table & Graph */}
        <DashboardStats allReviews={allReviews} initialStats={stats} />

        {/* Recent Reviews Sidebar */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">최근 리뷰 모니터링</h2>
            <Link href="/reviews" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline group">
              전체 보기 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReviews.map(r => (
              <div key={r.id} className="bg-card border border-border p-5 rounded-xl space-y-3 hover:border-primary/30 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{r.userName}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(r.date).toLocaleDateString()}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${r.category === '칭찬' ? 'bg-green-500/10 text-green-400' :
                    r.category === '불만' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                    {r.subCategory || r.category}
                  </span>
                </div>
                <p className="text-xs leading-relaxed line-clamp-3 text-foreground/80 italic">"{r.text}"</p>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <div className="text-yellow-500 text-xs">{'★'.repeat(r.score)}</div>
                  <div className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${r.store === 'google-play' ? 'bg-blue-900/40 text-blue-400' : 'bg-gray-700/40 text-gray-400'}`}>
                    {r.store === 'google-play' ? 'GOOGLE' : 'APPLE'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon, description, trend }: { title: string, value: string, icon: React.ReactNode, description: string, trend?: 'up' | 'down' }) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl space-y-4 hover:shadow-2xl hover:shadow-primary/5 transition-all">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">{title}</span>
        <div className="p-2 bg-secondary rounded-lg">{icon}</div>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black italic tracking-tighter">{value}</span>
          {trend && <span className={`text-xs font-bold ${trend === 'up' ? 'text-green-500' : 'text-primary'}`}>{trend === 'up' ? '▲' : '▼'}</span>}
        </div>
        <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
      </div>
    </div>
  );
}
