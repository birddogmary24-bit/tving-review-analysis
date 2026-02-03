'use client';

import { AnalyzedReview, Category } from '@/lib/types';
import { useState, useMemo } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SUB_CATEGORIES } from '@/lib/ai';

interface ReviewListProps {
    initialReviews: AnalyzedReview[];
}

const ITEMS_PER_PAGE = 30;

export function ReviewList({ initialReviews }: ReviewListProps) {
    const [categoryFilter, setCategoryFilter] = useState<Category | '전체'>('전체');
    const [subCategoryFilter, setSubCategoryFilter] = useState<string>('전체');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredReviews = useMemo(() => {
        return initialReviews.filter(r => {
            const matchesCategory = categoryFilter === '전체' || r.category === categoryFilter;
            const matchesSubCategory = subCategoryFilter === '전체' || r.subCategory === subCategoryFilter;
            const matchesSearch = !searchTerm ||
                r.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.userName.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSubCategory && matchesSearch;
        });
    }, [initialReviews, categoryFilter, subCategoryFilter, searchTerm]);

    const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
    const paginatedReviews = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredReviews.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredReviews, currentPage]);

    // Available sub-categories based on standard list + what's in data
    const availableSubCategories = useMemo(() => {
        if (categoryFilter === '전체') {
            const all = Array.from(new Set(initialReviews.map(r => r.subCategory || '미분류'))).sort();
            return all;
        }
        // Use the predefined list if specific category is selected, or fallback to data
        const predefined = SUB_CATEGORIES[categoryFilter] || [];
        const fromData = Array.from(new Set(initialReviews.filter(r => r.category === categoryFilter).map(r => r.subCategory))).filter(Boolean);
        return Array.from(new Set([...predefined, ...fromData])).sort();
    }, [initialReviews, categoryFilter]);

    return (
        <div className="space-y-8">
            {/* Search and Filters */}
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
                    <div className="flex gap-2">
                        {['전체', '칭찬', '불만', '기타'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setCategoryFilter(cat as any);
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

                {/* Dynamic Sub-category Filter */}
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

            {/* Table */}
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
                            {paginatedReviews.map((r) => (
                                <tr key={r.id} className="hover:bg-white/5 transition-all group border-l-2 border-l-transparent hover:border-l-primary">
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
                                        "{r.text}"
                                    </td>
                                </tr>
                            ))}
                            {paginatedReviews.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-muted-foreground">데이터가 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-8 py-6 border-t border-border bg-secondary/10">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Total <span className="text-white">{filteredReviews.length.toLocaleString()}</span> items · Page {currentPage} of {totalPages}
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
