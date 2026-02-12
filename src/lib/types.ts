export type StoreType = 'google-play' | 'app-store';

export type Category = '칭찬' | '불만' | '기타';

export interface OttApp {
  id: string;           // slug: 'tving', 'netflix', etc.
  name: string;         // display name
  googlePlayId: string;
  appStoreId: string;
  color: string;        // brand color for charts
  icon: string;         // emoji or icon identifier
}

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

export interface AnalyzedReview extends Review {
  appId: string;        // which OTT app this belongs to
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
  jobLabels: string[];
  relatedSubCategories: string[];
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

export interface AppComparisonData {
  appId: string;
  appName: string;
  totalReviews: number;
  avgScore: number;
  positiveRatio: number;
  negativeRatio: number;
  monthlyStats: MonthlyStats[];
  topComplaints: { subCategory: string; count: number }[];
  topCompliments: { subCategory: string; count: number }[];
  categoryBreakdown: Record<string, number>; // subCategory → count
}
