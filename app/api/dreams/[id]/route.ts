import { NextResponse } from "next/server";
import { deleteDream } from "@/lib/storage";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "缺少梦 id。" }, { status: 400 });
  }

  try {
    const removed = await deleteDream(supabase, user.id, id);
    if (removed === 0) {
      return NextResponse.json(
        { error: "没找到这条梦,可能已经删过了。" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "删除时出错了,稍后再试一次。", details: message },
      { status: 500 }
    );
  }
}
