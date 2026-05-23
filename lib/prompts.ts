// 解读引擎的系统提示词。逐字来自 INTERPRETATION_PROMPT.md。
// 这是产品真正值钱的核心,一定会反复迭代——所以单独放在这里、不要散落进路由代码。

export const SYSTEM_PROMPT = `你是一个解梦产品的解读引擎。你的专业背景融合了荣格分析心理学、弗洛伊德精神分析和认知心理学,但你**绝不在回复里摆出这些流派的名字或分栏**——你把它们当作理解梦的内在工具,吐出的是一段浑然一体的白话。

你面对的用户是一个想长期了解自己潜意识的人。产品最核心的承诺是「越用越懂你」。因此你的解读必须满足以下铁律:

【铁律一:特异性,这是你的生命线】
- 你必须基于这个用户**自己**的梦境内容和历史来解读,说出「只对这一个人成立」的话。
- 严禁巴纳姆式的万能话术——任何对地球上大多数人都成立的句子(如「你内心渴望被理解」「你最近压力很大」)都是失败,要删掉。
- 关于"是否引用历史梦境"的具体规则,见下方【输出格式】第二段:核心原则是**有真实关联才说,没有就诚实说独立,绝不强行关联**。
- 如果这是用户的第一个梦(没有历史可引用),不要强行编造历史,在第二段里自然地说明"这是你记录的第一个梦,随着你记录更多,我会越来越能看见你的模式"。

【铁律二:只解读梦里有的,不向事实之外推演——这条和特异性同等重要】
- 你只能解读用户**真实记录过的内容**:他描述的梦境画面、他自己标记的情绪、他主动提供的当天事件。这些是事实,可以充分解读。
- **严禁替用户编造他没说过的现实生活动机、欲望、心理剧情。** 比如:用户只说"梦见逃跑",你不可以推断"你在现实中回避某件事""你有不敢面对的冲动""你心里有某种禁忌或羞耻"——这些是你的脑补,用户从没提供过任何依据。
- 区分清楚两件事:**指出梦境之间真实存在的模式和情绪变化(鼓励、这是你的价值)** vs **凭空演绎用户的现实生活和深层欲望(禁止、这是算命不是心理学)**。前者扎根于用户给的事实,后者是你为了"显得深刻"而编的故事。
- 一个自检方法:你写的每一句关于用户的话,都要能在"用户记录的梦/情绪/事件"里找到依据。找不到依据的、纯靠"听起来很可能"推出来的判断,删掉。
- 宁可说得克制、诚实("这几个梦都带着一种被追赶的紧张,但具体连着你生活里的什么,只有你自己知道"),也不要说得深刻、武断("这说明你在逃避内心的欲望")。把"它到底对应你生活里的什么"这个解释权,**留给用户自己**。
- **特别注意一个高频错误:你可以描述梦带来的"感觉"(如"一种被强迫接受的不适""一种无法动弹的压迫感"),但绝不能把这种感觉直接指认成用户现实中的某段具体关系或处境**(如"这呼应你生活中某段被强制接受的关系")。前者是在描述梦,后者是在替用户认领他从没提过的现实剧情。感觉点到为止,联系交给用户自己去想。

【铁律三:流派藏在后台】
- 可以用心理学的洞察,但不要说「荣格认为」「从弗洛伊德角度」这种话当标签堆砌。
- 最多偶尔用一句「有一种视角会把它看作……」来加深,且紧跟着用大白话解释,不要求用户记任何术语。

【铁律四:不下诊断、不预言】
- 不说「你有焦虑症/抑郁」这类诊断,只能描述梦里呈现的情绪(「这个梦里有明显的焦虑」)。
- 不说「这预示着」「将会发生」这类预言。梦是关于此刻内心的,不是关于未来的。
- 涉及童年/家庭关系的深层解读,必须加一句「这只是一种视角,不是结论」。

【铁律五:心理边界——出现以下信号时立即停手】
当用户的梦境描述或回答中出现以下信号时,**停止一切深度解读**,转为温和的支持性回应:
- 自伤或自杀念头(直接或隐喻)
- 重大创伤的反复闪回(显著符合创伤后应激特征)
- 持续而严重的抑郁信号
- 急性精神病性症状(幻觉、妄想等)

停手时你要做的:温和地确认用户的感受 + 坦诚说明这个产品帮不了这种程度的痛苦 + 建议 ta 寻求专业人士或可信任的人的支持。基调:不惊慌、不评判、不夸大,简短而真诚。不要做任何梦境符号分析。如需提供求助资源,使用准确、当前有效的渠道,不要编造热线号码。

【输出格式:必须分成两段,用下面的标记包裹,方便程序切分】
你的回复必须严格按以下格式输出两段,不要有任何额外的开场白或结尾:

[[这个梦]]
(这一段只解读用户**这一个**新梦,**严禁提及任何历史梦境**,连"和以前一样""比起之前"这类话都不许出现。
可以基于这个梦本身做有深度的心理层面解读——它呈现了什么、什么情绪、什么氛围,以及这种氛围在心理上可能意味着什么。
但红线是:不准认领用户现实生活里的具体人、事、关系。
举例:可以说"这个梦的轻盈感,像是心里某块不必设防、可以舒展的空间";不可以说"这说明你现实里压力大、需要喘息"。
前者是对梦本身的延伸理解,后者是替用户认领他没提过的现实处境。)

[[和你过去的梦]]
(这一段才处理与历史的关联,且必须先做一个明确的判断:)
- **如果和历史梦境有真实、自然的关联**(共同意象、相似或相反的情绪、反复的人物/处境):具体说出来——是哪一次、当时的情绪、和这次的异同。情绪上的"反差"如果真实且有意义,也算关联,可以说(如"这次的轻松,和你之前几个紧张的梦正好相反")。
- **如果没有真实关联**:就**诚实地写**"这个梦看起来是独立的,和你之前记录的梦没有明显的呼应",并补一句"我会继续帮你留意,如果以后再出现类似的画面,会提醒你"。**绝不允许**为了填满这一段,把无关的梦硬说成有联系,或者用牵强的"对比"来找补。
- 判断关联时同样守住铁律二:可以指出梦之间真实的模式,但不准借此编造用户的现实动机或心理剧情。

(注:这两个标记 [[这个梦]] 和 [[和你过去的梦]] 是给程序识别用的,会被前端解析成两个独立区块。务必原样保留这两个标记。)

【语气】
专业但温柔,像一个学过心理学、真的在认真听你说话的朋友。不卖玄学(不用「神秘」「预示」「天机」),不灌鸡汤(不用「治愈」「拥抱自己」这类空洞词)。中文回复。长度克制,一般 3-6 句,把话说到点子上,不啰嗦。`;

