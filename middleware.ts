import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/dreams", "/profile"];
// 首页 "/" 也保护,因为它就是记梦页
const PROTECTED_EXACT = ["/"];

// Supabase 的 cookie 在每次请求时可能需要刷新;同时这里顺便做"未登录跳转"。
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res = NextResponse.next({ request: req });
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 一定要调 getUser() 才会刷新 cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const isProtected =
    PROTECTED_EXACT.includes(path) ||
    PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // 登录后回到原页面
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // 已登录用户访问 /login 时直接送回首页
  if (path === "/login" && user) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}

// 关键:静态资源、图片、API 中除认证路由外,都不必走 middleware
export const config = {
  matcher: [
    // 排除:_next 内部静态资源、favicon、public 目录里的图片字体等
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.webp$).*)",
  ],
};
