import gplay from 'google-play-scraper';
import appStore from 'app-store-scraper';
import { Review } from './types';

export async function fetchGooglePlayReviews(
  appId: string,
  pages: number = 15
): Promise<Review[]> {
  try {
    const reviews = await gplay.reviews({
      appId,
      sort: gplay.sort.NEWEST,
      num: pages * 100,
      lang: 'ko',
      country: 'kr',
    });

    return reviews.data.map((r: any) => ({
      id: r.id,
      userName: r.userName,
      userImage: r.userImage,
      date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
      score: r.score,
      text: r.text || '',
      url: r.url,
      store: 'google-play' as const,
    }));
  } catch (error) {
    console.error(`[Scraper] Google Play error for ${appId}:`, error);
    return [];
  }
}

export async function fetchAppStoreReviews(
  id: string,
  pages: number = 10
): Promise<Review[]> {
  try {
    const reviews: any[] = [];
    for (let i = 1; i <= Math.min(pages, 10); i++) {
      const pageReviews = await appStore.reviews({
        id,
        country: 'kr',
        sort: appStore.sort.RECENT,
        page: i,
      });
      reviews.push(...pageReviews);
    }

    return reviews.map((r: any) => ({
      id: String(r.id),
      userName: r.userName,
      date: r.updated || r.date
        ? new Date(r.updated || r.date).toISOString()
        : new Date().toISOString(),
      score: r.score,
      title: r.title,
      text: r.text || '',
      store: 'app-store' as const,
    }));
  } catch (error) {
    console.error(`[Scraper] App Store error for ${id}:`, error);
    return [];
  }
}
