import { fetchGooglePlayReviews, fetchAppStoreReviews } from '../src/lib/scrapers';
import { categorizeReviewsBatch } from '../src/lib/ai';
import { saveReviews } from '../src/lib/storage';

async function main() {
    console.log('--- Starting Full Data Sync ---');

    // 1. Scraping
    console.log('Step 1: Fetching reviews from stores...');
    const [gpReviews, asReviews] = await Promise.all([
        fetchGooglePlayReviews('net.cj.cjhv.gs.tving', 30),
        fetchAppStoreReviews('400101401', 10)
    ]);
    const allReviews = [...gpReviews, ...asReviews];
    console.log(`Fetched total ${allReviews.length} reviews.`);

    // 2. AI Analysis (with Pro and Batching)
    console.log('Step 2: AI Analysis (this will take a while due to rate limit pauses)...');
    const analyzed = await categorizeReviewsBatch(allReviews);
    console.log(`Analysis complete. Analyzed ${analyzed.length} reviews.`);

    // 3. Save to GCS
    console.log('Step 3: Saving to GCS...');
    await saveReviews(analyzed);
    console.log('--- Data Sync Complete! ---');
}

main().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});
