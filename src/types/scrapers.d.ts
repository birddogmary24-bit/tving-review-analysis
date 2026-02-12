declare module 'app-store-scraper' {
  const appStore: {
    reviews: (options: {
      id: string;
      country?: string;
      sort?: number;
      page?: number;
    }) => Promise<any[]>;
    sort: {
      RECENT: number;
      HELPFUL: number;
    };
  };
  export default appStore;
}

declare module 'google-play-scraper' {
  const gplay: {
    reviews: (options: {
      appId: string;
      sort?: number;
      num?: number;
      lang?: string;
      country?: string;
    }) => Promise<{ data: any[] }>;
    sort: {
      NEWEST: number;
      RATING: number;
      HELPFULNESS: number;
    };
  };
  export default gplay;
}
