# DESIGN.md — 解梦平台视觉设计规范

> 这份文档是**视觉宪法**，和 PRODUCT.md（产品宪法）配套使用。
> PRODUCT.md 管「做什么」，DESIGN.md 管「长什么样」。
>
> **给实现者（Claude Code 等）的核心约束：**
> 1. 本文档的**设计 token（颜色、字体、间距、圆角）是硬约束，不要改、不要"优化"成别的配色**。
>    尤其不要因为"紫色渐变是 AI 套路"就回避——这是本产品刻意选定的品牌色。
> 2. 同目录下的 `design-sample.html` 是这套规范的**活样本**，先在浏览器打开它、理解气质，再动手。
>    它不是要被一字不差复制的最终页面，而是「正确的味道」的基准。
> 3. 布局、动效、组件的**具体编排可以在本规范基础上自由发挥得更好**——
>    规范定的是"调色板和乐器"，不是"每个音符"。鼓励做得比样本更精致。
> 4. **所有视觉效果用纯 CSS / SVG / Canvas 实现，不依赖外部图片素材**。
>    （这正是之前直接扒别人源代码失败的原因：那些代码依赖拿不到的图片资源。）

---

## 0. 设计气质一句话

**深空里的一盏温柔的光。** 暗色、克制、专业，但不冰冷、不神秘玄学。
参考气质：Reflect（笔记类 App）的落地页——深蓝紫底色、中央发光体、极细的微光边框、
从亮到暗的渐变标题、居中胶囊导航。把那种"高级感"用在一个心理学解梦产品上。

**要：** 现代、克制、有呼吸感、专业中带温度。
**不要：** 塔罗牌、水晶球、星座符号、廉价的神秘紫黑、浮夸的发光、AI 默认的白底蓝边。

---

## 1. 颜色 Token（硬约束，精确色值）

```css
:root {
  /* 背景：深空蓝紫，不是纯黑，带蓝调 */
  --bg-base:        #0a0a14;   /* 页面最底色 */
  --bg-elevated:    #12121f;   /* 卡片 / 浮层底色 */
  --bg-elevated-2:  #181826;   /* 更高一层：hover、输入框内部 */

  /* 边框：极细、低对比，靠微光不靠实线 */
  --border-subtle:  rgba(255,255,255,0.06);
  --border-glow:    rgba(139,124,246,0.25);  /* 紫色微光边，用于 hover / 聚焦 */

  /* 文字：三级灰阶，主文字绝不用纯白 #fff */
  --text-primary:   #ECECF1;   /* 标题、正文 */
  --text-secondary: #9A9AB0;   /* 副文字、说明 */
  --text-tertiary:  #5C5C70;   /* 最弱：占位符、时间戳、脚注 */

  /* 强调色：蓝→紫渐变，是产品灵魂 */
  --accent:         #8B7CF6;   /* 主紫 */
  --accent-blue:    #5B8DEF;   /* 偏蓝的强调 */
  --accent-soft:    rgba(139,124,246,0.12);  /* 紫色填充背景（chip、图标底） */
  --glow-core:      #a78bfa;   /* 光晕核心色 */

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
}
```

**关键纪律：**
- 主文字永远是 `--text-primary`（#ECECF1）而不是纯白，纯白在深色底上太刺眼、显廉价。
- 强调色只在"该被看见"的地方用（按钮、引用历史的文字、聚焦态），不要满屏紫。
  Reflect 的高级感恰恰来自**强调色用得很省**。
- 背景不是死黑，body 上要叠一层极淡的径向渐变氛围光（见 §5）。

---

## 2. 字体

```css
--font-display: 'Georgia', 'Songti SC', serif;   /* 标题：衬线，多一点文气和专业感 */
--font-body: -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif;  /* 正文 */
```

- **标题用衬线体**（中文落到「宋体」一类）。这是和一般 AI 默认无衬线的关键区别，
  衬线在心理学/书写/内省语境里更对味，也更"专业温柔"而非"科技冷感"。
  如果引入 Web 字体，英文标题可考虑 `Newsreader`、`Fraunces`、`Spectral` 这类有性格的衬线。
- **正文用系统无衬线**，保证可读性。
- 标题字重 600，字间距收紧 `letter-spacing: -0.02em`。
- 标题尺寸用 `clamp()` 做响应式，例如 `clamp(42px, 6vw, 76px)`。

---

## 3. 标志性元素：从亮到暗的渐变标题

大标题不要用纯色，要用从上到下"白→灰"的渐变文字。这是 Reflect 标题的关键细节，
立刻提升质感：

