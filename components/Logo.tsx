import Image from "next/image";
import Link from "next/link";

// 站点 logo:白色图案、透明背景。
// 字号紧跟 height,让文字视觉上和 logo 高度齐平。
export default function Logo({
  height = 40,
  showText = true,
}: {
  height?: number;
  showText?: boolean;
}) {
  // 中文衬线字字身比英文小一些,取 logo 高度的 ~0.7 让光学高度齐平
  const fontSize = Math.round(height * 0.7);
  return (
    <Link
      href="/"
      className="flex items-center gap-3 font-display font-semibold tracking-tight text-text-primary"
      style={{ lineHeight: 1 }}
    >
      <Image
        src="/logo.png"
        alt="梦巢"
        width={height}
        height={height}
        priority
        unoptimized
        style={{ height, width: "auto", display: "block" }}
      />
      {showText && (
        <span style={{ fontSize, lineHeight: 1 }}>梦巢</span>
      )}
    </Link>
  );
}
