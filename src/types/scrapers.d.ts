declare module 'google-play-scraper' {
    const gplay: {
        reviews: (options: any) => Promise<{ data: any[] }>;
        sort: {
            NEWEST: number;
            RATING: number;
            HELPFULNESS: number;
        };
    };
    export default gplay;
}

declare module 'app-store-scraper' {
    const appStore: {
        reviews: (options: any) => Promise<any[]>;
        sort: {
            RECENT: number;
            HELPFUL: number;
        };
    };
    export default appStore;
}
