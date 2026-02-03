'use client';

import { useState, useMemo } from 'react';
import { AnalyzedReview, MonthlyStats } from '@/lib/types';
import { Download, Filter } from 'lucide-react';
import Link from 'next/link';

interface DashboardStatsProps {
    allReviews: AnalyzedReview[];
    initialStats: MonthlyStats[];
}

export function DashboardStats({ allReviews, initialStats }: DashboardStatsProps) {
    const [selectedSubCat, setSelectedSubCat] = useState<string>('전체');

    const subCategories = useMemo(() => {
        return Array.from(new Set(allReviews.map(r => r.subCategory))).sort();
    }, [allReviews]);

    const filteredStats = useMemo(() => {
        if (selectedSubCat === '전체') return initialStats;

        // Recalculate monthly stats based on selected sub-category
        const statsMap: Record<string, MonthlyStats> = {};
        allReviews.filter(r => r.subCategory === selectedSubCat).forEach(r => {
            const month = r.date.substring(0, 7);
            if (!statsMap[month]) {
                statsMap[month] = { month, complaints: 0, compliments: 0, others: 0, total: 0 };
            }
            statsMap[month].total++;
            if (r.category === '칭찬') statsMap[month].compliments++;
            else if (r.category === '불만') statsMap[month].complaints++;
            else statsMap[month].others++;
        });

        return Object.values(statsMap).sort((a, b) => b.month.localeCompare(a.month));
    }, [selectedSubCat, allReviews, initialStats]);

    return (
        <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    월별 분석 현황
                    <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded italic">FILTERABLE</span>
                </h2>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-secondary/50 border border-border px-3 py-1.5 rounded-lg">
                        <Filter className="w-3 h-3 text-muted-foreground" />
                        <select
                            className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
                            value={selectedSubCat}
                            onChange={(e) => setSelectedSubCat(e.target.value)}
                        >
                            <option value="전체">모든 세부 사유</option>
                            {subCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <Link
                        href="/api/export"
                        className="text-xs font-bold text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-secondary flex items-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" /> EXCEL
                    </Link>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-secondary/50 text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-b border-border">
                            <th className="px-6 py-4">MONTH</th>
                            <th className="px-6 py-4 text-right">TOTAL</th>
                            <th className="px-6 py-4 text-right text-green-400">COMPLIMENTS</th>
                            <th className="px-6 py-4 text-right text-primary">COMPLAINTS</th>
                            <th className="px-6 py-4 text-right whitespace-nowrap">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-border">
                        {filteredStats.length > 0 ? filteredStats.map(s => (
                            <tr key={s.month} className="hover:bg-secondary/20 transition-colors cursor-default">
                                <td className="px-6 py-4 font-mono">{s.month}</td>
                                <td className="px-6 py-4 text-right font-bold">{s.total}</td>
                                <td className="px-6 py-4 text-right text-green-400/80">{s.compliments}</td>
                                <td className="px-6 py-4 text-right text-primary/80">{s.complaints}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end">
                                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden flex">
                                            <div
                                                className="h-full bg-green-500"
                                                style={{ width: `${(s.compliments / (s.total || 1)) * 100}%` }}
                                            />
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${(s.complaints / (s.total || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                                    해당 조건에 맞는 데이터가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
