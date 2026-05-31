import { NextResponse } from "next/server";
import { deleteAllDreamsForUser } from "@/lib/storage";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 一键删除当前用户的全部内容数据:
//   - 所有梦境
//   - 画像缓存
//   - "系统对你的理解" 的用户反馈/修改
//
// 不删:
//   - 用户账号本身(Supabase Auth 的 users 表)——保持登录状态,
//     这样删完用户能看到"已清空"的页面,而不是被打到登录页一脸懵。
//     如果以后需要"彻底注销账号",再做单独的入口。
//   - ai_usage 用量计数——这是用来防滥用的,不该被清零绕过 rate limit。
//
// 客户端在调这个之前必须做二次确认。
export async function DELETE(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  // 多一道保险:body 里要带 confirm:"DELETE_ALL_MY_DREAMS"。
  // 防止有人意外触发 DELETE 这个 URL(浏览器扩展/预读/误点)。
  let body: { confirm?: string };
  try {
    body = (await req.json()) as { confirm?: string };
  } catch {
    body = {};
  }
  if (body.confirm !== "DELETE_ALL_MY_DREAMS") {
    return NextResponse.json(
      { error: "请在请求体里加 confirm 字段以确认删除。" },
      { status: 400 }
    );
  }

  try {
    const removedDreams = await deleteAllDreamsForUser(supabase, user.id);

    // 清画像缓存(没有就跳过)
    await supabase
      .from("profile_cache")
      .delete()
      .eq("user_id", user.id);

    // 清"系统对你的理解"反馈
    await supabase
      .from("profile_overrides")
      .delete()
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true, removedDreams });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "删除时出错了,稍后再试一次。", details: message },
      { status: 500 }
    );
  }
}
