import gplay from 'google-play-scraper';
import appStore from 'app-store-scraper';
import { Review } from './types';

export async function fetchGooglePlayReviews(appId: string = 'net.cj.cjhv.gs.tving', pages: number = 3): Promise<Review[]> {
    try {
        const reviews = await gplay.reviews({
            appId,
            sort: gplay.sort.NEWEST,
            num: pages * 100,
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

export async function fetchAppStoreReviews(id: string = '400101401', pages: number = 3): Promise<Review[]> {
    try {
        const reviews: any[] = [];
        for (let i = 1; i <= pages; i++) {
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
            // App Store scraper often returns 'updated' or 'date' depending on version
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
