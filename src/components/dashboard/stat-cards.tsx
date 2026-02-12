import { MessageSquare, ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';
import { AnalyzedReview, MonthlyStats } from '@/lib/types';

interface StatCardsProps {
  reviews: AnalyzedReview[];
  stats: MonthlyStats[];
  appName?: string;
}

export function StatCards({ reviews, stats, appName }: StatCardsProps) {
  const compliments = reviews.filter(r => r.score >= 3).length;
  const complaints = reviews.filter(r => r.score < 3).length;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const finishedStats = stats.filter(s => s.month !== currentMonth);

  const growthRate = finishedStats.length >= 2
    ? Math.round(((finishedStats[0].total - finishedStats[1].total) / (finishedStats[1].total || 1)) * 100)
    : 0;

  const cards = [
    {
      title: '전체 리뷰',
      value: reviews.length.toLocaleString(),
      icon: <MessageSquare className="text-blue-400" />,
      desc: appName ? `${appName} 누적 리뷰` : '전체 OTT 누적 리뷰',
    },
    {
      title: '긍정 반응',
      value: compliments.toLocaleString(),
      icon: <ThumbsUp className="text-success" />,
      desc: '별점 3점 이상',
    },
    {
      title: '개선 필요',
      value: complaints.toLocaleString(),
      icon: <ThumbsDown className="text-danger" />,
      desc: '별점 2점 이하',
    },
    {
      title: '월간 성장세',
      value: `${growthRate > 0 ? '+' : ''}${growthRate}%`,
      icon: <TrendingUp className="text-purple-400" />,
      desc: '전월 대비 리뷰 유입량',
      trend: growthRate >= 0 ? 'up' as const : 'down' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map(card => (
        <div
          key={card.title}
          className="bg-card border border-border p-5 rounded-xl space-y-3 hover:border-primary/30 transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
              {card.title}
            </span>
            <div className="p-2 bg-secondary rounded-lg">{card.icon}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight">{card.value}</span>
              {card.trend && (
                <span className={`text-xs font-bold ${card.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                  {card.trend === 'up' ? '▲' : '▼'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{card.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
