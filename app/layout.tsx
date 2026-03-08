import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "시간 조율 서비스",
  description: "모임 시간을 쉽게 조율하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
