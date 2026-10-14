import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "金剛洞 AI出品査定プラットフォーム | Yahoo!オークション出品管理",
  description: "金剛洞 ヤフオク!出品支援・AI査定・在庫管理システム",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
