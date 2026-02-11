'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { MonthlyStats } from '@/lib/types';
import { Download, Filter, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardStatsProps {
    initialStats: MonthlyStats[];
    initialSubCategories: string[];
}

export function DashboardStats({ initialStats, initialSubCategories }: DashboardStatsProps) {
    const [selectedSubCat, setSelectedSubCat] = useState<string>('전체');
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [stats, setStats] = useState<MonthlyStats[]>(initialStats);
    const [loading, setLoading] = useState(false);

    const availableMonths = useMemo(() => {
        return initialStats.map(s => s.month).sort((a, b) => b.localeCompare(a));
    }, [initialStats]);

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const fetchStats = useCallback(async (subCat: string) => {
        if (subCat === '전체') {
            setStats(initialStats);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/reviews/stats?subCategory=${encodeURIComponent(subCat)}`);
            const data = await res.json();
            setStats(data.stats || []);
        } catch {
            setStats([]);
        } finally {
            setLoading(false);
        }
    }, [initialStats]);

    useEffect(() => {
        fetchStats(selectedSubCat);
    }, [selectedSubCat, fetchStats]);

    const filteredStats = useMemo(() => {
        let filtered = stats.filter(s => s.month >= '2025-01');
        if (selectedMonths.length > 0) {
            filtered = filtered.filter(s => selectedMonths.includes(s.month));
        }
        return filtered.sort((a, b) => a.month.localeCompare(b.month));
    }, [selectedMonths, stats]);

    const chartData = useMemo(() => {
        return filteredStats.map(s => ({
            name: s.month,
            전체: s.total,
            긍정: s.compliments,
            부정: s.complaints
        }));
    }, [filteredStats]);

    const toggleMonth = (month: string) => {
        setSelectedMonths(prev =>
            prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
        );
    };

    return (
        <section className="space-y-8">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        감성 분석 추이
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">LIVE CHART</span>
                        {loading && <span className="text-[10px] text-muted-foreground animate-pulse">로딩중...</span>}
                    </h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Line type="monotone" dataKey="전체" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="긍정" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="부정" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        분석 필터 및 현황
                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded tracking-tighter font-black">MULTI-SELECT</span>
                    </h2>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 bg-secondary border border-border px-4 py-2 rounded-xl relative">
                            <button
                                onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                                className="flex items-center gap-2 focus:outline-none"
                            >
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-black">
                                    {selectedMonths.length === 0 ? '모든 기간' : `${selectedMonths.length}개 월 선택됨`}
                                </span>
                            </button>
                            {isDateFilterOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="max-h-60 overflow-y-auto space-y-1">
                                        <button
                                            onClick={() => { setSelectedMonths([]); setIsDateFilterOpen(false); }}
                                            className="w-full text-left px-2 py-1 text-xs hover:bg-secondary rounded font-bold"
                                        >
                                            전체 선택 해제
                                        </button>
                                        <div className="border-t border-border my-1" />
                                        {availableMonths.map(m => (
                                            <label key={m} className="flex items-center gap-2 px-2 py-1 hover:bg-secondary rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMonths.includes(m)}
                                                    onChange={() => toggleMonth(m)}
                                                    className="w-3 h-3 rounded bg-zinc-800 border-zinc-700"
                                                />
                                                <span className="text-xs font-medium">{m}</span>
                                            </label>
                                        ))}
                                        <div className="border-t border-border my-1" />
                                        <button
                                            onClick={() => setIsDateFilterOpen(false)}
                                            className="w-full text-center py-1.5 mt-1 bg-primary text-white text-[10px] font-black rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            닫기
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 bg-secondary border border-border px-4 py-2 rounded-xl">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                                className="bg-transparent text-sm font-black focus:outline-none cursor-pointer appearance-none pr-4"
                                value={selectedSubCat}
                                onChange={(e) => setSelectedSubCat(e.target.value)}
                            >
                                <option value="전체">모든 세부 사유</option>
                                <optgroup label="분포 중인 사유">
                                    {initialSubCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <button
                            onClick={async () => {
                                const pw = prompt("관리자 비밀번호를 입력하세요:");
                                if (!pw) return;
                                try {
                                    const res = await fetch('/api/export', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ password: pw }),
                                    });
                                    if (!res.ok) {
                                        const err = await res.json();
                                        alert(err.error === 'UNAUTHORIZED' ? '비밀번호가 올바르지 않습니다.' : '내보내기에 실패했습니다.');
                                        return;
                                    }
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'tving_reviews_analysis.xlsx';
                                    a.click();
                                    URL.revokeObjectURL(url);
                                } catch {
                                    alert('내보내기 중 오류가 발생했습니다.');
                                }
                            }}
                            className="text-sm font-black text-white bg-secondary border border-border px-5 py-2.5 rounded-xl hover:bg-muted flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> EXCEL
                        </button>
                    </div>
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
                            {[...filteredStats].reverse().map(s => (
                                <tr key={s.month} className="hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-4 font-mono font-bold">
                                        {s.month}
                                        {s.month === currentMonthStr && <span className="ml-2 text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">집계중</span>}
                                    </td>
                                    <td className="px-8 py-4 text-right font-black text-lg">{s.total.toLocaleString()}</td>
                                    <td className="px-8 py-4 text-right text-green-400 font-bold">{s.compliments.toLocaleString()}</td>
                                    <td className="px-8 py-4 text-right text-primary font-bold">{s.complaints.toLocaleString()}</td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end">
                                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden flex">
                                                <div className="h-full bg-green-500 shadow-lg shadow-green-500/50" style={{ width: `${(s.compliments / (s.total || 1)) * 100}%` }} />
                                                <div className="h-full bg-primary shadow-lg shadow-primary/50" style={{ width: `${(s.complaints / (s.total || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStats.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-muted-foreground">
                                        {loading ? '데이터를 불러오는 중...' : '데이터가 없습니다. 먼저 데이터 업데이트를 실행해주세요.'}
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
