'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Lock } from 'lucide-react';

export function UpdateButton() {
    const [loading, setLoading] = useState(false);
    const [canUpdate, setCanUpdate] = useState<boolean | null>(null);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/batch/status');
            const data = await res.json();
            setCanUpdate(true); // Limits removed
        } catch (e) {
            setCanUpdate(true);
        }
    };

    const handleUpdate = async () => {
        if (loading) return;

        const password = prompt("관리자 비밀번호를 입력하세요:");
        if (!password) return;

        const confirmUpdate = confirm("데이터 업데이트를 시작하시겠습니까?");
        if (!confirmUpdate) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/batch?password=${encodeURIComponent(password)}`);

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(`서버응답이 올바르지 않습니다. (Status: ${res.status}). ${text.substring(0, 50)}... 서버 타임아웃일 가능성이 높습니다.`);
            }

            if (data.success) {
                alert(data.message || `${data.count}개의 새로운 리뷰를 업데이트했습니다.`);
                window.location.reload();
            } else if (data.error === 'ALREADY_UPDATED') {
                alert("이미 다른 사용자가 오늘 업데이트를 완료했습니다. 내일 다시 시도해주세요.");
                setCanUpdate(false);
            } else if (data.error === 'UNAUTHORIZED') {
                alert("비밀번호가 올바르지 않습니다.");
            } else {
                alert(`업데이트 중 오류가 발생했습니다: ${data.message || data.error || '상세 정보 없음'}`);
            }
        } catch (error: any) {
            console.error('Update error:', error);
            alert(`업데이트 중 오류가 발생했습니다: ${error.message || '서버 응답 없음'}`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <button
            onClick={handleUpdate}
            disabled={loading || canUpdate === null}
            className={`bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 shadow-lg shadow-primary/20 flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'AI 분석 중...' : '데이터 업데이트'}
        </button>
    );
}
