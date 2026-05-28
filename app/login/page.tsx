"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [loading, setLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const next = params.get("next") || "/";

  async function signIn(provider: "google" | "github") {
    setLoading(provider);
    setError(null);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-[36px] font-semibold tracking-tight">
            <span
              style={{
                background: "linear-gradient(180deg,#fff,#b8b8d0 60%,#6a6a85)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              梦巢
            </span>
          </h1>
          <p className="mt-3 text-[14px] leading-[1.7] text-text-secondary">
            登录后,你的梦只属于你。
            <br />
            端到端加密,不用于训练模型,可随时一键删除。
          </p>
        </div>

        <div
          className="rounded-[20px] border p-6"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
            boxShadow:
              "0 24px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(139,124,246,0.05)",
          }}
        >
          {/* Google 登录暂未配置 OAuth provider,先隐藏。要开通时把这段注释去掉,
              并在 Supabase + Google Cloud Console 配置 Google provider。 */}
          {/* <button
            onClick={() => signIn("google")}
            disabled={loading !== null}
            className="mb-3 flex w-full items-center justify-center gap-3 rounded-[10px] border px-4 py-3 text-[14px] text-text-primary transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: "var(--border-subtle)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <GoogleSvg />
            {loading === "google" ? "正在跳转 Google…" : "用 Google 继续"}
          </button> */}

          <button
            onClick={() => signIn("github")}
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-[10px] border px-4 py-3 text-[14px] text-text-primary transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: "var(--border-subtle)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <GithubSvg />
            {loading === "github" ? "正在跳转 GitHub…" : "用 GitHub 继续"}
          </button>

          {error && (
            <div
              className="mt-4 rounded-[10px] border px-3 py-2 text-[12px]"
              style={{
                borderColor: "rgba(239,68,68,0.25)",
                background: "rgba(239,68,68,0.08)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-text-tertiary">
          继续即表示你同意上面的承诺。我们不发广告,不分享你的梦。
        </p>
      </div>
    </main>
  );
}

function LoginSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-text-tertiary">
      载入中…
    </main>
  );
}

function GoogleSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 11v3.2h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.6 14.7 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

function GithubSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2C6.5 2 2 6.6 2 12.3c0 4.5 2.9 8.4 6.8 9.7.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1.1 1.5 1.1.9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1 .8-.2 1.7-.3 2.5-.3s1.7.1 2.5.3c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V22c0 .3.2.6.7.5 4-1.3 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2z"
      />
    </svg>
  );
}
