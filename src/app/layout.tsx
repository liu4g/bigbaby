import type { Metadata } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/theme/theme-script";

export const metadata: Metadata = {
  title: {
    default: "JAPANWEB",
    template: "%s | JAPANWEB"
  },
  description: "一个覆盖 N5 到 N1 的现代化日语学习平台，提供单词、语法、文章、练习和 JLPT 专项训练。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
