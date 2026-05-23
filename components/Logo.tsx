import Image from "next/image";
import Link from "next/link";

// 站点 logo:白色图案、透明背景。
// 链接整体回首页;字号比 logo 高度略小,垂直居中。
export default function Logo({
  height = 40,
  showText = true,
}: {
  height?: number;
  showText?: boolean;
}) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 font-display text-[18px] font-semibold tracking-tight text-text-primary"
    >
      <Image
        src="/logo.png"
        alt="解梦"
        width={height}
        height={height}
        priority
        unoptimized
        style={{ height, width: "auto", display: "block" }}
      />
      {showText && <span>解梦</span>}
    </Link>
  );
}
