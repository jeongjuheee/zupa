import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "주파 · 하루의 마음을 기록해요",
  description: "사진과 일기로 오늘의 감정 주파수를 발견하는 모바일 기록 서비스",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
