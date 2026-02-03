import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TVING 리뷰 분석 시스템",
  description: "앱스토어 및 구글 플레이 리뷰 분석 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
