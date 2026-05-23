"use client";

import { useEffect, useRef } from "react";

// 取自 particles.html 的实现,改成 React 组件、严格用 DESIGN.md 的紫蓝色
// token。作为 hero 的背景层(absolute inset-0,父容器 relative)。
const COLORS = ["#8B7CF6", "#5B8DEF", "#a78bfa", "#c4b5fd"];
const MOUSE_RADIUS = 130; // CSS px

interface Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  r: number;
  color: string;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  baseAlpha: number;
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // 尊重用户的减弱动效偏好:直接不渲染粒子,留一片静态深色
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let particles: Particle[] = [];
    const mouse = { x: -9999, y: -9999, active: false };

    const dpr = () => window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      W = canvas.width = canvas.offsetWidth * dpr();
      H = canvas.height = canvas.offsetHeight * dpr();
    }

    function init() {
      resize();
      particles = [];
      const count = Math.min(
        140,
        Math.floor((W * H) / (22000 * dpr()))
      );
      for (let i = 0; i < count; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        particles.push({
          x,
          y,
          homeX: x,
          homeY: y,
          r: (Math.random() * 1.6 + 0.4) * dpr(),
          color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
          vx: (Math.random() - 0.5) * 0.12 * dpr(),
          vy: (Math.random() - 0.5) * 0.12 * dpr(),
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.012 + 0.004,
          baseAlpha: Math.random() * 0.5 + 0.2,
        });
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H * 0.5;
      const mr = MOUSE_RADIUS * dpr();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.homeX += p.vx;
        p.homeY += p.vy;
        if (p.homeX < 0) p.homeX = W;
        if (p.homeX > W) p.homeX = 0;
        if (p.homeY < 0) p.homeY = H;
        if (p.homeY > H) p.homeY = 0;

        // 光标推开
        let mouseGlow = 0;
        if (mouse.active) {
          const dxm = p.x - mouse.x;
          const dym = p.y - mouse.y;
          const dm = Math.sqrt(dxm * dxm + dym * dym);
          if (dm < mr && dm > 0.001) {
            const force = 1 - dm / mr;
            p.x += (dxm / dm) * force * 2.2 * dpr();
            p.y += (dym / dm) * force * 2.2 * dpr();
            mouseGlow = force;
          }
        }
        // 缓慢拉回 home(弹性)
        p.x += (p.homeX - p.x) * 0.02;
        p.y += (p.homeY - p.y) * 0.02;

        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        p.phase += p.speed;
        const alpha = p.baseAlpha * (0.5 + 0.5 * Math.sin(p.phase));

        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const centerBoost = Math.max(0, 1 - dist / (W * 0.55));

        const finalAlpha = Math.min(
          1,
          alpha + centerBoost * 0.25 + mouseGlow * 0.5
        );
        const glowR = p.r * (4 + mouseGlow * 3);

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        g.addColorStop(0, hexA(p.color, finalAlpha));
        g.addColorStop(1, hexA(p.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hexA(p.color, Math.min(1, finalAlpha + 0.3));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 临近粒子连线
      const maxD = 110 * dpr();
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]!;
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxD) {
            const lineAlpha = (1 - d / maxD) * 0.12;
            ctx.strokeStyle = hexA("#8B7CF6", lineAlpha);
            ctx.lineWidth = 0.5 * dpr();
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // 光标拉线
      if (mouse.active) {
        for (const p of particles) {
          const dxm = p.x - mouse.x;
          const dym = p.y - mouse.y;
          const dm = Math.sqrt(dxm * dxm + dym * dym);
          if (dm < mr) {
            const lineAlpha = (1 - dm / mr) * 0.5;
            ctx.strokeStyle = hexA("#a78bfa", lineAlpha);
            ctx.lineWidth = 0.7 * dpr();
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function updateMouseFromEvent(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const xCss = e.clientX - rect.left;
      const yCss = e.clientY - rect.top;
      // 只在鼠标处于 canvas 矩形范围内时激活;否则视为离开,避免远处也拖着线
      if (
        xCss < 0 ||
        yCss < 0 ||
        xCss > rect.width ||
        yCss > rect.height
      ) {
        mouse.active = false;
        mouse.x = -9999;
        mouse.y = -9999;
        return;
      }
      mouse.x = xCss * dpr();
      mouse.y = yCss * dpr();
      mouse.active = true;
    }
    function onLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    init();
    draw();

    // 监听 window:粒子层是 pointer-events-none,自己接不到事件;
    // 挂 window 上同时算 canvas 相对坐标,文字区域也能驱动粒子跟随
    window.addEventListener("mousemove", updateMouseFromEvent);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", init);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", updateMouseFromEvent);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      // 向下延伸 600px,粒子有更大的纵向舞台,首屏不会被压扁。
      // 底部用 mask-image 柔和淡出,避免硬切到下方正文区。
      className="pointer-events-none absolute left-0 right-0 top-0 z-0"
      style={{
        bottom: "-600px",
        WebkitMaskImage:
          "linear-gradient(180deg, #000 0%, #000 65%, transparent 100%)",
        maskImage:
          "linear-gradient(180deg, #000 0%, #000 65%, transparent 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
