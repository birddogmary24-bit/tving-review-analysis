'use client';

import { MonthlyStats } from '@/lib/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface SentimentChartProps {
  stats: MonthlyStats[];
  height?: number;
}

export function SentimentChart({ stats, height = 350 }: SentimentChartProps) {
  const chartData = [...stats]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(s => ({
      month: s.month.substring(5), // MM format
      전체: s.total,
      긍정: s.compliments,
      부정: s.complaints,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        데이터가 없습니다. 먼저 리뷰를 수집해주세요.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
        <XAxis dataKey="month" stroke="#a0a0b8" fontSize={12} />
        <YAxis stroke="#a0a0b8" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#12121e',
            border: '1px solid #1e1e30',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line type="monotone" dataKey="전체" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="긍정" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="부정" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
