// 画像缓存:把 AI 生成的画像结果存下来,只要梦的内容没变化就直接复用。
// 文件:data/profile_cache.json(和 dreams.json 同目录,已在 .gitignore)
//
// 缓存键:对全部梦境的关键内容做一次稳定哈希(SHA-256)。
// 任何一个字段(梦内容/情绪/人物/当天的事)变化,或新增/删除一个梦,
// 哈希都会变,下次访问就会重新调 AI。
// 只数"梦的个数"不够——用户改了某条梦的情绪也应该触发重算。

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { ProfileJson } from "./prompts";
import type { StoredDream } from "./storage";

export interface ProfileCache {
  dreamsHash: string;
  dreamsCount: number;
  generatedAt: string; // ISO
  profile: ProfileJson;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "profile_cache.json");

// 对所有梦的关键字段做稳定哈希。
// 顺序按 createdAt 升序,确保和"梦的添加顺序"一致。
export function computeDreamsHash(dreams: StoredDream[]): string {
  const sorted = [...dreams].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : 1
  );
  const h = crypto.createHash("sha256");
  for (const d of sorted) {
    // 把会影响 AI 输入的字段都拼进去
    h.update(d.id);
    h.update(""); // 字段分隔符,避免歧义("ab|c" vs "a|bc")
    h.update(d.rawInput ?? "");
    h.update("");
    h.update(d.emotions ?? "");
    h.update("");
    h.update(d.entities ?? "");
    h.update("");
    h.update(d.dayContext ?? "");
    h.update(""); // 记录分隔符
  }
  return h.digest("hex");
}

async function ensure(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readCache(): Promise<ProfileCache | null> {
  await ensure();
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as ProfileCache;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.dreamsHash || !parsed.profile) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCache(c: ProfileCache): Promise<void> {
  await ensure();
  await fs.writeFile(FILE, JSON.stringify(c, null, 2), "utf-8");
}
