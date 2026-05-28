"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type {
  ProfileJson,
  ProfileEmotionItem,
  ProfileMotif,
  ProfileMotifFreq,
} from "@/lib/prompts";
import type { ProfileOverride } from "@/lib/profileOverride";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import {
  Compass,
  Mountain,
  MoveDown,
  Waves,
  Flame,
  Moon,
  Coffee,
  Leaf,
  Orbit,
  Sparkles,
  Users,
  User,
  Home,
  DoorOpen,
  Eye,
  Shield,
  Zap,
  Heart,
  Clock,
  Map as MapIcon,
  type LucideIcon,
} from "lucide-react";

// PROFILE_PAGE.md §四 限定的图标清单。AI 只能从这里挑;找不到一律回退到 Sparkles。
const MOTIF_ICONS: Record<string, LucideIcon> = {
  compass: Compass,
  mountain: Mountain,
  "move-down": MoveDown,
  waves: Waves,
  flame: Flame,
  moon: Moon,
  coffee: Coffee,
  leaf: Leaf,
  orbit: Orbit,
  sparkles: Sparkles,
  users: Users,
  user: User,
  home: Home,
  "door-open": DoorOpen,
  eye: Eye,
  shield: Shield,
  zap: Zap,
  heart: Heart,
  clock: Clock,
  map: MapIcon,
};

function resolveMotifIcon(name?: string): LucideIcon {
  if (!name) return Sparkles;
  // 容错:同时支持 "move-down" 和 "movedown"、"MoveDown"
  const normalized = name.trim().toLowerCase().replace(/_/g, "-");
  return MOTIF_ICONS[normalized] ?? Sparkles;
}

// 调色板:严格按 DESIGN.md token,围绕 --accent + --accent-blue 做透明度变体
const CHART_PALETTE = [
  "#8B7CF6", // --accent
  "#5B8DEF", // --accent-blue
  "#a78bfa", // --glow-core
  "rgba(139,124,246,0.55)",
  "rgba(91,141,239,0.55)",
  "rgba(167,139,250,0.35)",
];

interface ProfileResponse {
  locked: boolean;
  totalDreams: number;
  unlockAt: number;
  need?: number;
  profile?: ProfileJson;
  override?: ProfileOverride;
  generatedAt?: string;
  fromCache?: boolean;
  error?: string;
}

