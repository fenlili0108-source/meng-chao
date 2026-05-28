// 一次性迁移脚本:把本地 data/dreams.json 里的梦
// 全部 INSERT 进 Supabase,并归到你登录后的 user_id。
//
// 用法(在项目根):
//   1. 先在本地浏览器登录一次(http://localhost:3xxx/login → Google/GitHub)
//   2. 跑 npx tsx scripts/migrate-local-dreams.ts <你的-user-id>
//      user-id 从 Supabase Auth 的 Users 列表里复制(uuid)
//
// 安全:用 service_role key 绕 RLS,所以**只能本地跑**,绝不暴露到前端。

import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";

interface LocalDream {
  id?: string;
  createdAt?: string;
  rawInput?: string;
  emotions?: string;
  entities?: string;
  dayContext?: string;
  interpretation?: string;
  interpretationThis?: string;
  interpretationRelated?: string;
}

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error(
      "用法:npx tsx scripts/migrate-local-dreams.ts <YOUR_USER_UUID>"
    );
    console.error(
      "你的 user-id 在 Supabase Dashboard → Authentication → Users,复制 UID 那一列。"
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "需要环境变量 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。"
    );
    console.error(
      "可以在 .env.local 里加 SUPABASE_SERVICE_ROLE_KEY=sb_secret_...,然后用:"
    );
    console.error(
      '  npx --node-options="--env-file=.env.local" tsx scripts/migrate-local-dreams.ts <user_id>'
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const file = path.join(process.cwd(), "data", "dreams.json");
  const raw = await fs.readFile(file, "utf-8");
  const dreams = JSON.parse(raw) as LocalDream[];
  if (!Array.isArray(dreams) || dreams.length === 0) {
    console.log("data/dreams.json 里没有梦,跳过。");
    return;
  }

  console.log(`准备迁移 ${dreams.length} 条梦到 user_id=${userId} …`);

  const rows = dreams.map((d) => ({
    // 让数据库生成 id;保留原 createdAt
    user_id: userId,
    created_at: d.createdAt ?? new Date().toISOString(),
    raw_input: d.rawInput ?? "",
    emotions: d.emotions ?? null,
    entities: d.entities ?? null,
    day_context: d.dayContext ?? null,
    interpretation: d.interpretation ?? null,
    interpretation_this: d.interpretationThis ?? null,
    interpretation_related: d.interpretationRelated ?? null,
  }));

  const { data, error } = await supabase
    .from("dreams")
    .insert(rows)
    .select("id");
  if (error) {
    console.error("迁移失败:", error);
    process.exit(1);
  }
  console.log(`✓ 迁移成功,新插入 ${data?.length ?? 0} 行。`);
  console.log("建议:登录浏览器刷新一下 /dreams,确认能看到。");
}

void main();
