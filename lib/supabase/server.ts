import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Route Handler 用。带着用户 cookie 走 RLS。
// 关键:即使 RLS 已经保证只看自己,我们的路由代码也总用 await getUser() 显式验证身份,
// 双保险——cookie 被替换/伪造时,数据库那道墙仍然挡得住,但代码也不会盲目相信。
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components 调 setAll 会抛——忽略;真正写 cookie 的活
            // 在 Route Handler / Server Action 里做,middleware 会兜底刷 session
          }
        },
      },
    }
  );
}

// 拿当前用户。RLS 已经保证数据隔离,这里只是给路由代码一个简洁入口:
//   const { user, supabase } = await requireUser();
// 没登录会返回 null,调用者自己决定怎么响应(API 通常返回 401)。
export async function requireUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}
