import fs from 'fs/promises';
import path from 'path';
import { Storage } from '@google-cloud/storage';
import { AnalyzedReview, MonthlyStats, MonthlyInsight } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const STATUS_FILE = path.join(DATA_DIR, 'status.json');
const INSIGHTS_FILE = path.join(DATA_DIR, 'insights.json');

// GCS Setting
const bucketName = process.env.GCS_BUCKET_NAME;
const storage = new Storage();

async function isProduction() {
    return process.env.NODE_ENV === 'production' && !!bucketName;
}

export async function saveReviews(reviews: AnalyzedReview[]): Promise<void> {
    let existing = await loadReviews();

    const existingIds = new Set(existing.map(r => `${r.store}-${r.id}`));
    const newReviews = reviews.filter(r => !existingIds.has(`${r.store}-${r.id}`));

    const allReviews = [...existing, ...newReviews];
    const status = { lastUpdate: new Date().toISOString() };

    if (await isProduction()) {
        const bucket = storage.bucket(bucketName!);
        await bucket.file('reviews.json').save(JSON.stringify(allReviews));
        await bucket.file('status.json').save(JSON.stringify(status));
    } else {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(REVIEWS_FILE, JSON.stringify(allReviews, null, 2));
        await fs.writeFile(STATUS_FILE, JSON.stringify(status));
    }
}

export async function loadReviews(): Promise<AnalyzedReview[]> {
    try {
        if (await isProduction()) {
            const bucket = storage.bucket(bucketName!);
            const [content] = await bucket.file('reviews.json').download();
            return JSON.parse(content.toString());
        } else {
            const data = await fs.readFile(REVIEWS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        return [];
    }
}

export async function getLastUpdateTimestamp(): Promise<string | null> {
    try {
        if (await isProduction()) {
            const bucket = storage.bucket(bucketName!);
            const [content] = await bucket.file('status.json').download();
            return JSON.parse(content.toString()).lastUpdate;
        } else {
            const data = await fs.readFile(STATUS_FILE, 'utf-8');
            return JSON.parse(data).lastUpdate;
        }
    } catch (e) {
        return null;
    }
}

export async function canUpdateToday(): Promise<{ canUpdate: boolean; lastUpdate: string | null }> {
    const lastUpdate = await getLastUpdateTimestamp();
    if (!lastUpdate) return { canUpdate: true, lastUpdate: null };

    const last = new Date(lastUpdate);
    const now = new Date();

    const isSameDay = last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate();

    return { canUpdate: !isSameDay, lastUpdate };
}

export async function getMonthlyStats(): Promise<MonthlyStats[]> {
    const reviews = await loadReviews();
    const statsMap: Record<string, MonthlyStats> = {};

    reviews.forEach(r => {
        const month = r.date.substring(0, 7);
        if (!statsMap[month]) {
            statsMap[month] = { month, complaints: 0, compliments: 0, others: 0, total: 0 };
        }
        statsMap[month].total++;

        // 사용자 요청 기준: 3점 이상 칭찬(긍정), 2점 이하 불만(부정)
        // r.category가 이미 저장되어 있더라도, UI 정합성을 위해 별점 기준으로 재지계함
        if (r.score >= 3) {
            statsMap[month].compliments++;
        } else {
            statsMap[month].complaints++;
        }
    });

    return Object.values(statsMap).sort((a, b) => b.month.localeCompare(a.month));
}

export async function saveInsights(insights: MonthlyInsight[]): Promise<void> {
    if (await isProduction()) {
        const bucket = storage.bucket(bucketName!);
        await bucket.file('insights.json').save(JSON.stringify(insights));
    } else {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(INSIGHTS_FILE, JSON.stringify(insights, null, 2));
    }
}

export async function loadInsights(): Promise<MonthlyInsight[]> {
    try {
        if (await isProduction()) {
            const bucket = storage.bucket(bucketName!);
            const [content] = await bucket.file('insights.json').download();
            return JSON.parse(content.toString());
        } else {
            const data = await fs.readFile(INSIGHTS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        return [];
    }
}
