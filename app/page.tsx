"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { StoredDream } from "@/lib/storage";
import InterpretationBlocks, {
  getInterpretationParts,
} from "@/components/InterpretationBlocks";
import ProfileNavLink from "@/components/ProfileNavLink";
import ParticleField from "@/components/ParticleField";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";

interface InterpretResponse {
  dream: StoredDream;
  referencedHistoryCount: number;
}
interface ErrorResponse {
  error: string;
  details?: string;
}

export default function Home() {
  const [rawInput, setRawInput] = useState("");
  const [emotions, setEmotions] = useState("");
  const [entities, setEntities] = useState("");
  const [dayContext, setDayContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latest, setLatest] = useState<StoredDream | null>(null);
  const [refCount, setRefCount] = useState<number>(0);
  const [history, setHistory] = useState<StoredDream[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // 初始加载历史
  useEffect(() => {
    void fetch("/api/interpret")
      .then((r) => r.json() as Promise<{ dreams: StoredDream[] }>)
      .then((d) => setHistory(d.dreams ?? []))
      .catch(() => undefined);
  }, []);

  async function submit() {
    const trimmed = rawInput.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput: trimmed,
          emotions: emotions.trim() || undefined,
          entities: entities.trim() || undefined,
          dayContext: dayContext.trim() || undefined,
        }),
      });
      const data = (await res.json()) as InterpretResponse | ErrorResponse;
      if (!res.ok) {
        setErrorMsg(
          (data as ErrorResponse).error ??
            "出了点问题。稍后再试一次。"
        );
        return;
      }
      const ok = data as InterpretResponse;
      setLatest(ok.dream);
      setRefCount(ok.referencedHistoryCount);
      setHistory((prev) => [ok.dream, ...prev]);
      // 清空主输入,保留四维度让用户对照(也可以一起清,看习惯)
      setRawInput("");
      setEmotions("");
      setEntities("");
      setDayContext("");
      taRef.current?.focus();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "网络好像断了。检查一下再来。"
      );
    } finally {
      setLoading(false);
    }
  }

  function onTextareaKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <main className="relative min-h-screen">
      {/* —— 顶部导航 —— */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
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
          <span
            className="px-3 py-1 text-text-primary"
            style={{ background: "rgba(255,255,255,0.04)", borderRadius: 999 }}
          >
            记录
          </span>
          <Link
            href="/dreams"
            className="px-3 py-1 transition-colors hover:text-text-primary"
          >
            我的梦境
          </Link>
          <ProfileNavLink />
        </div>
        <div className="rise flex items-center gap-3">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs text-text-secondary backdrop-blur"
            style={{
              borderColor: "var(--border-subtle)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: "var(--glow-core)",
                boxShadow: "0 0 10px var(--glow-core)",
              }}
            />
            越用越懂你
          </div>
          <UserMenu />
        </div>
      </nav>

      {/* —— Hero:粒子星空作为背景层,文字浮在上面 —— */}
      <section className="relative px-6 pt-10 pb-16 text-center md:pt-14 md:pb-20">
        <ParticleField />

        <div className="relative z-10">
          <h1
            className="rise font-display text-[44px] font-semibold leading-[1.04] tracking-tight md:text-[64px]"
            style={{ animationDelay: ".08s" }}
          >
            <span className="display-gradient">读懂</span>
            <span className="display-em">你的梦</span>
            <span className="display-gradient">,然后读懂你</span>
          </h1>
          <p
            className="rise mx-auto mt-6 max-w-[520px] text-[15px] leading-[1.7] text-text-secondary md:text-[17px]"
            style={{ animationDelay: ".18s" }}
          >
            它会记得你的每一个梦,然后把它们连成你。
          </p>
        </div>
      </section>

      {/* —— 主体:记录 + 解读 —— */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-5 md:px-10">
        {/* 左:记一个梦 */}
        <div
          className="rise rounded-[20px] border p-6 md:col-span-3 md:p-7"
          style={{
            animationDelay: ".34s",
            background: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
            boxShadow:
              "0 24px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(139,124,246,0.06)",
          }}
        >
          <div className="mb-3 flex items-center gap-2 text-[13px] text-text-tertiary">
            <span style={{ color: "var(--accent)" }}>☾</span>
            把刚才的梦倒出来吧,不用完整,碎片就好。
          </div>

          <textarea
            ref={taRef}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onKeyDown={onTextareaKey}
            rows={4}
            placeholder="比如:又是水…这次很浑浊,在涨…有点慌"
            className="w-full resize-none bg-transparent text-[17px] text-text-primary outline-none placeholder:text-text-tertiary"
            style={{ minHeight: 100 }}
          />

          {/* 四维度补充 */}
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <FieldInput
              label="当时的情绪"
              placeholder="慌、平静、愤怒……"
              value={emotions}
              onChange={setEmotions}
            />
            <FieldInput
              label="梦里的人/物/场景"
              placeholder="谁、什么东西、在哪"
              value={entities}
              onChange={setEntities}
            />
            <FieldInput
              label="昨天发生了什么"
              placeholder="一句话就够"
              value={dayContext}
              onChange={setDayContext}
            />
          </div>

          {/* 提交区 */}
          <div className="mt-6 flex items-center justify-between">
            <span className="text-[12px] text-text-tertiary">
              端到端加密,只属于你。不会用于训练模型,
              可随时一键删除全部数据。
            </span>
            <button
              onClick={() => void submit()}
              disabled={loading || !rawInput.trim()}
              className="inline-flex items-center gap-2 rounded-[10px] border px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,124,246,0.92), rgba(91,141,239,0.92))",
                borderColor: "rgba(255,255,255,0.14)",
                boxShadow: "0 4px 20px rgba(139,124,246,0.30)",
              }}
            >
              {loading ? (
                <>
                  <Spinner />
                  正在解读…
                </>
              ) : (
                <>
                  解读这个梦
                  <span>→</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div
              className="mt-4 rounded-[10px] border px-4 py-3 text-[13px]"
              style={{
                borderColor: "rgba(239,68,68,0.25)",
                background: "rgba(239,68,68,0.08)",
                color: "#fca5a5",
              }}
            >
              {errorMsg}
            </div>
          )}
        </div>

        {/* 右:状态/提示 */}
        <aside
          className="rise rounded-[20px] border p-6 md:col-span-2"
          style={{
            animationDelay: ".42s",
            background: "rgba(255,255,255,0.02)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="mb-3 text-[12px] uppercase tracking-[0.14em] text-text-tertiary">
            它如何记得你
          </div>
          <p className="text-[14px] leading-[1.7] text-text-secondary">
            它每次解读时会把你最近 <span className="text-text-primary">5 个</span> 梦
            一起塞给 AI——从第二个梦起,解读会主动调出之前的梦,
            说出只对你成立的话。
          </p>
          <div
            className="mt-5 rounded-[12px] border p-4 text-[13px] text-text-secondary"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--bg-elevated)",
            }}
          >
            <div className="mb-2 text-text-tertiary">已记录</div>
            <div className="text-[28px] font-semibold text-text-primary">
              {history.length}
              <span className="ml-1 text-[14px] font-normal text-text-secondary">
                个梦
              </span>
            </div>
            {history.length > 0 && history.length < 5 && (
              <div className="mt-2 text-[12px] text-text-tertiary">
                再记 {5 - history.length} 个,潜意识画像页解锁。
              </div>
            )}
          </div>
        </aside>
      </section>

      {/* —— 最新解读:分两段渲染 —— */}
      {latest && (
        <section className="mx-auto max-w-6xl px-6 pb-12 md:px-10">
          <div className="mb-3 flex items-center gap-2 text-[13px] text-text-tertiary">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: "var(--accent)",
                boxShadow: "0 0 8px var(--accent)",
              }}
            />
            第 {history.length} 个梦 · 刚刚
            {refCount > 0
              ? ` · 引用了 ${refCount} 个历史梦境`
              : " · 这是你的第一个梦"}
          </div>
          {(() => {
            const parts = getInterpretationParts(latest);
            return (
              <InterpretationBlocks
                thisDream={parts.thisDream}
                related={parts.related}
              />
            );
          })()}
        </section>
      )}

      {/* —— 历史列表 —— */}
      {history.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-[22px] tracking-tight text-text-primary">
              过去的梦
            </h2>
            <Link
              href="/dreams"
              className="text-[12px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              共 {history.length} 个 · 看全部 →
            </Link>
          </div>
          <ul className="space-y-3">
            {history.map((d) => (
              <li
                key={d.id}
                className="rounded-[14px] border p-5 transition-colors duration-200 hover:[border-color:var(--border-glow)]"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div className="mb-2 flex items-center gap-3 text-[12px] text-text-tertiary">
                  <span>{formatTime(d.createdAt)}</span>
                  {d.emotions && (
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                      }}
                    >
                      {d.emotions}
                    </span>
                  )}
                </div>
                <div className="text-[14px] text-text-primary line-clamp-2">
                  {d.rawInput}
                </div>
                <details className="mt-3 group">
                  <summary className="cursor-pointer text-[12px] text-text-tertiary hover:text-text-secondary">
                    展开解读
                  </summary>
                  <div className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.75] text-text-secondary">
                    {d.interpretation}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* —— 边界声明 —— */}
      <section className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
        <div
          className="rounded-[14px] border px-7 py-5 text-center text-[13px] leading-[1.7] text-text-secondary"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <span className="font-medium text-text-primary">关于边界的诚实。</span>{" "}
          这是一个心理学工具,不是心理咨询替代品。它不会下诊断,也不预言。
          如果你正经历严重困扰,请优先寻求专业帮助。
        </div>
      </section>

      <footer
        className="mx-auto flex max-w-6xl items-center justify-between border-t px-6 py-8 text-[12px] text-text-tertiary md:px-10"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <span>梦巢</span>
        <span>⌘+Enter 提交</span>
      </footer>
    </main>
  );
}

function FieldInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12px] text-text-tertiary">+ {label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[10px] border bg-transparent px-3 py-2 text-[14px] text-text-primary outline-none transition-colors duration-200 placeholder:text-text-tertiary focus:[border-color:var(--border-glow)]"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--bg-elevated-2)",
        }}
      />
    </label>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden
    />
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}
