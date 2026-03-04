import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalyzedReview, MonthlyInsight } from "./types";
import { getAppById } from "./apps";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.0-flash-lite";

export async function generateMonthlyInsight(
  month: string,
  allReviews: AnalyzedReview[],
  appId: string
): Promise<MonthlyInsight> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const app = getAppById(appId);
  const appName = app?.name || appId;

  // 1. Get range dates
  const targetDate = new Date(month + "-01");
  const sixMonthsAgo = new Date(targetDate);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const threeMonthsAgo = new Date(targetDate);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);

  const formatMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const sixMonthsRange: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    sixMonthsRange.push(formatMonth(d));
  }

  const currentPeriod = sixMonthsRange.slice(3);
  const previousPeriod = sixMonthsRange.slice(0, 3);

  // 2. Filter reviews
  const relevantReviews = allReviews.filter(r => {
    const rMonth = r.date.substring(0, 7);
    return sixMonthsRange.includes(rMonth);
  });

  // 3. Prepare summary data
  const stats: Record<string, unknown> = {
    total: relevantReviews.length,
    positive: relevantReviews.filter(r => r.score >= 3).length,
    negative: relevantReviews.filter(r => r.score < 3).length,
    subCategories: {} as Record<string, { total: number; positive: number; negative: number; months: Record<string, number> }>
  };

  const subCats = stats.subCategories as Record<string, { total: number; positive: number; negative: number; months: Record<string, number> }>;
  relevantReviews.forEach(r => {
    const rMonth = r.date.substring(0, 7);
    const sub = r.subCategory || '미분류';
    if (!subCats[sub]) {
      subCats[sub] = { total: 0, positive: 0, negative: 0, months: {} };
    }
    subCats[sub].total++;
    if (r.score >= 3) subCats[sub].positive++;
    else subCats[sub].negative++;
    if (!subCats[sub].months[rMonth]) subCats[sub].months[rMonth] = 0;
    subCats[sub].months[rMonth]++;
  });

  // Identify Spikes
  const spikes: string[] = [];
  Object.keys(subCats).forEach(sub => {
    const data = subCats[sub];
    let prevCount = 0;
    let currCount = 0;
    previousPeriod.forEach(m => prevCount += (data.months[m] || 0));
    currentPeriod.forEach(m => currCount += (data.months[m] || 0));
    if (currCount > prevCount * 1.5 && currCount > 5) {
      spikes.push(sub);
    }
  });

  // 4. Smart Sampling
  const groupedSamples: Record<string, string[]> = {};
  const MAX_SAMPLES_PER_SUB = 5;
  const MAX_TEXT_LENGTH = 150;

  relevantReviews
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach(r => {
      const sub = r.subCategory || '미분류';
      if (!groupedSamples[sub]) groupedSamples[sub] = [];
      if (groupedSamples[sub].length < MAX_SAMPLES_PER_SUB) {
        let cleanText = r.text.replace(/\n/g, ' ').trim();
        if (cleanText.length > MAX_TEXT_LENGTH) {
          cleanText = cleanText.substring(0, MAX_TEXT_LENGTH) + "...";
        }
        groupedSamples[sub].push(`[${r.score}점] ${cleanText}`);
      }
    });

  const sampleReviews = Object.entries(groupedSamples)
    .map(([sub, texts]) => `## ${sub}\n${texts.join('\n')}`)
    .join('\n\n');

  const prompt = `
    당신은 ${appName} OTT 서비스 기획자이자 데이터 분석가입니다.
    최근 6개월간의 사용자 리뷰 데이터를 바탕으로 인사이트 리포트를 작성해주세요.

    [대상 월]: ${month}
    [전체 통계]: 총 ${stats.total}건 (긍정 ${stats.positive}건, 부정 ${stats.negative}건)
    [세부 카테고리별 통계]: ${JSON.stringify(subCats)}
    [급증(Spike) 감지된 항목]: ${spikes.join(', ')}

    [최근 리뷰 샘플]:
    ${sampleReviews}

    [직무 라벨 리스트]: 개발, 기획/운영, 디자인, 고객서비스, 대외정책, 콘텐츠, 기타

    [요구사항]
    1. 전체적인 트렌드 요약 (summary)
    2. 긍정 인사이트 (positiveInsights): 주요 칭찬 요소 10개 내외
       - 각 항목별 개수(count), 심각도(severity: low/medium/high), 급증 여부(isSpiked) 포함
       - jobLabels: 연관된 직무 라벨 1~5개
       - relatedSubCategories: 실제 리뷰 서브카테고리 이름 포함
    3. 부정 인사이트 (negativeInsights): 주요 불만 요소 10개 내외
       - 각 항목별 개수(count), 심각도(severity: low/medium/high), 급증 여부(isSpiked) 포함
       - jobLabels: 연관된 직무 라벨 1~5개
       - relatedSubCategories: 실제 리뷰 서브카테고리 이름 포함
    4. 제안 기능/개선 과제 (tasks): 5-7개
       - 우선순위(priority: high/medium/low) 및 연관 직무 라벨(jobLabels) 포함
       - prd: 상세 기획서 초안(PRD)
         {
           "definition": "해결하려는 문제 및 기능 정의",
           "purpose": "이 기능을 통해 달성하고자 하는 목적",
           "expectedEffect": "기대 효과",
           "keyFeatures": ["핵심 기능 1", "핵심 기능 2", "핵심 기능 3"],
           "roles": {
             "planning": "기획/운영팀 액션",
             "development": "개발팀 액션",
             "design": "디자인팀 액션",
             "marketing": "마케팅팀 액션"
           }
         }

    [응답 형식]
    반드시 JSON으로만 응답하세요.
    {
      "summary": "...",
      "positiveInsights": [{"title":"","description":"","count":0,"severity":"medium","sentiment":"positive","isSpiked":false,"jobLabels":[],"relatedSubCategories":[]}],
      "negativeInsights": [{"title":"","description":"","count":0,"severity":"high","sentiment":"negative","isSpiked":false,"jobLabels":[],"relatedSubCategories":[]}],
      "tasks": [{"title":"","description":"","priority":"high","jobLabels":[],"prd":{}}]
    }
    `;

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      if (text.includes('```')) {
        const matches = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (matches && matches[1]) {
          text = matches[1].trim();
        }
      }

      const aiResult = JSON.parse(text);

      return {
        month,
        summary: aiResult.summary || "분석이 완료되었습니다.",
        positiveInsights: aiResult.positiveInsights || [],
        negativeInsights: aiResult.negativeInsights || [],
        tasks: aiResult.tasks || [],
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      const isRetryable = error instanceof Error && (error.message.includes('429') || error.message.includes('Resource exhausted'));
      console.warn(`[Insight] Error for ${appName}:`, error instanceof Error ? error.message : error);

      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = attempt * 15000;
        console.log(`[Insight] Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return {
        month,
        summary: `인사이트 생성 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        positiveInsights: [],
        negativeInsights: [],
        tasks: [],
        generatedAt: new Date().toISOString()
      };
    }
  }

  return {
    month,
    summary: "인사이트 생성에 실패했습니다.",
    positiveInsights: [],
    negativeInsights: [],
    tasks: [],
    generatedAt: new Date().toISOString()
  };
}
