import { saveReviews } from './storage';
import { AnalyzedReview, Category, StoreType } from './types';
import { addDays } from 'date-fns';

export async function seedInitialData() {
    const reviews: AnalyzedReview[] = [];
    const stores: StoreType[] = ['google-play', 'app-store'];

    const complaintTypes = [
        { sub: '버그/오류', texts: ["앱이 자꾸 튕겨요.", "실행 중 멈춤 현상이 있어요."] },
        { sub: '요금/결제', texts: ["넘 비싸요.", "결제가 안 됩니다."] },
        { sub: 'UI설계', texts: ["버튼이 너무 작아요.", "찾기가 힘드네요."] },
        { sub: '재생품질', texts: ["자꾸 끊깁니다.", "화질이 구려요."] },
        { sub: '광고불편', texts: ["광고가 너무 자주 나와요.", "중간광고 때문에 흐름이 끊깁니다."] }
    ];

    const complimentTypes = [
        { sub: '오리지널', texts: ["오리지널 예능 진짜 대박!", "환승연애 보러 왔어요."] },
        { sub: 'UI편리', texts: ["UI가 정말 빨라졌네요.", "깔끔해서 보기 좋습니다."] },
        { sub: '화질/음질', texts: ["화질이 너무 깨끗해요.", "역시 티빙!"] },
        { sub: '광고적절', texts: ["광고가 세련되서 볼만하네요.", "광고 모델이 좋네요."] }
    ];

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

            if (rand < 0.35) {
                category = '불만';
                const type = complaintTypes[Math.floor(Math.random() * complaintTypes.length)];
                subCategory = type.sub;
                text = type.texts[Math.floor(Math.random() * type.texts.length)];
            } else if (rand < 0.85) {
                category = '칭찬';
                const type = complimentTypes[Math.floor(Math.random() * complimentTypes.length)];
                subCategory = type.sub;
                text = type.texts[Math.floor(Math.random() * type.texts.length)];
            } else {
                category = '기타';
                subCategory = '미분류';
                text = "리뷰는 생략합니다.";
            }

            reviews.push({
                id: `seed-fin-${m}-${i}`,
                userName: `User_${m}_${i}`,
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
        reviews.push({ ...reviews[0], id: `seed-last-${reviews.length}` });
    }

    await saveReviews(reviews);
}
