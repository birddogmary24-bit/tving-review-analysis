'use client';

import { AnalyzedReview, Category } from '@/lib/types';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Filter, Calendar, Star, Loader2 } from 'lucide-react';
import { SUB_CATEGORIES } from '@/lib/ai';

const ITEMS_PER_PAGE = 30;

interface ReviewsResponse {
    reviews: AnalyzedReview[];
    total: number;
    page: number;
    totalPages: number;
    totalAll: number;
    availableMonths: string[];
    starCounts: Record<number, number>;
}

export function ReviewList() {
    const [categoryFilter, setCategoryFilter] = useState<Category | '전체'>('전체');
    const [subCategoryFilter, setSubCategoryFilter] = useState<string>('전체');
    const [scoreFilter, setScoreFilter] = useState<number | '전체'>('전체');
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [isMonthFilterOpen, setIsMonthFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState<ReviewsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchDebounce, setSearchDebounce] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchDebounce(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(currentPage));
            params.set('limit', String(ITEMS_PER_PAGE));
            if (categoryFilter !== '전체') params.set('category', categoryFilter);
            if (subCategoryFilter !== '전체') params.set('subCategory', subCategoryFilter);
            if (scoreFilter !== '전체') params.set('score', String(scoreFilter));
            if (selectedMonths.length > 0) params.set('months', selectedMonths.join(','));
            if (searchDebounce) params.set('search', searchDebounce);

            const res = await fetch(`/api/reviews/list?${params.toString()}`);
            const json = await res.json();
            setData(json);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [currentPage, categoryFilter, subCategoryFilter, scoreFilter, selectedMonths, searchDebounce]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const reviews = data?.reviews || [];
    const total = data?.total || 0;
    const totalPages = data?.totalPages || 0;
    const availableMonths = data?.availableMonths || [];
    const starCounts = data?.starCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const totalAll = data?.totalAll || 0;

    const toggleMonth = (month: string) => {
        setSelectedMonths(prev =>
            prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
        );
        setCurrentPage(1);
    };

    const availableSubCategories = useMemo(() => {
        if (categoryFilter === '전체') {
            return Object.values(SUB_CATEGORIES).flat();
        }
        return SUB_CATEGORIES[categoryFilter] || [];
    }, [categoryFilter]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-6 bg-card/50 p-6 rounded-2xl border border-border shadow-2xl">
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="리뷰 내용 또는 사용자명 검색..."
                            className="w-full bg-secondary border border-border rounded-xl pl-12 pr-4 py-3.5 text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 bg-secondary border border-border px-4 py-2 rounded-xl relative hover:border-primary/50 transition-colors">
                            <button
                                onClick={() => setIsMonthFilterOpen(!isMonthFilterOpen)}
                                className="flex items-center gap-2 focus:outline-none"
                            >
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-black whitespace-nowrap">
                                    {selectedMonths.length === 0 ? '모든 기간' : `${selectedMonths.length}개 월`}
                                </span>
                            </button>
                            {isMonthFilterOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl p-2 z-50">
                                    <div className="max-h-60 overflow-y-auto space-y-1">
                                        <button
                                            onClick={() => { setSelectedMonths([]); setIsMonthFilterOpen(false); }}
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
                                                    className="w-3 h-3 rounded bg-zinc-800 border-zinc-700 text-primary"
                                                />
                                                <span className="text-xs font-medium">{m}</span>
                                            </label>
                                        ))}
                                        <div className="border-t border-border my-1" />
                                        <button
                                            onClick={() => setIsMonthFilterOpen(false)}
                                            className="w-full text-center py-1.5 mt-1 bg-primary text-white text-[10px] font-black rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            닫기
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 bg-secondary border border-border px-4 py-2 rounded-xl group hover:border-primary/50 transition-colors">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <select
                                className="bg-transparent text-sm font-black focus:outline-none cursor-pointer appearance-none pr-6"
                                value={scoreFilter}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setScoreFilter(val === '전체' ? '전체' : Number(val));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="전체">모든 별점 ({totalAll})</option>
                                {[5, 4, 3, 2, 1].map(s => (
                                    <option key={s} value={s}>{s}점 ({starCounts[s as keyof typeof starCounts] || 0})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {['전체', '칭찬', '불만'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setCategoryFilter(cat as Category | '전체');
                                    setSubCategoryFilter('전체');
                                    setCurrentPage(1);
                                }}
                                className={`px-6 py-3.5 rounded-xl text-sm font-black transition-all ${categoryFilter === cat
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'bg-secondary text-foreground hover:bg-muted border border-border'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest mr-2">상세 필터:</span>
                    <button
                        onClick={() => { setSubCategoryFilter('전체'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${subCategoryFilter === '전체'
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground'
                            }`}
                    >
                        전체
                    </button>
                    {availableSubCategories.map(sub => (
                        <button
                            key={sub}
                            onClick={() => { setSubCategoryFilter(sub); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${subCategoryFilter === sub
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground'
                                }`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground border-b border-border">
                                <th className="px-8 py-5">날짜</th>
                                <th className="px-8 py-5">사용자</th>
                                <th className="px-8 py-5">분석 분류</th>
                                <th className="px-8 py-5">별점</th>
                                <th className="px-8 py-5 w-1/2">리뷰 내용</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-muted-foreground">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        데이터를 불러오는 중...
                                    </td>
                                </tr>
                            ) : reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-muted-foreground">
                                        {totalAll === 0
                                            ? '아직 수집된 리뷰가 없습니다. 데이터 업데이트를 먼저 실행해주세요.'
                                            : '필터 조건에 맞는 데이터가 없습니다.'}
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((r) => (
                                    <tr key={`${r.store}-${r.id}`} className="hover:bg-white/5 transition-all group border-l-2 border-l-transparent hover:border-l-primary">
                                        <td className="px-8 py-4 whitespace-nowrap text-xs font-bold text-muted-foreground">{new Date(r.date).toLocaleDateString()}</td>
                                        <td className="px-8 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-extrabold text-sm text-white">{r.userName}</span>
                                                <span className="text-[9px] text-muted-foreground uppercase font-black">{r.store === 'google-play' ? 'Google Play' : 'App Store'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.category === '칭찬' ? 'bg-green-500 text-white' :
                                                    r.category === '불만' ? 'bg-primary text-white' :
                                                        'bg-muted text-foreground'
                                                    }`}>
                                                    {r.category}
                                                </span>
                                                <span className="text-[11px] text-foreground font-black tracking-tight">
                                                    {r.subCategory || '미분류'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex gap-0.5 text-yellow-500 font-bold text-xs">
                                                {'★'.repeat(r.score)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-sm leading-snug font-medium text-foreground/90">
                                            &quot;{r.text}&quot;
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-8 py-6 border-t border-border bg-secondary/10">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Total <span className="text-white">{total.toLocaleString()}</span> items · Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="px-4 py-2 border border-border rounded-lg font-bold text-xs hover:bg-white hover:text-black transition-all disabled:opacity-20"
                            >
                                PREV
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="px-4 py-2 border border-border rounded-lg font-bold text-xs hover:bg-white hover:text-black transition-all disabled:opacity-20"
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
