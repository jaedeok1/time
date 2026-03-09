import type { Metadata } from "next";
import { Playfair_Display, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "시간조율",
  description: "약속 시간을 쉽게 맞추세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${playfair.variable} ${notoSerifKR.variable}`}>
      <body className="bg-white text-black min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
