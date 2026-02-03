import { GoogleGenerativeAI } from "@google/generative-ai";
import { Review, AnalyzedReview, Category } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const SUB_CATEGORIES = {
    '불만': ['플레이어 오류', '광고 관련 불만', '요금 및 결제', '콘텐츠 부족', 'UI/UX 불편', '앱 안정성', '기타 불만'],
    '칭찬': ['오리지널 콘텐츠', '화질 및 재생 품질', 'UI 편리성', '콘텐츠 다양성', '합리적 가격', '광고 적절성', '기타 칭찬'],
    '기타': ['단순 문의', '기능 제안', '미분류']
};

export async function categorizeReview(review: Review): Promise<{ category: Category; subCategory: string }> {
    if (!process.env.GEMINI_API_KEY) {
        return { category: '기타', subCategory: '미분류' };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    당신은 티빙(TVING) 앱의 사용자 리뷰를 분석하는 전문가입니다.
    다음 리뷰를 분석하여 메인 카테고리와 세부 카테고리를 분류해주세요.
    
    반드시 아래에 정의된 세부 카테고리 목록 중에서만 선택해야 합니다.

    [리뷰 정보]
    - 별점: ${review.score}
    - 제목: ${review.title || '없음'}
    - 내용: ${review.text}

    [분류 가이드]
    1. 메인 카테고리: '칭찬', '불만', '기타' 중 하나
    2. 세부 카테고리 (반드시 아래 리스트에서 선택):
       - '불만'인 경우: ${SUB_CATEGORIES['불만'].join(', ')}
       - '칭찬'인 경우: ${SUB_CATEGORIES['칭찬'].join(', ')}
       - '기타'인 경우: ${SUB_CATEGORIES['기타'].join(', ')}

    응답은 반드시 JSON 형식으로만 해주세요. 
    예시: {"category": "불만", "subCategory": "플레이어 오류"}
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        if (text.includes('```json')) {
            text = text.split('```json')[1].split('```')[0].trim();
        } else if (text.includes('```')) {
            text = text.split('```')[1].split('```')[0].trim();
        }

        const json = JSON.parse(text);

        // Ensure the subCategory is one of the allowed ones
        const mainCat = json.category as Category;
        const allowedSubs = SUB_CATEGORIES[mainCat] || [];
        const finalSub = allowedSubs.includes(json.subCategory) ? json.subCategory : allowedSubs[allowedSubs.length - 1];

        return {
            category: mainCat,
            subCategory: finalSub
        };
    } catch (error) {
        console.error("AI categorization error:", error);
        return { category: '기타', subCategory: '분석오류' };
    }
}

export async function categorizeReviewsBatch(reviews: Review[]): Promise<AnalyzedReview[]> {
    const analyzed: AnalyzedReview[] = [];
    for (const review of reviews) {
        const { category, subCategory } = await categorizeReview(review);
        analyzed.push({
            ...review,
            category,
            subCategory,
            analysisDate: new Date().toISOString()
        });
    }
    return analyzed;
}
