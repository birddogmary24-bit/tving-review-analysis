export type StoreType = 'google-play' | 'app-store';

export interface Review {
    id: string;
    userName: string;
    userImage?: string;
    date: string;
    score: number;
    title?: string;
    text: string;
    url?: string;
    store: StoreType;
}

export type Category = '칭찬' | '불만' | '기타';

export interface AnalyzedReview extends Review {
    category: Category;
    subCategory: string;
    analysisDate: string;
}

export interface MonthlyStats {
    month: string; // YYYY-MM
    complaints: number;
    compliments: number;
    others: number;
    total: number;
}
