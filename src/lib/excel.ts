import * as XLSX from 'xlsx';
import { AnalyzedReview, MonthlyStats } from './types';

export function generateExcelBuffer(reviews: AnalyzedReview[], stats: MonthlyStats[]) {
    const wb = XLSX.utils.book_new();

    // Stats Sheet
    const statsWS = XLSX.utils.json_to_sheet(stats.map(s => ({
        '월': s.month,
        '칭찬 리뷰': s.compliments,
        '불만 리뷰': s.complaints,
        '기타': s.others,
        '총계': s.total,
        '긍정 비율': `${Math.round((s.compliments / (s.total || 1)) * 100)}%`
    })));
    XLSX.utils.book_append_sheet(wb, statsWS, "월별 통계");

    // Sub-category Stats Sheet
    const subStats: Record<string, { count: number, main: string }> = {};
    reviews.forEach(r => {
        const key = `${r.category} > ${r.subCategory}`;
        if (!subStats[key]) subStats[key] = { count: 0, main: r.category };
        subStats[key].count++;
    });

    const subStatsWS = XLSX.utils.json_to_sheet(Object.entries(subStats).map(([key, data]) => ({
        '대분류': data.main,
        '세부사유': key.split(' > ')[1],
        '건수': data.count
    })).sort((a, b) => b.건수 - a.건수));
    XLSX.utils.book_append_sheet(wb, subStatsWS, "세부 사유별 통계");

    // Reviews Sheet
    const reviewsWS = XLSX.utils.json_to_sheet(reviews.map(r => ({
        '날짜': r.date,
        '스토어': r.store,
        '사용자': r.userName,
        '별점': r.score,
        '대분류': r.category,
        '세부사유': r.subCategory,
        '내용': r.text
    })));
    XLSX.utils.book_append_sheet(wb, reviewsWS, "전체 리뷰");

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
