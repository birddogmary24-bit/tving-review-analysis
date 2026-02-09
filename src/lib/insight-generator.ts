import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalyzedReview, MonthlyInsight, InsightItem, ImprovementTask } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.0-flash";

export async function generateMonthlyInsight(
  month: string,
  allReviews: AnalyzedReview[]
): Promise<MonthlyInsight> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // 1. Get range dates
  const targetDate = new Date(month + "-01");

  // Last 6 months range
  const sixMonthsAgo = new Date(targetDate);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

  // Last 3 months range (for spikes)
  const threeMonthsAgo = new Date(targetDate);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);

  const formatMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const sixMonthsRange: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    sixMonthsRange.push(formatMonth(d));
  }

  const currentPeriod = sixMonthsRange.slice(3); // Last 3 months
  const previousPeriod = sixMonthsRange.slice(0, 3); // 3-6 months ago

  // 2. Filter reviews
  const relevantReviews = allReviews.filter(r => {
    const rMonth = r.date.substring(0, 7);
    return sixMonthsRange.includes(rMonth);
  });

  // 3. Prepare summary data for AI
  const stats: any = {
    total: relevantReviews.length,
    positive: relevantReviews.filter(r => r.score >= 3).length,
    negative: relevantReviews.filter(r => r.score < 3).length,
    subCategories: {}
  };

  relevantReviews.forEach(r => {
    const rMonth = r.date.substring(0, 7);
    const sub = r.subCategory || '미분류';
    if (!stats.subCategories[sub]) {
      stats.subCategories[sub] = { total: 0, positive: 0, negative: 0, months: {} };
    }
    stats.subCategories[sub].total++;
    if (r.score >= 3) stats.subCategories[sub].positive++;
    else stats.subCategories[sub].negative++;

    if (!stats.subCategories[sub].months[rMonth]) stats.subCategories[sub].months[rMonth] = 0;
    stats.subCategories[sub].months[rMonth]++;
  });

  // Identify Spikes (simple heuristic: frequency in current 3 months > 1.5x frequency in previous 3 months AND total count > 5)
  const spikes: string[] = [];
  Object.keys(stats.subCategories).forEach(sub => {
    const data = stats.subCategories[sub];
    let prevCount = 0;
    let currCount = 0;
    previousPeriod.forEach(m => prevCount += (data.months[m] || 0));
    currentPeriod.forEach(m => currCount += (data.months[m] || 0));

    if (currCount > prevCount * 1.5 && currCount > 5) {
      spikes.push(sub);
    }
  });

  // 4. Smart Sampling Algorithm (to minimize token usage and maximize insight)
  // - Group reviews by subCategory
  // - Pick top 3-5 most 'meaningful' reviews per subCategory
  // - Truncate long reviews to 150 chars
  const groupedSamples: Record<string, string[]> = {};
  const MAX_SAMPLES_PER_SUB = 5;
  const MAX_TEXT_LENGTH = 150;

  relevantReviews
    .sort((a, b) => b.date.localeCompare(a.date)) // Latest first
    .forEach(r => {
      const sub = r.subCategory || '미분류';
      if (!groupedSamples[sub]) groupedSamples[sub] = [];

      if (groupedSamples[sub].length < MAX_SAMPLES_PER_SUB) {
        // Remove redundant info, keep only relevant text
        let cleanText = r.text.replace(/\n/g, ' ').trim();
        if (cleanText.length > MAX_TEXT_LENGTH) {
          cleanText = cleanText.substring(0, MAX_TEXT_LENGTH) + "...";
        }
        groupedSamples[sub].push(`[${r.score}점] ${cleanText}`);
      }
    });

  // Flatten samples into a concise string
  const sampleReviews = Object.entries(groupedSamples)
    .map(([sub, texts]) => `## ${sub}\n${texts.join('\n')}`)
    .join('\n\n');

  const prompt = `
    당신은 티빙(TVING) 서비스 기획자이자 데이터 분석가입니다. 
    최근 6개월간의 사용자 리뷰 데이터를 바탕으로 인사이트 리포트를 작성해주세요.

    [대상 월]: ${month}
    [전체 통계]: 총 ${stats.total}건 (긍정 ${stats.positive}건, 부정 ${stats.negative}건)
    [세부 카테고리별 통계]: ${JSON.stringify(stats.subCategories)}
    [급증(Spike) 감지된 항목]: ${spikes.join(', ')}

    [최근 리뷰 샘플]:
    ${sampleReviews}

    [직무 라벨 리스트]: 개발, 기획/운영, 디자인, 고객서비스, 대외정책, 콘텐츠, 기타

    [요구사항]
    1. 전체적인 트렌드 요약 (summary)
    2. 긍정 인사이트 (positiveInsights): 주요 칭찬 요소 10개 내외. (데이터가 부족하면 가능한 많이 추출)
       - 각 항목별 개수(count), 심각도/강도(severity: low/medium/high), 급증 여부(isSpiked) 포함
       - jobLabels: 연관된 직무 라벨 1~5개
       - relatedSubCategories: 실제 리뷰 서브카테고리 이름 포함
    3. 부정 인사이트 (negativeInsights): 주요 불만 요소 10개 내외. (데이터가 부족하면 가능한 많이 추출)
       - 각 항목별 개수(count), 심각도/강도(severity: low/medium/high), 급증 여부(isSpiked) 포함
       - jobLabels: 연관된 직무 라벨 1~5개
       - relatedSubCategories: 실제 리뷰 서브카테고리 이름 포함
    4. 제안 기능/개선 과제 (tasks): 실행 가능한 Task 형식으로 5-7개 제안. 
       - 우선순위(priority: high/medium/low) 및 연관 직무 라벨(jobLabels) 포함.
       - prd: 각 태스크에 대한 상세 기획서 초안(PRD)을 아래 구조로 포함
         {
           "definition": "해결하려는 문제 및 기능 정의",
           "purpose": "이 기능을 통해 달성하고자 하는 목적",
           "expectedEffect": "성공 시 기대되는 효과 (정량적/정성적)",
           "keyFeatures": [
             "구체적으로 구현해야 할 핵심 기능 1 (예: 에러 발생 시 자동 재시도 로직)",
             "구체적으로 구현해야 할 핵심 기능 2 (예: 사용자 피드백 수집 팝업)",
             "구체적으로 구현해야 할 핵심 기능 3-5개"
           ],
           "roles": {
             "planning": "기획/운영팀에서 해야 할 일 (구체적 액션 아이템)",
             "development": "개발팀에서 해야 할 일 (구체적 기술 스택 및 구현 방향)",
             "design": "디자인팀에서 해야 할 일 (구체적 UI/UX 개선 방향)",
             "marketing": "마케팅팀에서 해야 할 일 (구체적 커뮤니케이션 전략)"
           }
         }

    [응답 형식]
    반드시 아래와 같은 JSON 구조로만 응답하세요. (불만과 칭찬을 가능한 10개씩 꽉 채워서 분석해주세요)
    {
      "summary": "...",
      "positiveInsights": [
        {
          "title": "요소 제목", 
          "description": "상세 분석 내용 (1-2문장)", 
          "count": 10, 
          "severity": "medium", 
          "sentiment": "positive", 
          "isSpiked": false,
          "jobLabels": ["기획/운영", "디자인"],
          "relatedSubCategories": ["오리지널 콘텐츠"]
        }
      ],
      "negativeInsights": [
        {
          "title": "요소 제목", 
          "description": "상세 분석 내용 (1-2문장)", 
          "count": 25, 
          "severity": "high", 
          "sentiment": "negative", 
          "isSpiked": true,
          "jobLabels": ["개발", "고객서비스"],
          "relatedSubCategories": ["플레이어 오류", "앱 안정성"]
        }
      ],
      "tasks": [
        {"title": "실행 과제 제목", "description": "상세 실행 가이드", "priority": "high", "jobLabels": ["개발"]}
      ]
    }
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    console.log("[Insight] Raw AI Response Type:", typeof text);

    // Clean up markdown code blocks if present
    if (text.includes('```')) {
      const matches = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (matches && matches[1]) {
        text = matches[1].trim();
      }
    }

    try {
      const aiResult = JSON.parse(text);

      return {
        month,
        summary: aiResult.summary || "분석이 완료되었습니다.",
        positiveInsights: aiResult.positiveInsights || [],
        negativeInsights: aiResult.negativeInsights || [],
        tasks: aiResult.tasks || [],
        generatedAt: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("[Insight] JSON Parse Error. Raw text snippet:", text.substring(0, 200));
      throw new Error(`JSON_PARSE_FAILED: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error("[Insight] Error generating insight with AI:", error);
    return {
      month,
      summary: `인사이트 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      positiveInsights: [],
      negativeInsights: [],
      tasks: [],
      generatedAt: new Date().toISOString()
    };
  }
}