interface DreamListResponse {
  dreams: { id: string }[];
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPrimary, setLoadingPrimary] = useState(true);
  // 提前拿到的梦数,加载文字里可以显示"通览你的 N 个梦",首次加载时也不空
  const [knownCount, setKnownCount] = useState<number | null>(null);
  // 手动「重新生成」状态
  const [regenerating, setRegenerating] = useState(false);

  // 修改"系统对你的理解"的编辑状态
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);

  async function loadProfile(force: boolean) {
    const url = force ? "/api/profile?force=1" : "/api/profile";
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as ProfileResponse;
    if (!res.ok && json.error) {
      throw new Error(json.error);
    }
    return json;
  }

  useEffect(() => {
    let cancelled = false;
    // 并行:画像请求(可能慢) + 梦列表(快,只为拿 count 显示在加载文字里)
    void fetch("/api/dreams", { cache: "no-store" })
      .then((r) => r.json() as Promise<DreamListResponse>)
      .then((d) => {
        if (!cancelled) setKnownCount((d.dreams ?? []).length);
      })
      .catch(() => undefined);

    void (async () => {
      try {
        const json = await loadProfile(false);
        if (cancelled) return;
        setData(json);
      } catch (e: unknown) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "加载失败,稍后再试。");
      } finally {
        if (!cancelled) setLoadingPrimary(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRegenerate() {
    if (regenerating) return;
    setRegenerating(true);
    setError(null);
    try {
      const json = await loadProfile(true);
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "重新生成失败,稍后再试。");
    } finally {
      setRegenerating(false);
    }
  }

  const override = data?.override;
  const aiUnderstanding = data?.profile?.understanding ?? "";

  // 用户最终看到的那一句:edited 时用 userText,否则用 AI 的
  const displayedUnderstanding = useMemo(() => {
    if (override?.status === "edited" && override.userText) {
      return override.userText;
    }
    return aiUnderstanding;
  }, [override, aiUnderstanding]);

  async function patchOverride(payload: {
    status: ProfileOverride["status"];
    userText?: string;
  }) {
    setSavingOverride(true);
    try {
      const res = await fetch("/api/profile/understanding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { override?: ProfileOverride; error?: string };
      if (!res.ok) {
        alert(json.error ?? "保存失败,稍后再试。");
        return;
      }
      if (data && json.override) {
        setData({ ...data, override: json.override });
      }
      setEditing(false);
    } finally {
      setSavingOverride(false);
    }
  }

  return (
    <main className="relative min-h-screen">
      <ProfileNav />

      <header className="mx-auto max-w-5xl px-6 pb-8 pt-4 md:px-10 md:pt-6">
        <div
          className="rise mb-3 text-[12px] uppercase tracking-[0.14em] text-text-tertiary"
          style={{ animationDelay: ".04s" }}
        >
          潜意识画像
        </div>
        <h1
          className="rise font-display text-[34px] font-semibold leading-[1.1] tracking-tight md:text-[44px]"
          style={{ animationDelay: ".10s" }}
        >
          <span className="display-gradient">系统目前怎么理解你。</span>
        </h1>
        <p
          className="rise mt-3 max-w-[560px] text-[14px] leading-[1.7] text-text-secondary"
          style={{ animationDelay: ".18s" }}
        >
          只有当你记下新的梦,这一页才会重新通览全部梦生成。否则保留上次的结果,不重复打扰你和 AI。
          {data && !data.locked && (
            <span className="block text-text-tertiary">
              基于你目前记录的 {data.totalDreams} 个梦。
              {data.generatedAt && (
                <>
                  {" "}· 上次生成:{formatGeneratedAt(data.generatedAt)}
                </>
              )}
            </span>
          )}
        </p>

        {/* 重新生成按钮:仅在解锁、非加载、非锁定时显示 */}
        {data && !data.locked && !loadingPrimary && (
          <div className="mt-5">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-2 rounded-[10px] border px-3.5 py-1.5 text-[12.5px] text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: "var(--border-subtle)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {regenerating ? (
                <>
                  <SpinnerSm />
                  正在重新生成…
                </>
              ) : (
                <>↻ 重新生成画像</>
              )}
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="mx-auto max-w-5xl px-6 pb-6 md:px-10">
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
        </div>
      )}

      {/* 加载态:首次加载 或 用户点了「重新生成」 */}
      {(loadingPrimary || regenerating) && !error && (
        <div className="mx-auto max-w-5xl px-6 pb-20 md:px-10">
          <PrimarySkeleton count={knownCount ?? data?.totalDreams ?? null} />
        </div>
      )}

      {/* 锁定态 */}
      {data?.locked && !error && !regenerating && (
        <section className="mx-auto max-w-5xl px-6 pb-20 md:px-10">
          <LockedState
            need={data.need ?? Math.max(0, data.unlockAt - data.totalDreams)}
            current={data.totalDreams}
            unlockAt={data.unlockAt}
          />
        </section>
      )}

      {/* 解锁态:三大板块 */}
      {data && !data.locked && !error && !regenerating && data.profile && (
        <>
          {/* 板块 1:系统对你的理解 */}
          <section className="mx-auto max-w-5xl px-6 pb-10 md:px-10">
            <UnderstandingCard
              displayed={displayedUnderstanding}
              aiText={aiUnderstanding}
              override={override}
              editing={editing}
              draft={draft}
              setDraft={setDraft}
              setEditing={setEditing}
              saving={savingOverride}
              onConfirm={() => patchOverride({ status: "confirmed" })}
              onReject={() => patchOverride({ status: "rejected" })}
              onSaveEdit={(text) =>
                patchOverride({ status: "edited", userText: text })
              }
              onResetToAi={() => patchOverride({ status: "none" })}
            />
          </section>

          {/* 板块 2:反复出现的母题 */}
          <section className="mx-auto max-w-5xl px-6 pb-12 md:px-10">
            <SectionEyebrow>反复出现的母题</SectionEyebrow>
            {data.profile.motifs.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {data.profile.motifs.map((m, i) => (
                  <MotifCard key={`${m.name}-${i}`} motif={m} />
                ))}
              </div>
            ) : (
              <EmptyNote>
                还没有形成清晰的母题。多记几个梦,模式自然会浮现。
              </EmptyNote>
            )}
          </section>

          {/* 板块 3:统计概览 */}
          <section className="mx-auto max-w-5xl px-6 pb-20 md:px-10">
            <SectionEyebrow>统计概览</SectionEyebrow>
            <div className="grid gap-4 md:grid-cols-2">
              <ChartCard title="情绪分布">
                <EmotionDonut
                  data={data.profile.emotion_distribution}
                  centerNumber={data.totalDreams}
                />
              </ChartCard>
              <ChartCard title="反复意象 / 主题频次">
                <MotifBar data={data.profile.motif_frequency} />
              </ChartCard>
            </div>
            <p className="mt-4 text-center text-[12px] text-text-tertiary">
              基于你目前记录的 {data.totalDreams} 个梦统计。
            </p>
          </section>
        </>
      )}

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

// ===============================================================
// 板块组件
// ===============================================================

function ProfileNav() {
  return (
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
        <Link href="/dreams" className="px-3 py-1 hover:text-text-primary">
          我的梦境
        </Link>
        <span
          className="px-3 py-1 text-text-primary"
          style={{ background: "rgba(255,255,255,0.04)", borderRadius: 999 }}
        >
          画像
        </span>
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
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-display text-[14px] text-text-secondary">
        {children}
      </span>
      <span
        className="h-px flex-1"
        style={{ background: "var(--border-subtle)" }}
      />
    </div>
  );
}

function LockedState({
  need,
  current,
  unlockAt,
}: {
  need: number;
  current: number;
  unlockAt: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-[20px] border p-10 text-center md:p-14"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: "var(--accent-soft)",
          border: "1px solid var(--border-glow)",
          color: "var(--accent)",
        }}
      >
        <LockSvg />
      </div>
      <h2 className="font-display text-[24px] text-text-primary">
        再记录 {need} 个梦,这一页就会解锁。
      </h2>
      <p className="mx-auto mt-3 max-w-[420px] text-[14px] leading-[1.7] text-text-secondary">
        画像需要至少 {unlockAt} 个梦的素材,才能给出"鸟瞰你"的判断,
        而不是凭空套话。
      </p>

      {/* 进度条 */}
      <div className="mx-auto mt-7 w-full max-w-[320px]">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "var(--bg-elevated-2)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, (current / unlockAt) * 100)}%`,
              background:
                "linear-gradient(90deg, var(--accent-blue), var(--accent))",
              boxShadow: "0 0 12px rgba(139,124,246,0.5)",
              transition: "width .4s ease",
            }}
          />
        </div>
        <div className="mt-2 text-[12px] text-text-tertiary">
          {current} / {unlockAt}
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-[10px] border px-5 py-2.5 text-[14px] text-white"
        style={{
          background:
            "linear-gradient(135deg, rgba(139,124,246,0.92), rgba(91,141,239,0.92))",
          borderColor: "rgba(255,255,255,0.14)",
          boxShadow: "0 4px 20px rgba(139,124,246,0.30)",
        }}
      >
        去记一个梦 →
      </Link>
    </div>
  );
}

