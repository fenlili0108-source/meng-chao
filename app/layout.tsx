import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "梦巢 · 认识你梦里的自己",
  description:
    "不是占卜,不是符号字典。是一个真正记得你、能在你自己的梦境里发现模式的地方。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <div className="starfield" aria-hidden />
        {children}
      </body>
    </html>
  );
}
