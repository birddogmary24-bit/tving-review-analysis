import { fetchGooglePlayReviews, fetchAppStoreReviews } from '../src/lib/scrapers';
import { categorizeReviewsBatch } from '../src/lib/ai';
import { saveReviews } from '../src/lib/storage';

async function main() {
    console.log('--- Starting Full Data Sync ---');

    // 1. Scraping (Increased for 10k goal)
    console.log('Step 1: Fetching reviews from stores (Expanded for 10k push)...');
    const [gpReviews, asReviews] = await Promise.all([
        fetchGooglePlayReviews('net.cj.cjhv.gs.tving', 80), // ~8000 reviews
        fetchAppStoreReviews('400101401', 10)         // ~500 reviews
    ]);
    const allReviews = [...gpReviews, ...asReviews];
    console.log(`Fetched total ${allReviews.length} reviews.`);

    // 2. AI Analysis (with Pro and Batching)
    console.log('Step 2: AI Analysis (this will take a while due to rate limit pauses)...');
    const analyzed = await categorizeReviewsBatch(allReviews);
    console.log(`Analysis complete. Analyzed ${analyzed.length} reviews.`);

    // 2.5 Local Backup (Safety first)
    const fs = require('fs/promises');
    const path = require('path');
    const backupDir = path.join(process.cwd(), 'data');
    await fs.mkdir(backupDir, { recursive: true });
    await fs.writeFile(path.join(backupDir, 'reviews.json'), JSON.stringify(analyzed, null, 2));
    await fs.writeFile(path.join(backupDir, 'status.json'), JSON.stringify({ lastUpdate: new Date().toISOString() }));
    console.log('Step 2.5: Local backup saved to data/reviews.json and data/status.json');

    // 3. Save to GCS
    console.log('Step 3: Saving to GCS via gcloud CLI...');
    const { execSync } = require('child_process');
    try {
        const bucket = process.env.GCS_BUCKET_NAME;
        if (bucket) {
            execSync(`gcloud storage cp data/reviews.json gs://${bucket}/reviews.json`, { stdio: 'inherit' });
            execSync(`gcloud storage cp data/status.json gs://${bucket}/status.json`, { stdio: 'inherit' });
            console.log('Step 3: GCS upload via CLI successful.');
        } else {
            console.log('Step 3: GCS_BUCKET_NAME not set, skipping upload.');
        }
    } catch (gcsError) {
        console.error('Step 3 Failed: Gcloud upload error.', gcsError);
    }
    console.log('--- Data Sync Complete! ---');
}

main().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});
