# TVING 리뷰 분석 시스템

티빙(TVING) 앱의 구글 플레이 및 앱스토어 리뷰를 자동으로 수집하고, Gemini AI를 통해 리뷰를 분석하여 칭찬/불만 카테고리로 분류하는 시스템입니다.

## 주요 기능
- **자동 수집**: 매월 정기적으로 리뷰를 수집하여 저장소에 기록합니다.
- **AI 감성 분석**: 구글 Gemini를 사용하여 리뷰 내용을 '칭찬', '불만', '기타'로 자동 분류합니다.
- **데이터 시각화**: Tving.com 스타일의 다크 테마 대시보드를 통해 월별 통계를 확인합니다.
- **엑셀 내보내기**: 전체 리뷰와 통계 데이터를 엑셀 파일로 다운로드할 수 있습니다.
- **중복 방지**: 이미 수집된 리뷰는 중복 처리하지 않고 새로운 리뷰만 추가합니다.

## 기술 스택
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **AI**: Google Gemini Pro (1.5 Flash)
- **Scraping**: google-play-scraper, app-store-scraper
- **Storage**: Local JSON (Cloud Storage로 확장 가능 - `src/lib/storage.ts` 참조)
- **Google Sheets**: `src/lib/google-sheets.ts`에서 연동 로직을 확장할 수 있습니다.

## 주요 사용법
- **대시보드**: 월별 리뷰 성장률과 긍정/부정 비율을 시각적으로 확인합니다.
- **데이터 업데이트**: 상단 버튼을 누르면 실시간으로 스토어에서 최신 리뷰를 가져와 AI 분석을 수행합니다.
- **필터링**: 전체 리뷰 페이지에서 검색 및 카테고리 필터를 사용하여 상세 내용을 확인합니다.

## 초기 데이터 생성
웹사이트 실행 후 대시보드에서 `데이터 업데이트` 버튼을 누르거나, `/api/seed` 엔드포인트를 호출하면 2025년 1월부터 2026년 1월까지의 초기 데이터가 생성됩니다.

## GCP 배포 및 자동화 가이드
- **배포**: Google Cloud Run을 추천합니다.
- **DB**: Cloud Run의 휘발성 스토리지를 대신해 `src/lib/storage.ts`에서 Google Cloud Storage나 Firestore로 저장 로직을 변경하는 것을 권장합니다.
- **자동화**: Cloud Scheduler를 사용하여 매월 1일 `0 0 1 * *` 주기로 배치 API를 호출하세요.
  - URL: `https://your-service-url/api/batch?secret=your_cron_secret`

## 비용 분석 (GCP 기준)
- **Cloud Run / Scheduler**: 월 1회 실행 시 무료 티어 범위 내에서 **0원**에 가깝습니다.
- **Gemini API**: 1.5 Flash 사용 시 비용이 발생하지 않거나 매우 저렴합니다.
- **Storage**: 텍스트 데이터 위주이므로 저장 비용은 월 몇 십원 수준입니다.