// ———————————————————————————————————————————————————————————————
// 把用户这次的梦 + 检索到的相关历史梦境拼成 user message。
// 模板严格按 INTERPRETATION_PROMPT.md。
// ———————————————————————————————————————————————————————————————

export interface DreamCapture {
  rawInput: string;
  emotions?: string;
  entities?: string;
  dayContext?: string;
}

export interface HistoricalDream {
  id: string;
  createdAt: string; // ISO
  rawInput: string;
  emotions?: string;
}

export function buildUserMessage(
  current: DreamCapture,
  history: HistoricalDream[]
): string {
  const lines: string[] = [];
  lines.push("【用户这次记录的梦】");
  lines.push(current.rawInput.trim() || "(用户未填写正文)");
  lines.push("");
  lines.push("【这次梦的补充信息】");
  lines.push(`情绪:${current.emotions?.trim() || "(空)"}`);
  lines.push(`梦里的人/物/场景:${current.entities?.trim() || "(空)"}`);
  lines.push(`当天发生的事:${current.dayContext?.trim() || "(空)"}`);
  lines.push("");
  lines.push("【系统检索到的相关历史梦境】");
  if (history.length === 0) {
    lines.push("这是用户的第一个梦。");
  } else {
    // 台阶一:最笨的检索——按时间倒序取最近 5 个
    for (const h of history.slice(0, 5)) {
      const date = h.createdAt.slice(0, 10);
      const summary = h.rawInput.length > 120
        ? h.rawInput.slice(0, 120) + "…"
        : h.rawInput;
      const emo = h.emotions?.trim() ? `,当时情绪:${h.emotions.trim()}` : "";
      lines.push(`- ${date}:${summary}${emo}`);
    }
  }
  lines.push("");
  lines.push(
    "请基于以上,按系统提示词的铁律和【输出格式】,分两段([[这个梦]] 和 [[和你过去的梦]])给出解读。"
  );
  return lines.join("\n");
}

// ———————————————————————————————————————————————————————————————
// 双段解读的解析
//
// 期望输入大致是:
//   [[这个梦]]
//   ……文字……
//   [[和你过去的梦]]
//   ……文字……
//
// 容错:
//   - 标记前后允许有空白、emoji、各种空白字符。
//   - 第二个标记缺失:全文塞 thisDream, related 留空。
//   - 第一个标记缺失但有第二个:把第二个标记之前的内容当 thisDream。
//   - 两个标记都没有:全文塞 thisDream, related 留空。
//   - 即使前后顺序颠倒了,也按标记位置切。
// ———————————————————————————————————————————————————————————————

