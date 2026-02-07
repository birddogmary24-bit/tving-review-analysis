import Link from 'next/link';
import { UpdateButton } from './update-button';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="h-16 border-b border-border flex items-center px-6 sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <Link href="/" className="flex items-center gap-2">
                    <div className="text-primary font-black text-2xl tracking-tighter">TVING</div>
                    <div className="text-muted-foreground font-medium text-sm ml-2 px-2 py-1 bg-secondary rounded">REVIEWS</div>
                </Link>
                <nav className="ml-10 flex gap-6">
                    <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">대시보드</Link>
                    <Link href="/reviews" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">전체 리뷰</Link>
                    <Link href="/insights" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">인사이트</Link>
                </nav>
                <div className="ml-auto flex items-center gap-4">
                    <UpdateButton />
                </div>
            </header>
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
