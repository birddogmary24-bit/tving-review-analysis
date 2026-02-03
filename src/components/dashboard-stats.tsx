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
        return Array.from(new Set(allReviews.map(r => r.subCategory))).filter(Boolean).sort();
    }, [allReviews]);

    const filteredStats = useMemo(() => {
        if (selectedSubCat === '전체') return initialStats;

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
                    <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded tracking-tighter font-black">AI FILTER</span>
                </h2>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-secondary border border-border px-4 py-2 rounded-xl">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            className="bg-transparent text-sm font-black focus:outline-none cursor-pointer appearance-none pr-4"
                            value={selectedSubCat}
                            onChange={(e) => setSelectedSubCat(e.target.value)}
                        >
                            <option value="전체">모든 세부 사유</option>
                            <optgroup label="분포 중인 사유">
                                {subCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    <Link
                        href="/api/export"
                        className="text-sm font-black text-white bg-secondary border border-border px-5 py-2.5 rounded-xl hover:bg-muted flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <Download className="w-4 h-4" /> EXCEL
                    </Link>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/80 text-[10px] uppercase tracking-widest font-black text-muted-foreground border-b border-border">
                                <th className="px-8 py-5">Analysis Month</th>
                                <th className="px-8 py-5 text-right">Total Cases</th>
                                <th className="px-8 py-5 text-right text-green-400">Compliments</th>
                                <th className="px-8 py-5 text-right text-primary">Complaints</th>
                                <th className="px-8 py-5 text-right w-32">Distribution</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border/50">
                            {filteredStats.length > 0 ? filteredStats.map(s => (
                                <tr key={s.month} className="hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-4 font-mono font-bold">{s.month}</td>
                                    <td className="px-8 py-4 text-right font-black text-lg">{s.total.toLocaleString()}</td>
                                    <td className="px-8 py-4 text-right text-green-400 font-bold">{s.compliments.toLocaleString()}</td>
                                    <td className="px-8 py-4 text-right text-primary font-bold">{s.complaints.toLocaleString()}</td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end">
                                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full bg-green-500 shadow-lg shadow-green-500/50"
                                                    style={{ width: `${(s.compliments / (s.total || 1)) * 100}%` }}
                                                />
                                                <div
                                                    className="h-full bg-primary shadow-lg shadow-primary/50"
                                                    style={{ width: `${(s.complaints / (s.total || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground font-bold">
                                        해당 세부 사유에 대한 분석 데이터가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
