'use client';

import { AnalyzedReview, Category } from '@/lib/types';
import { useState, useMemo } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ReviewListProps {
    initialReviews: AnalyzedReview[];
}

const ITEMS_PER_PAGE = 30; // Fewer items per page for better readability

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

    const availableSubCategories = useMemo(() => {
        // Collect ONLY subcategories that actually exist in the current filtered set
        const baseSet = initialReviews.filter(r => categoryFilter === '전체' || r.category === categoryFilter);
        const subs = Array.from(new Set(baseSet.map(r => r.subCategory || '미분류'))).sort();
        return subs;
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
                            placeholder="사용자명 또는 리뷰 내용 검색..."
                            className="w-full bg-secondary border border-border rounded-xl pl-12 pr-4 py-3.5 text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex gap-3">
                        {['전체', '칭찬', '불만', '기타'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setCategoryFilter(cat as any);
                                    setSubCategoryFilter('전체');
                                    setCurrentPage(1);
                                }}
                                className={`px-6 py-3.5 rounded-xl text-sm font-black transition-all tracking-tight ${categoryFilter === cat
                                    ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/30'
                                    : 'bg-secondary text-foreground hover:bg-muted border border-border'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dynamic Sub-category Filter */}
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-xs font-black text-primary uppercase tracking-[0.2em] mr-2">Detailed Reason</span>
                    <button
                        onClick={() => { setSubCategoryFilter('전체'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${subCategoryFilter === '전체'
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-foreground border-border hover:border-muted-foreground'
                            }`}
                    >
                        전체 사유
                    </button>
                    {availableSubCategories.map(sub => (
                        <button
                            key={sub}
                            onClick={() => { setSubCategoryFilter(sub); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${subCategoryFilter === sub
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-foreground border-border hover:border-muted-foreground'
                                }`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/80 text-xs uppercase font-black tracking-widest text-foreground border-b border-border">
                                <th className="px-8 py-6">Date</th>
                                <th className="px-8 py-6">User Info</th>
                                <th className="px-8 py-6">AI Category</th>
                                <th className="px-8 py-6">Rating</th>
                                <th className="px-8 py-6 w-1/2">Review Content</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {paginatedReviews.map((r) => (
                                <tr key={r.id} className="hover:bg-white/5 transition-all group border-l-2 border-l-transparent hover:border-l-primary">
                                    <td className="px-8 py-4 whitespace-nowrap text-sm font-bold text-muted-foreground">{new Date(r.date).toLocaleDateString()}</td>
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-extrabold text-sm text-white group-hover:text-primary transition-colors">{r.userName}</span>
                                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{r.store === 'google-play' ? 'Google Play' : 'Apple Store'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${r.category === '칭찬' ? 'bg-green-500 text-white' :
                                                r.category === '불만' ? 'bg-primary text-white' :
                                                    'bg-muted text-foreground'
                                                }`}>
                                                {r.category}
                                            </span>
                                            <span className="text-xs text-foreground font-bold tracking-tight flex items-center gap-1">
                                                <span className="text-primary text-[10px]">#</span> {r.subCategory || 'Other'}
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
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col md:flex-row items-center justify-between px-8 py-8 border-t border-border bg-secondary/10 gap-4">
                        <div className="text-sm font-bold text-muted-foreground">
                            Matching Results: <span className="text-white text-base ml-1">{filteredReviews.length.toLocaleString()}</span> items
                            <span className="mx-3 opacity-20">|</span>
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-3">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="flex items-center gap-2 px-6 py-3 border-2 border-border rounded-xl font-bold text-sm hover:bg-white hover:text-black hover:border-white disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" /> PREV
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="flex items-center gap-2 px-6 py-3 border-2 border-border rounded-xl font-bold text-sm hover:bg-white hover:text-black hover:border-white disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                            >
                                NEXT <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
