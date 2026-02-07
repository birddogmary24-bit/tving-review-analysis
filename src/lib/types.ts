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
export interface InsightItem {
    title: string;
    description: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
    sentiment: 'positive' | 'negative';
    isSpiked: boolean;
}

export interface ImprovementTask {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

export interface MonthlyInsight {
    month: string; // YYYY-MM
    summary: string;
    positiveInsights: InsightItem[];
    negativeInsights: InsightItem[];
    tasks: ImprovementTask[];
    generatedAt: string;
}
