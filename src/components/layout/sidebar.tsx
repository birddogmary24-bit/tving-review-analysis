'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OTT_APPS } from '@/lib/apps';
import { BarChart3, GitCompareArrows, LayoutDashboard } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">AppScope</span>
            <span className="text-[10px] text-muted-foreground ml-1.5 font-medium">OTT</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {/* Overview */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
            pathname === '/'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          통합 대시보드
        </Link>

        <Link
          href="/compare"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
            isActive('/compare')
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <GitCompareArrows className="w-4 h-4" />
          OTT 비교
        </Link>

        {/* Divider */}
        <div className="pt-4 pb-2 px-3">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
            서비스별 분석
          </span>
        </div>

        {/* App list */}
        {OTT_APPS.map(app => (
          <Link
            key={app.id}
            href={`/${app.id}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
              isActive(`/${app.id}`)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: app.color }}
            />
            {app.name}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground/60 text-center">
          AppScope v1.0 MVP
        </p>
      </div>
    </aside>
  );
}