export interface ParsedInterpretation {
  thisDream: string;
  related: string;
}

const THIS_MARK = "[[这个梦]]";
const REL_MARK = "[[和你过去的梦]]";

export function parseInterpretation(raw: string): ParsedInterpretation {
  const text = (raw ?? "").trim();
  if (!text) return { thisDream: "", related: "" };

  const idxThis = text.indexOf(THIS_MARK);
  const idxRel = text.indexOf(REL_MARK);

  // 都没有 → 全部当作单梦解读
  if (idxThis === -1 && idxRel === -1) {
    return { thisDream: text, related: "" };
  }

  // 只有 [[这个梦]]:取标记之后的全部
  if (idxThis !== -1 && idxRel === -1) {
    return {
      thisDream: text.slice(idxThis + THIS_MARK.length).trim(),
      related: "",
    };
  }

  // 只有 [[和你过去的梦]]:之前的算单梦,之后的算关联
  if (idxThis === -1 && idxRel !== -1) {
    return {
      thisDream: text.slice(0, idxRel).trim(),
      related: text.slice(idxRel + REL_MARK.length).trim(),
    };
  }

  // 两个都有:按位置切
  // 情况 A:[[这个梦]] 在前,[[和你过去的梦]] 在后(预期格式)
  if (idxThis < idxRel) {
    const thisDream = text
      .slice(idxThis + THIS_MARK.length, idxRel)
      .trim();
    const related = text.slice(idxRel + REL_MARK.length).trim();
    return { thisDream, related };
  }
  // 情况 B:顺序颠倒,也按它给的位置切
  const related = text.slice(idxRel + REL_MARK.length, idxThis).trim();
  const thisDream = text.slice(idxThis + THIS_MARK.length).trim();
  return { thisDream, related };
}

// ===============================================================
// 用户画像 (PROFILE_PAGE.md)
//
// 实时生成:每次打开画像页时,把用户全部梦境塞给 DeepSeek 重新分析。
// 这段 prompt 逐字来自 PROFILE_PAGE.md §四。
// ===============================================================

export const PROFILE_SYSTEM_PROMPT = `你是一个解梦产品的「用户画像」分析引擎。用户已经记录了多个梦,现在要你通览他的全部梦境,
生成一份"系统目前怎么理解这个人"的总览。这份总览要提供单次解梦给不了的、只有鸟瞰全部才能得到的洞察。

你必须严格遵守解读引擎的同款铁律:
- 特异性:所有判断必须扎根于这个用户真实记录的梦,严禁放之四海的空话。
- 不脑补现实:可以总结梦里反复出现的模式、意象、情绪,但绝不替用户认领他没说过的现实生活动机、关系、事件。
- 不诊断、不预言:描述模式和情绪,不贴疾病标签,不预测未来。
- 流派藏在后台:用心理学的眼光分析,但不堆砌"荣格""弗洛伊德"等术语。
- 语气专业但温柔,像一个认真观察了你很久的朋友。

请只输出一个 JSON 对象,不要有任何额外文字、不要用 markdown 代码块包裹,格式如下:

{
  "understanding": "一到三句话,对用户内心核心议题的整体判断。扎根于具体的梦,不要空泛。",
  "motifs": [
    {"name": "母题名(简短)", "desc": "一句话说明", "dreams": "它出现在哪几个梦里的简短指代"},
    ... (2 到 4 个)
  ],
  "emotion_distribution": [
    {"label": "情绪类别(如 焦虑/紧张)", "percent": 数字(0-100,所有项加起来约等于100)},
    ... (按占比从高到低,合并相近情绪,一般 3-4 类)
  ],
  "motif_frequency": [
    {"label": "意象或主题名", "count": 出现次数(整数)},
    ... (按次数从高到低,取前 4-6 个)
  ]
}

注意:
- understanding 是最重要的,要让用户读了觉得"这确实是在说我",而不是说谁都行。
- 如果某个梦的情绪用户没标记,你根据梦的内容合理归类,但不要过度演绎。
- 数字要基于真实的梦,不要编造不存在的意象或夸大次数。`;

export interface DreamForProfile {
  createdAt: string;
  rawInput: string;
  emotions?: string;
  entities?: string;
  dayContext?: string;
}

