'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface UpdateButtonProps {
  appId: string;
  appName: string;
}

export function UpdateButton({ appId, appName }: UpdateButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (loading) return;

    const password = prompt(`${appName} 리뷰 수집을 위한 관리자 비밀번호를 입력하세요:`);
    if (!password) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/${appId}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(`서버 응답 오류 (Status: ${res.status})`);
      }

      const data = await res.json();

      if (res.ok) {
        alert(`${appName}: ${data.newCount || 0}개 신규 리뷰 수집 완료! (전체: ${data.totalReviews || 0}건)`);
        window.location.reload();
      } else if (res.status === 401) {
        alert('비밀번호가 올바르지 않습니다.');
      } else {
        alert(`오류: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '서버 응답 없음';
      alert(`업데이트 중 오류: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpdate}
      disabled={loading}
      className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'AI 분석 중...' : '리뷰 수집'}
    </button>
  );
}
