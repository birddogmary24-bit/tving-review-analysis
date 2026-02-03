import { GoogleGenerativeAI } from "@google/generative-ai";
import { Review, AnalyzedReview, Category } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function categorizeReview(review: Review): Promise<{ category: Category; subCategory: string }> {
    if (!process.env.GEMINI_API_KEY) {
        return { category: '기타', subCategory: '미분류' };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    당신은 티빙(TVING) 앱의 사용자 리뷰를 분석하는 전문가입니다.
    다음 리뷰를 분석하여 메인 카테고리와 세부 카테고리를 분류해주세요.

    [리뷰 정보]
    - 별점: ${review.score}
    - 제목: ${review.title || '없음'}
    - 내용: ${review.text}

    [분류 가이드]
    1. 메인 카테고리: '칭찬', '불만', '기타' 중 하나
    2. 세부 카테고리 (하위 레벨):
       - 불만 선택 시: '버그/오류', '콘텐츠부족', '요금/결제', 'UI설계', '재생품질', '광고불편', '검색불편', '기타불만'
       - 칭찬 선택 시: '오리지널', 'UI편리', '화질/음질', '가격만족', '서비스다양성', '광고적절', '기타칭찬'
       - 기타 선택 시: '단순문의', '기능제안', '미분류'

    응답은 반드시 JSON 형식으로만 해주세요. 예시: {"category": "불만", "subCategory": "버그/오류"}
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // JSON 추출 (Markdown backticks 처리)
        if (text.includes('```json')) {
            text = text.split('```json')[1].split('```')[0].trim();
        } else if (text.includes('```')) {
            text = text.split('```')[1].split('```')[0].trim();
        }

        const json = JSON.parse(text);
        return {
            category: json.category as Category,
            subCategory: json.subCategory
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
