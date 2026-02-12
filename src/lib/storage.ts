import fs from 'fs/promises';
import path from 'path';
import { Storage } from '@google-cloud/storage';
import { AnalyzedReview, MonthlyStats, MonthlyInsight } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const bucketName = process.env.GCS_BUCKET_NAME;
const storage = new Storage();

function isProduction() {
  return process.env.NODE_ENV === 'production' && !!bucketName;
}

// --- File path helpers (per-app data isolation) ---

function localPath(appId: string, filename: string) {
  return path.join(DATA_DIR, appId, filename);
}

function gcsPath(appId: string, filename: string) {
  return `${appId}/${filename}`;
}

async function readJSON<T>(appId: string, filename: string, fallback: T): Promise<T> {
  try {
    if (isProduction()) {
      const bucket = storage.bucket(bucketName!);
      const [content] = await bucket.file(gcsPath(appId, filename)).download();
      return JSON.parse(content.toString());
    } else {
      const data = await fs.readFile(localPath(appId, filename), 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    return fallback;
  }
}

async function writeJSON(appId: string, filename: string, data: unknown): Promise<void> {
  if (isProduction()) {
    const bucket = storage.bucket(bucketName!);
    await bucket.file(gcsPath(appId, filename)).save(JSON.stringify(data));
  } else {
    const dir = path.join(DATA_DIR, appId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), JSON.stringify(data, null, 2));
  }
}

// --- Reviews ---

export async function loadReviews(appId: string): Promise<AnalyzedReview[]> {
  return readJSON<AnalyzedReview[]>(appId, 'reviews.json', []);
}

export async function saveReviews(appId: string, reviews: AnalyzedReview[]): Promise<{ newCount: number }> {
  const existing = await loadReviews(appId);
  const existingIds = new Set(existing.map(r => `${r.store}-${r.id}`));
  const newReviews = reviews.filter(r => !existingIds.has(`${r.store}-${r.id}`));

  const allReviews = [...existing, ...newReviews];
  await writeJSON(appId, 'reviews.json', allReviews);
  await writeJSON(appId, 'status.json', { lastUpdate: new Date().toISOString() });

  return { newCount: newReviews.length };
}

// --- Stats ---

export async function getMonthlyStats(appId: string): Promise<MonthlyStats[]> {
  const reviews = await loadReviews(appId);
  const statsMap: Record<string, MonthlyStats> = {};

  reviews.forEach(r => {
    const month = r.date.substring(0, 7);
    if (!statsMap[month]) {
      statsMap[month] = { month, complaints: 0, compliments: 0, others: 0, total: 0 };
    }
    statsMap[month].total++;
    if (r.score >= 3) statsMap[month].compliments++;
    else statsMap[month].complaints++;
  });

  return Object.values(statsMap).sort((a, b) => b.month.localeCompare(a.month));
}

// --- Status ---

export async function getLastUpdateTimestamp(appId: string): Promise<string | null> {
  const status = await readJSON<{ lastUpdate?: string }>(appId, 'status.json', {});
  return status.lastUpdate || null;
}

export async function canUpdateToday(appId: string): Promise<{ canUpdate: boolean; lastUpdate: string | null }> {
  const lastUpdate = await getLastUpdateTimestamp(appId);
  if (!lastUpdate) return { canUpdate: true, lastUpdate: null };

  const last = new Date(lastUpdate);
  const now = new Date();
  const isSameDay =
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate();

  return { canUpdate: !isSameDay, lastUpdate };
}

// --- Insights ---

export async function loadInsights(appId: string): Promise<MonthlyInsight[]> {
  return readJSON<MonthlyInsight[]>(appId, 'insights.json', []);
}

export async function saveInsights(appId: string, insights: MonthlyInsight[]): Promise<void> {
  await writeJSON(appId, 'insights.json', insights);
}