```css
.display-title {
  background: linear-gradient(180deg, #ffffff 0%, #b8b8d0 60%, #6a6a85 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 4. 标志性元素：中央发光体（纯 CSS，不用图片）

这是页面的"灵魂"，但**用 CSS 径向渐变 + blur + 呼吸动画实现**，不依赖任何美术素材。
结构是：一个发光核心 + 一个实体小球 + 数层同心圆环，整体缓慢呼吸。

```css
.glow-stage { position:relative; height:340px; display:flex; align-items:center; justify-content:center; }
.glow-core {
  position:absolute; width:200px; height:200px; border-radius:50%;
  background: radial-gradient(circle, var(--glow-core) 0%, rgba(139,124,246,0.6) 25%, transparent 70%);
  filter: blur(20px); animation: breathe 6s ease-in-out infinite;
}
.glow-orb {
  position:relative; width:72px; height:72px; border-radius:50%; z-index:2;
  background: radial-gradient(circle at 35% 35%, #c4b5fd, var(--accent) 60%, var(--accent-blue));
  box-shadow: 0 0 60px rgba(139,124,246,0.7), inset 0 0 20px rgba(255,255,255,0.3);
  animation: breathe 6s ease-in-out infinite;
}
.glow-ring {
  position:absolute; border-radius:50%; border:1px solid rgba(139,124,246,0.15);
  animation: pulse-ring 6s ease-in-out infinite;
}
@keyframes breathe { 0%,100%{transform:scale(1);opacity:.9} 50%{transform:scale(1.08);opacity:1} }
@keyframes pulse-ring { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.6;transform:scale(1.04)} }
```

> 进阶（可选）：若想更接近 Reflect 那种"向上喷发的光锥"，可用 SVG 滤镜或 Canvas/WebGL 着色器。
> 但 MVP 阶段，上面这个 CSS 呼吸光球已能达到七八成神韵，**优先用它，别为最后两成卡住**。

---

## 5. 背景氛围

body 不要用纯色，叠一层极淡的顶部径向光，制造"深空"的纵深感：

```css
body {
  background: var(--bg-base);
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(91,141,239,0.10), transparent 60%),
    radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,124,246,0.08), transparent 50%);
  background-attachment: fixed;
}
```

---

## 6. 组件配方

### 导航：居中胶囊菜单
菜单项装在一个半透明、带模糊、999px 圆角的胶囊里居中放置；
logo 左、登录+主按钮右。这是 Reflect 的标志性布局。
```css
.nav-menu { background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle);
  border-radius:999px; padding:6px 8px; backdrop-filter:blur(10px); }
```

### 主按钮
蓝紫渐变填充 + 细白边 + 紫色投影，hover 时上浮 1px、投影加强。
```css
.btn-primary {
  background: linear-gradient(135deg, rgba(139,124,246,0.9), rgba(91,141,239,0.9));
  color:#fff; border:1px solid rgba(255,255,255,0.12); border-radius:10px;
  box-shadow:0 4px 20px rgba(139,124,246,0.3); transition:all .25s ease;
}
.btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 28px rgba(139,124,246,0.45); }
```

### 胶囊标签 / pill
小圆角胶囊，半透明底，常配一个发光小圆点。用于"越用越懂你"这类小标签。

### 卡片（含解读卡片）
`--bg-elevated` 底 + `--border-subtle` 细边 + 大圆角 + 深投影。
hover 时边框变 `--border-glow` 并加一圈淡紫外发光。
解读卡片顶部加一条紫色渐变高光线（`::before`，左右透明中间紫），强化"重要内容"的仪式感。

### 记梦输入框（90 秒捕获，产品核心入口）
大号、低压力、像聊天不像填表：大字号输入区 + 灰色友好占位符
+ 下方一排可点的 chip（「+ 当时的情绪」「+ 梦里有谁」「+ 昨天发生了什么」）。
聚焦/hover 时边框转紫微光。

### 功能网格
深底 + 极细分隔线分格（用 1px gap + border 颜色透出的手法）；
每格：小图标（紫色软底+微光边的圆角方块）+ 标题（primary）+ 副标题（secondary）。
hover 时单格背景微微提亮到 `--bg-elevated`。

---

## 7. 动效规则

- **克制、缓慢、有呼吸感**。解梦是内省场景，动效要"轻"，不要弹跳、不要快闪。
- 核心动效就一个："页面载入时元素自下而上淡入 + 中央光球持续缓慢呼吸"。
  一个编排好的载入动画，胜过满屏零碎的微交互（这也是 frontend-design skill 的建议）。
- 入场：`@keyframes rise { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`，
  多个元素用 `animation-delay` 做错落（staggered）。
- hover 过渡统一 `.2s–.25s ease`。
- 尊重 `prefers-reduced-motion`，为有需要的用户关闭动画。

---

## 8. 和 PRODUCT.md 的呼应（别只是好看，要好看得对）

- **「专业但温柔」**（PRODUCT §8）→ 衬线标题 + 暖灰文字 + 缓慢呼吸的光，而非冷硬科技风。
- **「不卖玄学」**（PRODUCT §8）→ 禁用塔罗/星座/水晶球；紫色要"深空"不要"通灵"。
- **「特异性解读」**（PRODUCT §3）→ 解读卡片里，引用用户历史的文字用 `--accent` 紫色高亮，
  让"它真的记得你"这件事在视觉上被看见。
- **「90 秒捕获」**（PRODUCT §3）→ 记梦输入框是首页最重的交互，设计上要最低压力、最易上手。
- **「心理边界」**（PRODUCT §6）→ 触发停手时的支持性界面，要更素、更静，
  去掉发光和强调色，纯文字 + 柔和留白，传递"此刻我们认真而克制"。

---

## 9. 给 Claude Code 的落地清单

1. 先打开 `design-sample.html` 看气质，再读本文档的 token。
2. 把 §1 的 CSS 变量原样建立为全局 `:root`，**不要改色值**。
3. 字体按 §2，标题务必衬线。
4. Hero 用 §3 渐变标题 + §4 CSS 光球 + §5 背景氛围。
5. 组件按 §6 配方搭，动效按 §7（克制、呼吸感）。
6. 布局和细节欢迎做得比样本更精致，但气质和 token 不许偏。
7. 不确定时回到 `design-sample.html` 和本文档；都找不到答案就停下来问人。