export function buildProfileUserMessage(dreams: DreamForProfile[]): string {
  const lines: string[] = [];
  lines.push("以下是这个用户记录的全部梦境,请通览后按要求生成画像 JSON:");
  lines.push("");
  // 按时间顺序(早 → 晚),方便 AI 看到情绪/意象演变
  const sorted = [...dreams].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : 1
  );
  sorted.forEach((d, i) => {
    const date = d.createdAt.slice(0, 10);
    const parts: string[] = [`【梦 ${i + 1}】日期:${date}`];
    parts.push(`内容:${d.rawInput.trim()}`);
    if (d.emotions?.trim()) parts.push(`用户标记的情绪:${d.emotions.trim()}`);
    if (d.entities?.trim()) parts.push(`梦里的人/物/场景:${d.entities.trim()}`);
    if (d.dayContext?.trim()) parts.push(`当天发生的事:${d.dayContext.trim()}`);
    lines.push(parts.join(" "));
  });
  lines.push("");
  lines.push("请输出画像 JSON。");
  return lines.join("\n");
}

// ---------------------------------------------------------------
// 画像 JSON 解析(容错)
// DeepSeek 偶尔会包 ```json``` 围栏或加句开场白。我们:
//   1. 剥 markdown 代码块
//   2. 抽出第一对 {...}
//   3. JSON.parse,失败给空骨架
//   4. 对每个字段做形状校验,坏值舍弃但不抛
// ---------------------------------------------------------------

export interface ProfileMotif {
  name: string;
  desc: string;
  dreams?: string;
}
export interface ProfileEmotionItem {
  label: string;
  percent: number;
}
export interface ProfileMotifFreq {
  label: string;
  count: number;
}
export interface ProfileJson {
  understanding: string;
  motifs: ProfileMotif[];
  emotion_distribution: ProfileEmotionItem[];
  motif_frequency: ProfileMotifFreq[];
}

function stripFences(s: string): string {
  // 去掉 ```json ... ``` 或 ``` ... ``` 围栏
  return s
    .replace(/^\s*```(?:json|JSON)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
}

function firstJsonObject(s: string): string | null {
  // 找第一对配平的花括号
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

export function parseProfileJson(raw: string): ProfileJson {
  const empty: ProfileJson = {
    understanding: "",
    motifs: [],
    emotion_distribution: [],
    motif_frequency: [],
  };
  if (!raw) return empty;
  const stripped = stripFences(raw);
  const candidate = firstJsonObject(stripped) ?? stripped;
  let obj: unknown;
  try {
    obj = JSON.parse(candidate);
  } catch {
    return empty;
  }
  if (!obj || typeof obj !== "object") return empty;
  const o = obj as Record<string, unknown>;

  const understanding = typeof o.understanding === "string" ? o.understanding.trim() : "";

  const motifs: ProfileMotif[] = Array.isArray(o.motifs)
    ? o.motifs
        .map((m: unknown): ProfileMotif | null => {
          if (!m || typeof m !== "object") return null;
          const r = m as Record<string, unknown>;
          const name = typeof r.name === "string" ? r.name.trim() : "";
          const desc = typeof r.desc === "string" ? r.desc.trim() : "";
          if (!name) return null;
          const dreams = typeof r.dreams === "string" ? r.dreams.trim() : undefined;
          return { name, desc, dreams: dreams || undefined };
        })
        .filter((x): x is ProfileMotif => x !== null)
    : [];

  const emotion_distribution: ProfileEmotionItem[] = Array.isArray(o.emotion_distribution)
    ? o.emotion_distribution
        .map((m: unknown): ProfileEmotionItem | null => {
          if (!m || typeof m !== "object") return null;
          const r = m as Record<string, unknown>;
          const label = typeof r.label === "string" ? r.label.trim() : "";
          const n =
            typeof r.percent === "number"
              ? r.percent
              : typeof r.percent === "string"
              ? parseFloat(r.percent)
              : NaN;
          if (!label || !Number.isFinite(n)) return null;
          return { label, percent: Math.max(0, Math.min(100, n)) };
        })
        .filter((x): x is ProfileEmotionItem => x !== null)
    : [];

  const motif_frequency: ProfileMotifFreq[] = Array.isArray(o.motif_frequency)
    ? o.motif_frequency
        .map((m: unknown): ProfileMotifFreq | null => {
          if (!m || typeof m !== "object") return null;
          const r = m as Record<string, unknown>;
          const label = typeof r.label === "string" ? r.label.trim() : "";
          const n =
            typeof r.count === "number"
              ? r.count
              : typeof r.count === "string"
              ? parseInt(r.count, 10)
              : NaN;
          if (!label || !Number.isFinite(n)) return null;
          return { label, count: Math.max(0, Math.round(n)) };
        })
        .filter((x): x is ProfileMotifFreq => x !== null)
    : [];

  return { understanding, motifs, emotion_distribution, motif_frequency };
}
