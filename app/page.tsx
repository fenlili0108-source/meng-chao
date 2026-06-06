"use client";

import { useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { StoredDream } from "@/lib/storage";
import InterpretationBlocks, {
  getInterpretationParts,
} from "@/components/InterpretationBlocks";
import ProfileNavLink from "@/components/ProfileNavLink";
import ParticleField from "@/components/ParticleField";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import BlurText from "@/components/BlurText";
import {
  ArrowUpRight,
  Brain,
  Clock3,
  Play,
} from "lucide-react";

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
      <nav className="fixed left-0 right-0 top-4 z-50 mx-auto flex max-w-6xl items-center justify-between px-6 md:px-10">
        <div className="rise">
          <Logo height={40} />
        </div>
        <div
          className="rise liquid-glass hidden items-center gap-1 rounded-full px-2 py-1.5 text-sm text-text-secondary md:flex"
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
            className="liquid-glass hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-text-secondary sm:inline-flex"
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

      {/* —— Hero:沉浸式首屏,粒子星空作为背景层 —— */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden px-6 pt-28 text-center md:px-10">
        <ParticleField />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center pb-12 pt-12">
          <div
            className="rise liquid-glass mb-8 inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-xs text-text-secondary md:text-sm"
            style={{ animationDelay: ".12s" }}
          >
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold text-[var(--bg-base)]"
              style={{ background: "var(--text-primary)" }}
            >
              New
            </span>
            <span className="pr-3">越用越懂你 · 云端私密记梦</span>
          </div>

          <BlurText
            text="读懂 你的梦 然后读懂你"
            highlight="你的梦"
            className="max-w-4xl font-display text-[52px] font-semibold italic leading-[0.9] tracking-tight md:text-[76px] lg:text-[92px]"
          />

          <p
            className="rise mx-auto mt-7 max-w-[600px] text-[15px] leading-[1.7] text-text-secondary md:text-[18px]"
            style={{ animationDelay: ".82s" }}
          >
            它会记得你的每一个梦,然后把它们连成你。
          </p>

          <div
            className="rise mt-8 flex flex-wrap items-center justify-center gap-4"
            style={{ animationDelay: "1.05s" }}
          >
            <a
              href="#record"
              className="liquid-glass-strong inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium text-text-primary"
            >
              记一个梦
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link
              href="/dreams"
              className="inline-flex items-center gap-2 text-[14px] text-text-secondary transition-colors hover:text-text-primary"
            >
              <Play className="h-4 w-4 fill-current" />
              回看我的梦境
            </Link>
          </div>

          <div
            className="rise mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2"
            style={{ animationDelay: "1.22s" }}
          >
            <HeroStat
              icon={<Clock3 className="h-5 w-5" />}
              value="90 秒"
              label="半梦半醒时也能先记下来"
            />
            <HeroStat
              icon={<Brain className="h-5 w-5" />}
              value={`${history.length || 0} 个`}
              label="已经进入你的梦境记忆"
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto mb-8 flex flex-col items-center gap-4">
          <div className="liquid-glass rounded-full px-3.5 py-1 text-[12px] text-text-secondary">
            记录 · 解读 · 画像 · 删除权
          </div>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 font-display text-[22px] italic tracking-tight text-text-primary/85 md:text-[28px]">
            <span>Specificity</span>
            <span>Memory</span>
            <span>Privacy</span>
            <span>Reflection</span>
          </div>
        </div>
      </section>

      {/* —— 主体:记录 + 解读 —— */}
      <section
        id="record"
        className="relative mx-auto grid min-h-screen max-w-6xl gap-6 px-6 py-24 md:grid-cols-5 md:px-10"
      >
        <div className="md:col-span-5">
          <div className="mb-4 text-[12px] uppercase tracking-[0.16em] text-text-tertiary">
            // Capture
          </div>
          <h2 className="font-display text-[42px] font-semibold italic leading-[0.95] tracking-tight text-text-primary md:text-[68px]">
            把一个梦,
            <br />
            交给你的记忆引擎。
          </h2>
        </div>

        {/* 左:记一个梦 */}
        <div
          className="rise liquid-glass-strong rounded-[20px] p-6 md:col-span-3 md:p-7"
          style={{
            animationDelay: ".34s",
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
            placeholder="比如:走在一条很长的走廊,灯一盏一盏亮起来"
            className="w-full resize-none bg-transparent text-[17px] text-text-primary outline-none placeholder:text-text-tertiary"
            style={{ minHeight: 100 }}
          />

          {/* 四维度补充 */}
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <FieldInput
              label="当时的情绪"
              placeholder="平静、好奇、有点失落……"
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
          className="rise liquid-glass rounded-[20px] p-6 md:col-span-2"
          style={{
            animationDelay: ".42s",
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

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="liquid-glass rounded-[20px] p-5 text-left">
      <div className="mb-8 flex h-8 w-8 items-center justify-center rounded-full text-text-primary">
        {icon}
      </div>
      <div className="font-display text-[34px] font-semibold italic leading-none tracking-tight text-text-primary">
        {value}
      </div>
      <div className="mt-2 text-[12px] leading-snug text-text-secondary">
        {label}
      </div>
    </div>
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