function UnderstandingCard({
  displayed,
  aiText,
  override,
  editing,
  draft,
  setDraft,
  setEditing,
  saving,
  onConfirm,
  onReject,
  onSaveEdit,
  onResetToAi,
}: {
  displayed: string;
  aiText: string;
  override?: ProfileOverride;
  editing: boolean;
  draft: string;
  setDraft: (s: string) => void;
  setEditing: (b: boolean) => void;
  saving: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onSaveEdit: (text: string) => void;
  onResetToAi: () => void;
}) {
  const status = override?.status ?? "none";
  const userEdited = status === "edited" && !!override?.userText;

  return (
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
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
            }}
          />
          <h3 className="font-display text-[15px] tracking-tight text-text-primary">
            系统对你的理解
          </h3>
        </div>
        {userEdited && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px]"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            已被你修正
          </span>
        )}
        {status === "confirmed" && (
          <span className="text-[12px] text-text-tertiary">✓ 你说准</span>
        )}
        {status === "rejected" && (
          <span className="text-[12px] text-text-tertiary">你说不准</span>
        )}
      </header>

      {!editing ? (
        <>
          <p
            className="whitespace-pre-wrap text-[17px] leading-[1.85] text-text-primary md:text-[18px]"
            style={{ fontFamily: "var(--font-display, Georgia)" }}
          >
            {displayed.trim() || (
              <span className="text-text-tertiary">
                这次没生成出整体判断。可以再点击右下角刷新,或继续记录更多梦。
              </span>
            )}
          </p>

          {userEdited && aiText && (
            <details className="mt-3 group">
              <summary className="cursor-pointer text-[12px] text-text-tertiary hover:text-text-secondary">
                看一下系统原本说的
              </summary>
              <p
                className="mt-2 whitespace-pre-wrap rounded-[10px] border px-3 py-2 text-[14px] leading-[1.75] text-text-secondary"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--bg-elevated-2)",
                }}
              >
                {aiText}
              </p>
            </details>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <ToggleButton
              active={status === "confirmed"}
              disabled={saving}
              onClick={onConfirm}
            >
              ✓ 准
            </ToggleButton>
            <ToggleButton
              active={status === "rejected"}
              disabled={saving}
              onClick={onReject}
            >
              ✗ 不准
            </ToggleButton>
            <ToggleButton
              active={status === "edited"}
              disabled={saving}
              onClick={() => {
                setDraft(displayed || "");
                setEditing(true);
              }}
            >
              ✎ 我来改
            </ToggleButton>
            {userEdited && (
              <button
                onClick={onResetToAi}
                disabled={saving}
                className="ml-1 text-[12px] text-text-tertiary underline-offset-2 hover:text-text-secondary hover:underline disabled:opacity-50"
              >
                恢复系统的版本
              </button>
            )}
            <span className="ml-auto text-[12px] text-text-tertiary">
              这是系统目前的理解,会随你记录更多而改变。
            </span>
          </div>
        </>
      ) : (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="用你自己的话,写一下系统对你应该怎么理解。"
            className="w-full resize-none rounded-[12px] border bg-transparent p-3 text-[15px] leading-[1.7] text-text-primary outline-none placeholder:text-text-tertiary focus:[border-color:var(--border-glow)]"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--bg-elevated-2)",
            }}
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onSaveEdit(draft.trim())}
              disabled={saving || !draft.trim()}
              className="rounded-[10px] border px-4 py-2 text-[13px] text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,124,246,0.92), rgba(91,141,239,0.92))",
                borderColor: "rgba(255,255,255,0.14)",
                boxShadow: "0 4px 20px rgba(139,124,246,0.30)",
              }}
            >
              {saving ? "保存中…" : "保存"}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-[10px] border px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary disabled:opacity-50"
              style={{
                borderColor: "var(--border-subtle)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function ToggleButton({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border px-3 py-1.5 text-[12.5px] transition disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: active ? "var(--border-glow)" : "var(--border-subtle)",
        background: active ? "var(--accent-soft)" : "var(--bg-elevated-2)",
        color: active ? "var(--accent)" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function MotifCard({ motif }: { motif: ProfileMotif }) {
  const Icon = resolveMotifIcon(motif.icon);
  return (
    <article
      className="rounded-[14px] border p-5 transition-colors duration-200 hover:[border-color:var(--border-glow)]"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <header className="mb-2 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-[8px]"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--border-glow)",
            color: "var(--accent)",
          }}
          aria-hidden
        >
          <Icon size={15} strokeWidth={1.8} />
        </span>
        <h4 className="font-display text-[15px] text-text-primary">
          {motif.name}
        </h4>
      </header>
      <p className="text-[14px] leading-[1.65] text-text-secondary">
        {motif.desc}
      </p>
      {motif.dreams && (
        <div className="mt-3 text-[12px] text-text-tertiary">
          出现于:{motif.dreams}
        </div>
      )}
    </article>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className="rounded-[14px] border p-5"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <header className="mb-3 text-[13px] text-text-secondary">{title}</header>
      <div style={{ height: 260 }}>{children}</div>
    </article>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[14px] border px-5 py-7 text-center text-[13px] text-text-secondary"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {children}
    </div>
  );
}

