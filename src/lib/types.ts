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
    jobLabels: string[]; // 개발, 기획/운영, 디자인, 고객서비스, 대외정책, 콘텐츠, 기타
    relatedSubCategories: string[]; // 연관된 리뷰 서브카테고리 리스트
}

export interface ImprovementTask {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    jobLabels: string[];
    prd?: {
        definition: string;
        purpose: string;
        expectedEffect: string;
        keyFeatures: string[];
        roles: {
            planning?: string;
            development?: string;
            design?: string;
            marketing?: string;
        };
    };
}

export interface MonthlyInsight {
    month: string; // YYYY-MM
    summary: string;
    positiveInsights: InsightItem[];
    negativeInsights: InsightItem[];
    tasks: ImprovementTask[];
    generatedAt: string;
}
