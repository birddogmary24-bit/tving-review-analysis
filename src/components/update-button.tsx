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
            setCanUpdate(data.canUpdate);
        } catch (e) {
            setCanUpdate(true);
        }
    };

    const handleUpdate = async () => {
        if (loading || canUpdate === false) return;

        const confirmUpdate = confirm("데이터 업데이트를 시작하시겠습니까? (하루에 1회만 가능합니다)");
        if (!confirmUpdate) return;

        setLoading(true);
        try {
            const res = await fetch('/api/batch');
            const data = await res.json();

            if (data.success) {
                alert(`${data.count}개의 새로운 리뷰를 성공적으로 업데이트했습니다.`);
                window.location.reload();
            } else if (data.error === 'ALREADY_UPDATED') {
                alert("이미 다른 사용자가 오늘 업데이트를 완료했습니다. 내일 다시 시도해주세요.");
                setCanUpdate(false);
            } else {
                alert('업데이트 중 오류가 발생했습니다.');
            }
        } catch (error) {
            alert('서버와 통신하는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (canUpdate === false) {
        return (
            <button
                disabled
                className="bg-muted text-muted-foreground px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 cursor-not-allowed opacity-80"
                title="오늘은 이미 업데이트되었습니다."
            >
                <Lock className="w-3 h-3" />
                오늘 업데이트 완료
            </button>
        );
    }

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
