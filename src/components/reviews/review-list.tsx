'use client';

import { useState, useMemo } from 'react';
import { AnalyzedReview } from '@/lib/types';
import { Search, Download } from 'lucide-react';

interface ReviewListClientProps {
  reviews: AnalyzedReview[];
  appId: string;
  subCategories: string[];
}

export function ReviewListClient({ reviews, appId, subCategories }: ReviewListClientProps) {
  const [category, setCategory] = useState<string>('all');
  const [subCategory, setSubCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 30;

  const filtered = useMemo(() => {
    let result = [...reviews];

    if (category !== 'all') result = result.filter(r => r.category === category);
    if (subCategory !== 'all') result = result.filter(r => r.subCategory === subCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.text.toLowerCase().includes(q));
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [reviews, category, subCategory, search]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const totalPages = Math.ceil(filtered.length / LIMIT);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">전체 분류</option>
          <option value="칭찬">칭찬</option>
          <option value="불만">불만</option>
          <option value="기타">기타</option>
        </select>

        <select
          value={subCategory}
          onChange={e => { setSubCategory(e.target.value); setPage(1); }}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">전체 세부사유</option>
          {subCategories.map(sc => (
            <option key={sc} value={sc}>{sc}</option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="리뷰 내용 검색..."
            className="w-full bg-secondary border border-border rounded-lg pl-10 pr-3 py-2 text-sm"
          />
        </div>

        <a
          href={`/api/${appId}/export`}
          className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-sm hover:bg-muted transition-colors"
        >
          <Download className="w-4 h-4" />
          Excel
        </a>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length.toLocaleString()}건 검색됨</p>

      {/* Review list */}
      <div className="space-y-3">
        {paginated.map(r => (
          <div
            key={`${r.store}-${r.id}`}
            className="bg-card border border-border rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-yellow-500 text-sm">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.date).toLocaleDateString('ko-KR')}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                    r.store === 'google-play'
                      ? 'bg-blue-900/40 text-blue-400'
                      : 'bg-gray-700/40 text-gray-400'
                  }`}
                >
                  {r.store === 'google-play' ? 'PLAY' : 'APPLE'}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold ${
                  r.score >= 3 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}
              >
                {r.subCategory}
              </span>
            </div>
            <p className="text-base leading-relaxed text-foreground/90">{r.text}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-secondary rounded text-sm disabled:opacity-30"
          >
            이전
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-secondary rounded text-sm disabled:opacity-30"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