// 有质感的加载态:呼吸光球 + 多层光环 + 文字 + 一句轻提示
function PrimarySkeleton({ count }: { count: number | null }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative mb-8 flex h-[200px] w-[200px] items-center justify-center">
        {/* 大范围紫色光晕 */}
        <div
          className="absolute h-[220px] w-[220px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(167,139,250,0.45) 0%, rgba(139,124,246,0.18) 35%, transparent 70%)",
            filter: "blur(20px)",
            animation: "loading-breathe 3.2s ease-in-out infinite",
          }}
        />
        {/* 中层光环 */}
        <div
          className="absolute h-[160px] w-[160px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(167,139,250,0.55) 0%, rgba(139,124,246,0.20) 45%, transparent 75%)",
            filter: "blur(10px)",
            animation: "loading-breathe 2.4s ease-in-out infinite",
            animationDelay: "0.3s",
          }}
        />
        {/* 核心 */}
        <div
          className="relative h-[70px] w-[70px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #ffffff 0%, #d4c9ff 18%, #8B7CF6 55%, #5B8DEF 100%)",
            boxShadow:
              "0 0 60px rgba(139,124,246,0.7), 0 0 100px rgba(91,141,239,0.30), inset 0 0 20px rgba(255,255,255,0.35)",
            animation: "loading-breathe 2.4s ease-in-out infinite",
          }}
        />
        {/* 慢速旋转的微弱光环 */}
        <div
          className="absolute h-[200px] w-[200px] rounded-full"
          style={{
            border: "1px solid rgba(139,124,246,0.18)",
            animation: "loading-spin 12s linear infinite",
          }}
        />
        <div
          className="absolute h-[140px] w-[140px] rounded-full"
          style={{
            border: "1px solid rgba(139,124,246,0.12)",
            animation: "loading-spin 18s linear infinite reverse",
          }}
        />
      </div>

      <div className="font-display text-[18px] text-text-primary">
        正在通览你
        {count !== null && (
          <>的 <span style={{ color: "var(--accent)" }}>{count}</span> 个</>
        )}
        梦……
      </div>
      <div className="mt-2 text-[13px] text-text-tertiary">
        第一次或新增梦境后会重新生成,通常需要十几秒到半分钟。
      </div>

      <style jsx>{`
        @keyframes loading-breathe {
          0%, 100% { transform: scale(1); opacity: 0.88; }
          50%      { transform: scale(1.10); opacity: 1; }
        }
        @keyframes loading-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ===============================================================
// 图表
// ===============================================================

function EmotionDonut({
  data,
  centerNumber,
}: {
  data: ProfileEmotionItem[];
  centerNumber: number;
}) {
  if (!data || data.length === 0) {
    return <ChartEmpty />;
  }
  // recharts 需要 value 字段
  const pieData = data.map((d) => ({ name: d.label, value: d.percent }));
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="78%"
            stroke="rgba(10,10,20,0.8)"
            strokeWidth={2}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            isAnimationActive
          >
            {pieData.map((_, i) => (
              <Cell
                key={i}
                fill={CHART_PALETTE[i % CHART_PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.02)" }}
            contentStyle={tooltipStyle}
            itemStyle={{ color: "#ECECF1" }}
            formatter={(v) => [`${v}%`, ""] as [string, string]}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* 中心数字 */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-[26px] font-semibold text-text-primary">
          {centerNumber}
        </div>
        <div className="text-[11px] text-text-tertiary">个梦</div>
      </div>
      {/* 自制图例(放右侧)避免 recharts 默认图例样式不可控 */}
      <Legend items={pieData.map((p, i) => ({ label: p.name, color: CHART_PALETTE[i % CHART_PALETTE.length], hint: `${p.value}%` }))} />
    </div>
  );
}

function MotifBar({ data }: { data: ProfileMotifFreq[] }) {
  if (!data || data.length === 0) {
    return <ChartEmpty />;
  }
  // 横向条形:用 layout="vertical"(recharts 的术语,y 是 category)
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 6);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
      >
        <XAxis
          type="number"
          stroke="rgba(154,154,176,0.6)"
          tick={{ fill: "#9A9AB0", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          stroke="rgba(154,154,176,0.6)"
          tick={{ fill: "#9A9AB0", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={92}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          contentStyle={tooltipStyle}
          itemStyle={{ color: "#ECECF1" }}
          formatter={(v) => [`${v} 次`, ""] as [string, string]}
        />
        <Bar
          dataKey="count"
          radius={[0, 6, 6, 0]}
          fill="url(#barGradient)"
          stroke="rgba(139,124,246,0.35)"
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5B8DEF" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#8B7CF6" stopOpacity={0.95} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Legend({ items }: { items: { label: string; color: string; hint: string }[] }) {
  return (
    <ul className="pointer-events-none absolute right-2 top-2 space-y-1 text-[11px] md:right-3 md:top-3">
      {items.map((it, i) => (
        <li key={`${it.label}-${i}`} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: it.color }}
          />
          <span className="text-text-secondary">{it.label}</span>
          <span className="text-text-tertiary">{it.hint}</span>
        </li>
      ))}
    </ul>
  );
}

function ChartEmpty() {
  return (
    <div className="flex h-full w-full items-center justify-center text-[13px] text-text-tertiary">
      数据还不够,多记几个梦。
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--bg-elevated-2, #181826)",
  border: "1px solid rgba(139,124,246,0.25)",
  borderRadius: 10,
  fontSize: 12,
  color: "#ECECF1",
  boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
};

function LockSvg() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function SpinnerSm() {
  return (
    <span
      className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-text-tertiary/40 border-t-text-primary"
      aria-hidden
    />
  );
}

// "上次生成"友好时间:30 秒内显示"刚刚",60 分钟内显示"X 分钟前",
// 24 小时内显示"X 小时前",更久远的显示具体日期
function formatGeneratedAt(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  if (diff < 30_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day} ${hh}:${mm}`;
}
