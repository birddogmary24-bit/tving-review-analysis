import gplay from 'google-play-scraper';
import appStore from 'app-store-scraper';
import { Review } from './types';

export async function fetchGooglePlayReviews(appId: string = 'net.cj.cjhv.gs.tving', pages: number = 20): Promise<Review[]> {
    try {
        const reviews = await gplay.reviews({
            appId,
            sort: gplay.sort.NEWEST,
            num: pages * 100, // Increase to fetch more (max per page is 100 in many scrapers)
            lang: 'ko',
            country: 'kr'
        });

        return reviews.data.map((r: any) => ({
            id: r.id,
            userName: r.userName,
            userImage: r.userImage,
            date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
            score: r.score,
            text: r.text,
            url: r.url,
            store: 'google-play'
        }));
    } catch (error) {
        console.error('Error fetching Google Play reviews:', error);
        return [];
    }
}

export async function fetchAppStoreReviews(id: string = '400101401', pages: number = 10): Promise<Review[]> {
    try {
        const reviews: any[] = [];
        // App Store scraper allows up to 10 pages maximum (500 reviews total per call usually)
        for (let i = 1; i <= Math.min(pages, 10); i++) {
            const pageReviews = await appStore.reviews({
                id,
                country: 'kr',
                sort: appStore.sort.RECENT,
                page: i
            });
            reviews.push(...pageReviews);
        }

        return reviews.map((r: any) => ({
            id: r.id,
            userName: r.userName,
            date: r.updated || r.date ? new Date(r.updated || r.date).toISOString() : new Date().toISOString(),
            score: r.score,
            title: r.title,
            text: r.text,
            store: 'app-store'
        }));
    } catch (error) {
        console.error('Error fetching App Store reviews:', error);
        return [];
    }
}
