"use client";

import type { StoredDream } from "@/lib/storage";
import { parseInterpretation } from "@/lib/prompts";

// 把 StoredDream 上的解读拆成两段(优先用已存的拆分字段,老数据兜底现切)
export function getInterpretationParts(d: StoredDream): {
  thisDream: string;
  related: string;
} {
  if (d.interpretationThis !== undefined || d.interpretationRelated !== undefined) {
    return {
      thisDream: d.interpretationThis ?? "",
      related: d.interpretationRelated ?? "",
    };
  }
  // 老数据:用解析器现切
  return parseInterpretation(d.interpretation ?? "");
}

interface Props {
  // 两段文本。可以直接传字符串,也可以传 StoredDream(由 getInterpretationParts 拆)
  thisDream: string;
  related: string;
}

export default function InterpretationBlocks({ thisDream, related }: Props) {
  const hasRelated = related.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* 第一块:这个梦——主体,带紫色顶光线 */}
      <article
        className="relative overflow-hidden rounded-[20px] border p-7 md:p-8"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-subtle)",
          boxShadow:
            "0 24px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(139,124,246,0.05)",
        }}
      >
        <span
          className="pointer-events-none absolute left-0 right-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent), transparent)",
          }}
        />
        <header className="mb-3 flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
            }}
          />
          <h3 className="font-display text-[15px] tracking-tight text-text-primary">
            这个梦
          </h3>
        </header>
        <div className="whitespace-pre-wrap text-[15.5px] leading-[1.85] text-text-primary">
          {thisDream.trim() || (
            <span className="text-text-tertiary">(没有内容)</span>
          )}
        </div>
        <footer
          className="mt-5 flex items-center gap-3 text-[12px] text-text-tertiary"
        >
          <span className="inline-block h-px w-3 bg-text-tertiary opacity-50" />
          这只是一种视角,不是结论。
        </footer>
      </article>

      {/* 第二块:和你过去的梦——增值视角,视觉上稍弱 */}
      {hasRelated && (
        <article
          className="relative overflow-hidden rounded-[20px] border p-6 md:p-7"
          style={{
            // 比第一块更弱:更淡的底、虚线感的细边、无紫色顶光线
            background: "rgba(255,255,255,0.02)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <header className="mb-3 flex items-center gap-2">
            {/* 一个"两个小圆相切"的小图标:呼应"两个梦之间" */}
            <svg
              aria-hidden
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: "var(--accent)" }}
            >
              <circle cx="6" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
              <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
            </svg>
            <h3 className="font-display text-[14px] tracking-tight text-text-secondary">
              和你过去的梦
            </h3>
          </header>
          <div className="whitespace-pre-wrap text-[14.5px] leading-[1.8] text-text-secondary">
            {related.trim()}
          </div>
        </article>
      )}
    </div>
  );
}
