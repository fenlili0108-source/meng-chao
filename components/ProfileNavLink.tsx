"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { StoredDream } from "@/lib/storage";

const UNLOCK_AT = 5;

interface Props {
  active?: boolean;
}

// 用 client 组件按梦数自适应锁定/解锁。
// 不满 5:灰色不可点 + tooltip 提示;满 5:正常链接。
export default function ProfileNavLink({ active = false }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/dreams")
      .then((r) => r.json() as Promise<{ dreams: StoredDream[] }>)
      .then((d) => {
        if (!cancelled) setCount((d.dreams ?? []).length);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // 未知时按"未锁"的样子先占位,内容稳定
  if (count === null) {
    return (
      <span className="px-3 py-1 text-text-tertiary opacity-60">
        画像 · 加载中
      </span>
    );
  }

  if (count < UNLOCK_AT) {
    const need = UNLOCK_AT - count;
    return (
      <span
        title={`再记录 ${need} 个梦,潜意识画像页就会解锁`}
        aria-disabled
        className="inline-flex cursor-not-allowed items-center gap-1.5 px-3 py-1 text-text-tertiary opacity-70"
      >
        <LockIcon />
        画像 · 再记 {need} 个解锁
      </span>
    );
  }

  return (
    <Link
      href="/profile"
      className={
        active
          ? "px-3 py-1 text-text-primary"
          : "px-3 py-1 transition-colors hover:text-text-primary"
      }
      style={
        active
          ? {
              background: "rgba(255,255,255,0.04)",
              borderRadius: 999,
            }
          : undefined
      }
    >
      画像
    </Link>
  );
}

function LockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
