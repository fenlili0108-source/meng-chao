"use client";

import { useEffect, useState, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    void supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 点外关
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) return null;

  // 优先 metadata 里的头像 / 昵称
  const avatar =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined);
  const name =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    "你";
  const initial = (name[0] ?? "你").toUpperCase();

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition hover:[border-color:var(--border-glow)]"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--bg-elevated-2)",
        }}
        aria-label="用户菜单"
      >
        {avatar ? (
          // 用普通 img 避免给 Next image 加白名单
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[13px] text-text-secondary">{initial}</span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-[44px] z-50 w-[220px] overflow-hidden rounded-[12px] border text-[13px] backdrop-blur"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="truncate text-text-primary">{name}</div>
            {user.email && name !== user.email && (
              <div className="mt-0.5 truncate text-[11px] text-text-tertiary">
                {user.email}
              </div>
            )}
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="block w-full px-4 py-2.5 text-left text-text-secondary transition hover:bg-white/[0.04] hover:text-text-primary"
            >
              退出登录
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
