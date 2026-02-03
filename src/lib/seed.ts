import { saveReviews } from './storage';
import { AnalyzedReview, Category, StoreType } from './types';
import { addDays } from 'date-fns';
import { SUB_CATEGORIES } from './ai';

export async function seedInitialData() {
    const reviews: AnalyzedReview[] = [];
    const stores: StoreType[] = ['google-play', 'app-store'];

    const sampleTexts: Record<string, string[]> = {
        '플레이어 오류': ["영상 재생 중에 자꾸 멈춰요.", "버퍼링이 너무 심해서 못 보겠네요.", "플레이어 컨트롤러가 잘 안 먹어요."],
        '광고 관련 불만': ["광고가 너무 많아요.", "무료 체험인데 광고가 왜 나오죠?", "중간광고 스킵이 안 돼서 불편해요."],
        '요금 및 결제': ["구독료가 너무 인상되었네요.", "결제했는데 반영이 안 됩니다.", "해지 절차가 너무 복잡해요."],
        '콘텐츠 부족': ["볼만한 영화가 별로 없어요.", "최신 드라마 업데이트가 늦네요."],
        'UI/UX 불편': ["검색 기능이 너무 구려요.", "메뉴 찾기가 너무 힘듭니다."],
        '앱 안정성': ["실행하자마자 앱이 꺼져요.", "로딩 화면에서 넘어가질 않네요."],
        '오리지널 콘텐츠': ["환승연애 역시 티빙 오리지널!", "흑백요리사 같은 거 많이 만들어주세요."],
        '화질 및 재생 품질': ["4K 화질 진짜 깔끔하네요.", "끊김 없이 고화질로 볼 수 있어 좋아요."],
        'UI 편리성': ["바뀐 UI가 훨씬 직관적입니다.", "메뉴가 깔끔해서 보기 좋아요."],
        '콘텐츠 다양성': ["해외 축구 중계까지 해줘서 너무 좋아요.", "드라마 예능 다 많아서 좋아요."],
        '합리적 가격': ["연간 회원권 행사해서 싸게 샀네요.", "가성비 최고입니다."],
        '광고 적절성': ["광고 모델이 제가 좋아하는 분이라 좋네요.", "광고 위치가 거슬리지 않아요."]
    };

    const startDate = new Date(2025, 0, 1);
    const totalTarget = 3300;
    const perMonth = Math.floor(totalTarget / 13);

    for (let m = 0; m <= 12; m++) {
        const currentMonth = addDays(startDate, m * 30);
        for (let i = 0; i < perMonth; i++) {
            const rand = Math.random();
            let category: Category = '칭찬';
            let subCategory = '';
            let text = "";

            if (rand < 0.45) { // Increase complaint ratio slightly for demo
                category = '불만';
                const subs = SUB_CATEGORIES['불만'];
                subCategory = subs[Math.floor(Math.random() * (subs.length - 1))]; // avoid '기타'
                const texts = sampleTexts[subCategory] || ["문제가 좀 있네요."];
                text = texts[Math.floor(Math.random() * texts.length)];
            } else if (rand < 0.90) {
                category = '칭찬';
                const subs = SUB_CATEGORIES['칭찬'];
                subCategory = subs[Math.floor(Math.random() * (subs.length - 1))];
                const texts = sampleTexts[subCategory] || ["정말 좋아요!"];
                text = texts[Math.floor(Math.random() * texts.length)];
            } else {
                category = '기타';
                const subs = SUB_CATEGORIES['기타'];
                subCategory = subs[0];
                text = "리뷰는 생략합니다.";
            }

            reviews.push({
                id: `seed-v3-${m}-${i}`,
                userName: `Reviewer_${m}_${i}`,
                date: addDays(currentMonth, Math.floor(Math.random() * 28)).toISOString(),
                score: category === '칭찬' ? 5 : (category === '불만' ? 1 : 3),
                text,
                store: stores[Math.floor(Math.random() * 2)],
                category,
                subCategory,
                analysisDate: new Date().toISOString()
            });
        }
    }

    while (reviews.length < totalTarget) {
        reviews.push({ ...reviews[0], id: `seed-extra-v3-${reviews.length}` });
    }

    await saveReviews(reviews);
}
