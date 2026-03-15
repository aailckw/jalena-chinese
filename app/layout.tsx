import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "學廣東話 | 幼兒廣東話練習",
  description: "幼兒廣東話聽、講、砌句子練習。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body
        className={`${nunito.variable} antialiased min-h-screen font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
