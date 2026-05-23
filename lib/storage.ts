// 本地 JSON 存储。只在服务端用。
// 台阶一目的:把"输入梦 → 解读 → 存下来 → 下次能引用"跑通,不上数据库。
// 文件路径:./data/dreams.json,已在 .gitignore。

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface StoredDream {
  id: string;
  createdAt: string; // ISO
  rawInput: string;
  emotions?: string;
  entities?: string;
  dayContext?: string;
  // 模型原文,原样存档(含 [[这个梦]] / [[和你过去的梦]] 标记)
  interpretation: string;
  // 切好的两段。老数据没有这两个字段,前端会用 parseInterpretation 现切。
  interpretationThis?: string;
  interpretationRelated?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "dreams.json");

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

export async function readAllDreams(): Promise<StoredDream[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw) as StoredDream[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

// 按 createdAt 倒序返回(最新在前)
export async function readDreamsDesc(): Promise<StoredDream[]> {
  const all = await readAllDreams();
  return [...all].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function appendDream(
  input: Omit<StoredDream, "id" | "createdAt">
): Promise<StoredDream> {
  const all = await readAllDreams();
  const dream: StoredDream = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  all.push(dream);
  await fs.writeFile(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  return dream;
}
