import { OttApp } from './types';

export const OTT_APPS: OttApp[] = [
  {
    id: 'tving',
    name: '티빙',
    googlePlayId: 'net.cj.cjhv.gs.tving',
    appStoreId: '400101401',
    color: '#ff153c',
    icon: '🔴',
  },
  {
    id: 'netflix',
    name: '넷플릭스',
    googlePlayId: 'com.netflix.mediaclient',
    appStoreId: '363590051',
    color: '#e50914',
    icon: '🟥',
  },
  {
    id: 'disneyplus',
    name: '디즈니+',
    googlePlayId: 'com.disney.disneyplus',
    appStoreId: '1446075923',
    color: '#0063e5',
    icon: '🔵',
  },
  {
    id: 'wavve',
    name: '웨이브',
    googlePlayId: 'kr.co.captv.pooqV2',
    appStoreId: '1374309498',
    color: '#1d1d8e',
    icon: '🟣',
  },
  {
    id: 'coupangplay',
    name: '쿠팡플레이',
    googlePlayId: 'com.coupang.play',
    appStoreId: '1536885649',
    color: '#e4002b',
    icon: '🟠',
  },
  {
    id: 'watcha',
    name: '왓챠',
    googlePlayId: 'com.frograms.watcha',
    appStoreId: '1096606674',
    color: '#ff0558',
    icon: '🩷',
  },
];

export function getAppById(appId: string): OttApp | undefined {
  return OTT_APPS.find(app => app.id === appId);
}

export function getAppByIdOrThrow(appId: string): OttApp {
  const app = getAppById(appId);
  if (!app) throw new Error(`Unknown app: ${appId}`);
  return app;
}

// OTT 공통 서브카테고리 (모든 앱에서 동일하게 사용 → 비교 가능)
export const SUB_CATEGORIES = {
  '불만': [
    '플레이어/재생 오류',
    '광고 관련 불만',
    '요금/결제/구독',
    '콘텐츠 부족/불만',
    'UI/UX 불편',
    '앱 안정성(크래시/버그)',
    '자막/더빙 품질',
    '기타 불만',
  ],
  '칭찬': [
    '오리지널 콘텐츠',
    '화질/재생 품질',
    'UI 편리성',
    '콘텐츠 다양성',
    '합리적 가격',
    '자막/더빙 품질',
    '기타 칭찬',
  ],
  '기타': ['단순 문의', '기능 제안', '미분류'],
};
