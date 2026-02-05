import { GoogleGenerativeAI } from "@google/generative-ai";
import { Review, AnalyzedReview, Category } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const SUB_CATEGORIES = {
    '불만': ['플레이어 오류', '광고 관련 불만', '요금 및 결제', '콘텐츠 부족', 'UI/UX 불편', '앱 안정성', '기타 불만'],
    '칭찬': ['오리지널 콘텐츠', '화질 및 재생 품질', 'UI 편리성', '콘텐츠 다양성', '합리적 가격', '광고 적절성', '기타 칭찬'],
    '기타': ['단순 문의', '기능 제안', '미분류']
};

/**
 * AI 모델 설정: Gemini 1.5 Pro 사용 (무료 티어 한도 준수를 위해 묶음 분석 필수)
 */
const MODEL_NAME = "gemini-2.5-pro";

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function categorizeReviewsBatch(reviews: Review[]): Promise<AnalyzedReview[]> {
    if (!process.env.GEMINI_API_KEY) {
        return reviews.map(r => {
            const category: Category = r.score >= 3 ? '칭찬' : '불만';
            return { ...r, category, subCategory: '미분류', analysisDate: new Date().toISOString() };
        });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const BATCH_SIZE = 50;
    const analyzed: AnalyzedReview[] = [];

    console.log(`[AI] Starting batch analysis for ${reviews.length} reviews using ${MODEL_NAME}...`);

    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
        const chunk = reviews.slice(i, i + BATCH_SIZE);

        if (i > 0) {
            console.log(`[AI] Waiting to respect Free Tier rate limits...`);
            await delay(35000);
        }

        const prompt = `
        당신은 티빙(TVING) 앱 리뷰 분석 전문가입니다. 아래 ${chunk.length}개의 서비스 리뷰를 분석하여 세부 사유를 분류해주세요.
        
        [대원칙]
        - 별점 3, 4, 5점: 무조건 '칭찬'으로 분류함.
        - 별점 1, 2점: 무조건 '불만'으로 분류함.
        
        [세부 사유 리스트]
        - 칭찬(3점 이상): ${SUB_CATEGORIES['칭찬'].join(', ')}
        - 불만(2점 이하): ${SUB_CATEGORIES['불만'].join(', ')}
        - 기타: ${SUB_CATEGORIES['기타'].join(', ')}

        [리뷰 목록]
        ${chunk.map((r, idx) => `ID: ${idx}, 별점: ${r.score}, 내용: ${r.text}`).join('\n')}

        [응답 형식]
        반드시 아래와 같은 JSON 배열 형식으로만 응답하세요.
        [
          {"id": 0, "category": "불만", "subCategory": "플레이어 오류"},
          {"id": 1, "category": "칭찬", "subCategory": "오리지널 콘텐츠"}
        ]
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            if (text.includes('```json')) text = text.split('```json')[1].split('```')[0].trim();
            else if (text.includes('```')) text = text.split('```')[1].split('```')[0].trim();

            const results = JSON.parse(text);

            chunk.forEach((review, idx) => {
                const res = results.find((r: any) => r.id === idx) || { category: '', subCategory: '미분류' };

                // 별점에 따른 카테고리 강제 교정 (사용자 요청: 3점 이상은 칭찬, 1~2점은 불만)
                const finalCategory: Category = review.score >= 3 ? '칭찬' : '불만';

                // 세부 카테고리가 해당 메인 카테고리에 속하는지 검증
                const allowedSubs = SUB_CATEGORIES[finalCategory];
                const finalSub = allowedSubs.includes(res.subCategory) ? res.subCategory : allowedSubs[allowedSubs.length - 1];

                analyzed.push({
                    ...review,
                    category: finalCategory,
                    subCategory: finalSub,
                    analysisDate: new Date().toISOString()
                });
            });

            console.log(`[AI] Processed ${analyzed.length}/${reviews.length} reviews...`);
        } catch (error) {
            console.error(`[AI] Error processing chunk at ${i}:`, error);
            chunk.forEach(review => {
                analyzed.push({
                    ...review,
                    category: review.score >= 3 ? '칭찬' : '불만',
                    subCategory: '분석오류',
                    analysisDate: new Date().toISOString()
                });
            });
        }
    }

    return analyzed;
}
