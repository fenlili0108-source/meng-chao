"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StoredDream } from "@/lib/storage";
import InterpretationBlocks, {
  getInterpretationParts,
} from "@/components/InterpretationBlocks";
import ProfileNavLink from "@/components/ProfileNavLink";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";

export default function DreamsPage() {
  const [dreams, setDreams] = useState<StoredDream[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/dreams")
      .then((r) => r.json() as Promise<{ dreams: StoredDream[] }>)
      .then((d) => {
        if (!cancelled) setDreams(d.dreams ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "读取失败,稍后再试。");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    if (deletingId) return;
    const ok = window.confirm(
      "删除这条梦?这是不可恢复的操作——梦境内容和当时的解读都会被永久删掉。"
    );
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dreams/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        alert(j.error ?? "删除失败,稍后再试一次。");
        return;
      }
      setDreams((prev) => (prev ? prev.filter((d) => d.id !== id) : prev));
      if (expandedId === id) setExpandedId(null);
    } finally {
      setDeletingId(null);
    }
  }

  const total = dreams?.length ?? 0;

  // 按"年-月"分组,让长列表有节奏感
  const groups = useMemo(() => {
    if (!dreams) return [];
    const map = new Map<string, StoredDream[]>();
    for (const d of dreams) {
      const key = d.createdAt.slice(0, 7); // YYYY-MM
      const arr = map.get(key) ?? [];
      arr.push(d);
      map.set(key, arr);
    }
    return Array.from(map.entries()); // 已经是倒序输入,保留顺序
  }, [dreams]);

  return (
    <main className="relative min-h-screen">
      {/* —— 顶部导航 —— */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 md:px-10">
        <div className="rise">
          <Logo height={40} />
        </div>
        <div
          className="rise hidden items-center gap-1 rounded-full border px-2 py-1.5 text-sm text-text-secondary backdrop-blur md:flex"
          style={{
            borderColor: "var(--border-subtle)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <Link href="/" className="px-3 py-1 hover:text-text-primary">
            记录
          </Link>
          <span
            className="px-3 py-1 text-text-primary"
            style={{ background: "rgba(255,255,255,0.04)", borderRadius: 999 }}
          >
            我的梦境
          </span>
          <ProfileNavLink />
        </div>
        <div className="rise flex items-center gap-3">
          <Link
            href="/"
            className="rounded-[10px] border px-4 py-2 text-[13px] text-text-secondary transition-colors hover:text-text-primary"
            style={{
              borderColor: "var(--border-subtle)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            + 新的梦
          </Link>
          <UserMenu />
        </div>
      </nav>

      {/* —— Header —— */}
      <header className="mx-auto max-w-5xl px-6 pb-10 pt-4 md:px-10 md:pt-8">
        <div
          className="rise mb-3 text-[12px] uppercase tracking-[0.14em] text-text-tertiary"
          style={{ animationDelay: ".04s" }}
        >
          我的梦境
        </div>
        <h1
          className="rise font-display text-[36px] font-semibold leading-[1.1] tracking-tight md:text-[48px]"
          style={{ animationDelay: ".10s" }}
        >
          <span className="display-gradient">你记下的每一个梦,</span>
          <br />
          <span className="display-gradient">都在这里。</span>
        </h1>
        <p
          className="rise mt-4 max-w-[520px] text-[15px] leading-[1.7] text-text-secondary"
          style={{ animationDelay: ".18s" }}
        >
          按时间倒序。点开任何一条,看完整的梦和当时的解读。
          {total > 0 && total < 5 && (
            <span className="block mt-1 text-[13px] text-text-tertiary">
              再记 {5 - total} 个,潜意识画像页就会解锁。
            </span>
          )}
        </p>
      </header>

      {/* —— 列表 —— */}
      <section className="mx-auto max-w-5xl px-6 pb-24 md:px-10">
        {error && (
          <div
            className="rounded-[14px] border px-5 py-4 text-[13px]"
            style={{
              borderColor: "rgba(239,68,68,0.25)",
              background: "rgba(239,68,68,0.08)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {!error && dreams === null && <ListSkeleton />}

        {!error && dreams !== null && total === 0 && <EmptyState />}

        {!error && dreams !== null && total > 0 && (
          <div className="space-y-10">
            {groups.map(([month, items]) => (
              <div key={month}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-display text-[14px] text-text-secondary">
                    {formatMonth(month)}
                  </span>
                  <span
                    className="h-px flex-1"
                    style={{ background: "var(--border-subtle)" }}
                  />
                  <span className="text-[12px] text-text-tertiary">
                    {items.length} 个
                  </span>
                </div>
                <ul className="space-y-3">
                  {items.map((d) => (
                    <DreamCard
                      key={d.id}
                      dream={d}
                      expanded={expandedId === d.id}
                      deleting={deletingId === d.id}
                      onToggle={() =>
                        setExpandedId((cur) => (cur === d.id ? null : d.id))
                      }
                      onDelete={() => void handleDelete(d.id)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer
        className="mx-auto flex max-w-5xl items-center justify-between border-t px-6 py-8 text-[12px] text-text-tertiary md:px-10"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <span>梦巢</span>
        <Link href="/" className="hover:text-text-secondary">
          ← 回到记录
        </Link>
      </footer>
    </main>
  );
}

// ———————————————————————————————————————————————————————————————

function DreamCard({
  dream,
  expanded,
  deleting,
  onToggle,
  onDelete,
}: {
  dream: StoredDream;
  expanded: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className="overflow-hidden rounded-[14px] border transition-all duration-300"
      style={{
        background: "var(--bg-elevated)",
        borderColor: expanded ? "var(--border-glow)" : "var(--border-subtle)",
        boxShadow: expanded
          ? "0 20px 60px rgba(0,0,0,0.45), 0 0 24px rgba(139,124,246,0.10)"
          : "none",
      }}
    >
      {/* 顶部紫色高光线,展开时显现 */}
      {expanded && (
        <div
          className="h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent), transparent)",
          }}
        />
      )}

      <button
        onClick={onToggle}
        className="w-full px-5 py-4 text-left transition-colors duration-200 md:px-6 md:py-5"
        aria-expanded={expanded}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-text-tertiary">
          <span>{formatTime(dream.createdAt)}</span>
          {dream.emotions && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px]"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              {dream.emotions}
            </span>
          )}
          {dream.entities && (
            <span
              className="rounded-full border px-2 py-0.5 text-[11px] text-text-secondary"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              {truncate(dream.entities, 18)}
            </span>
          )}
          <span className="ml-auto text-text-tertiary">
            {expanded ? "收起 ↑" : "展开 ↓"}
          </span>
        </div>

        <div
          className={`text-[15px] leading-[1.65] text-text-primary ${
            expanded ? "" : "line-clamp-2"
          }`}
        >
          {dream.rawInput}
        </div>
      </button>

      {expanded && (
        <div
          className="px-5 pb-5 md:px-6 md:pb-6"
          style={{
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {/* 当时的补充信息 */}
          {(dream.entities || dream.dayContext || dream.emotions) && (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <DetailField label="当时的情绪" value={dream.emotions} />
              <DetailField
                label="梦里的人/物/场景"
                value={dream.entities}
              />
              <DetailField label="当天发生的事" value={dream.dayContext} />
            </div>
          )}

          {/* 解读:分两段渲染 */}
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2 text-[12px] text-text-tertiary">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: "var(--accent)",
                  boxShadow: "0 0 8px var(--accent)",
                }}
              />
              当时的解读
            </div>
            {(() => {
              const parts = getInterpretationParts(dream);
              return (
                <InterpretationBlocks
                  thisDream={parts.thisDream}
                  related={parts.related}
                />
              );
            })()}
          </div>

          {/* 删除单条 —— 克制的链接样式,避开误触 */}
          <div
            className="mt-5 flex justify-end border-t pt-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-[12px] text-text-tertiary underline-offset-2 transition hover:text-[#fca5a5] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "正在删除…" : "删除这条梦"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div
      className="rounded-[10px] border p-3"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--bg-elevated-2)",
      }}
    >
      <div className="mb-1 text-[11px] text-text-tertiary">{label}</div>
      <div className="text-[13px] leading-[1.55] text-text-primary">
        {value?.trim() || (
          <span className="text-text-tertiary">(空)</span>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-[20px] border px-8 py-14 text-center"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div
        className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: "var(--accent-soft)",
          border: "1px solid var(--border-glow)",
          color: "var(--accent)",
        }}
      >
        ☾
      </div>
      <h2 className="font-display text-[22px] text-text-primary">
        还没记录过梦
      </h2>
      <p className="mx-auto mt-3 max-w-[360px] text-[14px] leading-[1.7] text-text-secondary">
        回到记录页,把刚才的梦倒出来——哪怕只是几个关键词。
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-[10px] border px-5 py-2.5 text-[14px] text-white"
        style={{
          background:
            "linear-gradient(135deg, rgba(139,124,246,0.92), rgba(91,141,239,0.92))",
          borderColor: "rgba(255,255,255,0.14)",
          boxShadow: "0 4px 20px rgba(139,124,246,0.30)",
        }}
      >
        记下第一个梦 →
      </Link>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-3">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="rounded-[14px] border px-5 py-5"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div
            className="mb-3 h-3 w-32 rounded"
            style={{ background: "var(--bg-elevated-2)" }}
          />
          <div
            className="h-4 w-full rounded"
            style={{ background: "var(--bg-elevated-2)" }}
          />
          <div
            className="mt-2 h-4 w-4/5 rounded"
            style={{ background: "var(--bg-elevated-2)" }}
          />
        </li>
      ))}
    </ul>
  );
}

// ———————————————————————————————————————————————————————————————

function formatTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}  ${hh}:${mm}`;
}

function formatMonth(ym: string): string {
  // ym = "YYYY-MM"
  const [y, m] = ym.split("-");
  return `${y} 年 ${parseInt(m ?? "0", 10)} 月`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
