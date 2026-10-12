"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Funnel welcome (motion redesign, 2026-10-11; brief and bar in motion/).
 * One cobalt field with the offer drawn as a moving picture, in code: enquiries
 * (dots) arrive from everywhere, squeeze through a funnel and land as booked
 * jobs (bars). No video. One canvas serves desktop (left to right) and phones
 * (top to bottom). "Get started" is live from the first frame; pressing it
 * closes the field into the button, then hands off to the journey page.
 * The tagline was removed on Jesse's instruction: the offer is no longer
 * trades-only, and no replacement line has been written.
 */

const COBALT = "#1F4BFF";
const N = 90; // dots on screen
const ROWS = 7; // booked rows
const PER_ROW = 6; // dots that fill one row
const EXIT_MS = 700;

type Dot = { t: number; speed: number; off: number; wob: number; sx: number; sy: number; row: number; r: number; px: number; py: number };

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function WelcomeFunnel({ brand, color = COBALT, onStart }: { brand: "scale" | "respond"; color?: string; onStart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [exit, setExit] = useState<{ x: number; y: number } | null>(null);
  const wordmark = brand === "respond" ? "CRM" : "Scale"; // the second product is shown as "CRM" (Jesse 2026-10-12)

  useEffect(() => {
    const cv = canvasRef.current;
    const g = cv?.getContext("2d");
    if (!cv || !g) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, D = 1, tall = false, raf = 0;
    let F = { mx: 0, my: 0, nx: 0, ny: 0, spread: 0, pinch: 0, rowX: 0, rowY: 0, rowW: 0, rowH: 0, gap: 0 };
    const target = new Array<number>(ROWS).fill(0); // how full each row should be
    const shown = new Array<number>(ROWS).fill(0); // how full it is drawn (eases toward target)
    const pulse = new Array<number>(ROWS).fill(0); // brief glow when a row completes
    let boardFade = 1; // fades the rows out before the board starts again
    let resetting = false;
    const dots: Dot[] = [];

    function layout() {
      D = Math.min(window.devicePixelRatio || 1, 2);
      W = cv!.width = window.innerWidth * D;
      H = cv!.height = window.innerHeight * D;
      tall = H > W * 1.1;
      F = tall
        ? { mx: W * 0.5, my: H * 0.2, nx: W * 0.5, ny: H * 0.36, spread: W * 0.34, pinch: W * 0.035, rowX: W * 0.25, rowY: H * 0.43, rowW: W * 0.5, rowH: H * 0.018, gap: H * 0.012 }
        : { mx: W * 0.42, my: H * 0.36, nx: W * 0.6, ny: H * 0.36, spread: H * 0.26, pinch: H * 0.022, rowX: W * 0.8, rowY: H * 0.17, rowW: W * 0.17, rowH: H * 0.03, gap: H * 0.022 };
    }
    function spawn(d: Dot, first: boolean) {
      d.t = first ? Math.random() : 0;
      d.speed = 0.055 + Math.random() * 0.035; // one trip takes about 11 to 18 seconds
      d.off = Math.random() * 2 - 1;
      d.wob = Math.random() * 6.28;
      d.r = 2.2 + Math.random() * 2;
      d.row = Math.floor(Math.random() * ROWS);
      if (tall) { d.sx = Math.random() * W; d.sy = -H * 0.03 - Math.random() * H * 0.05; }
      else { d.sx = -W * 0.03 - Math.random() * W * 0.05; d.sy = Math.random() * H * 0.72; }
      d.px = NaN; d.py = NaN;
    }
    function place(d: Dot): [number, number, number] {
      const mx = tall ? F.mx + d.off * F.spread : F.mx, my = tall ? F.my : F.my + d.off * F.spread;
      const nx = tall ? F.nx + d.off * F.pinch : F.nx, ny = tall ? F.ny : F.ny + d.off * F.pinch;
      const tx = F.rowX + F.rowW * (0.15 + 0.7 * ((d.off + 1) / 2));
      const ty = F.rowY + d.row * (F.rowH + F.gap) + F.rowH / 2;
      if (d.t < 0.45) { const k = ease(d.t / 0.45); return [lerp(d.sx, mx, k), lerp(d.sy, my, k), 1]; }
      if (d.t < 0.7) { const k = ease((d.t - 0.45) / 0.25); return [lerp(mx, nx, k), lerp(my, ny, k), 1]; }
      const k = ease((d.t - 0.7) / 0.3);
      return [lerp(nx, tx, k), lerp(ny, ty, k), 1 - k * 0.6];
    }
    function drawFunnel(reveal: number) {
      g!.lineWidth = 2 * D;
      g!.lineCap = "round";
      for (const s of [-1, 1]) {
        const grad = tall ? g!.createLinearGradient(0, F.my, 0, F.ny + H * 0.03) : g!.createLinearGradient(F.mx, 0, F.nx + W * 0.03, 0);
        grad.addColorStop(0, "rgba(255,255,255,0.08)");
        grad.addColorStop(1, "rgba(255,255,255,0.5)");
        g!.strokeStyle = grad;
        g!.globalAlpha = reveal;
        g!.beginPath();
        if (tall) { g!.moveTo(F.mx + s * F.spread * 1.08, F.my); g!.quadraticCurveTo(F.nx + s * F.pinch * 2.4, lerp(F.my, F.ny, 0.55), F.nx + s * F.pinch * 2.4, F.ny + H * 0.03); }
        else { g!.moveTo(F.mx, F.my + s * F.spread * 1.08); g!.quadraticCurveTo(lerp(F.mx, F.nx, 0.55), F.ny + s * F.pinch * 2.4, F.nx + W * 0.03, F.ny + s * F.pinch * 2.4); }
        g!.stroke();
      }
      g!.globalAlpha = 1;
    }
    function drawRows(reveal: number) {
      for (let i = 0; i < ROWS; i++) {
        const y = F.rowY + i * (F.rowH + F.gap), r = F.rowH / 2;
        const a = Math.max(0, Math.min(1, reveal * ROWS - i)) * boardFade; // rows arrive one after another
        g!.beginPath(); g!.roundRect(F.rowX, y, F.rowW, F.rowH, r);
        g!.fillStyle = `rgba(255,255,255,${0.16 * a})`; g!.fill();
        if (shown[i] > 0.01) {
          if (pulse[i] > 0.01) { g!.shadowColor = "rgba(255,255,255,0.9)"; g!.shadowBlur = 12 * D * pulse[i]; }
          g!.beginPath(); g!.roundRect(F.rowX, y, Math.max(F.rowH, F.rowW * shown[i]), F.rowH, r);
          g!.fillStyle = `rgba(255,255,255,${a})`; g!.fill();
          g!.shadowBlur = 0;
        }
      }
    }

    layout();
    for (let i = 0; i < N; i++) { const d = {} as Dot; spawn(d, true); dots.push(d); }
    window.addEventListener("resize", layout);

    if (reduced) { shown.fill(1); drawFunnel(1); drawRows(1); return () => window.removeEventListener("resize", layout); }

    const t0 = performance.now();
    let last = t0;
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const reveal = Math.min(1, (now - t0) / 1100); // funnel and rows fade in over the first second
      g!.clearRect(0, 0, W, H);
      drawFunnel(reveal);
      for (let i = 0; i < ROWS; i++) { shown[i] = lerp(shown[i], target[i], Math.min(1, dt * 5)); pulse[i] = Math.max(0, pulse[i] - dt * 1.4); }
      if (resetting) { boardFade = Math.max(0, boardFade - dt / 0.6); if (boardFade === 0) { target.fill(0); shown.fill(0); resetting = false; } }
      else boardFade = Math.min(1, boardFade + dt / 0.6);
      drawRows(reveal);
      for (const d of dots) {
        d.t += d.speed * dt;
        if (d.t >= 1) {
          if (!resetting && target[d.row] < 1) { target[d.row] = Math.min(1, target[d.row] + 1 / PER_ROW); if (target[d.row] >= 1) pulse[d.row] = 1; }
          spawn(d, false);
        }
        const [bx, by, a] = place(d);
        const wob = Math.sin(now / 900 + d.wob) * 3 * D * (1 - d.t);
        const x = bx + wob, y = by + wob * 0.6;
        if (!Number.isNaN(d.px)) { // a short streak behind each dot
          g!.strokeStyle = `rgba(255,255,255,${0.22 * a})`; g!.lineWidth = d.r * D * 0.9;
          g!.beginPath(); g!.moveTo(d.px, d.py); g!.lineTo(x, y); g!.stroke();
        }
        g!.beginPath(); g!.arc(x, y, d.r * D, 0, 6.283); g!.fillStyle = `rgba(255,255,255,${0.92 * a * reveal})`; g!.fill();
        d.px = lerp(Number.isNaN(d.px) ? x : d.px, x, 0.35); d.py = lerp(Number.isNaN(d.py) ? y : d.py, y, 0.35);
      }
      if (!resetting && target.every((v) => v >= 1) && shown.every((v) => v > 0.97) && pulse.every((v) => v < 0.05)) resetting = true;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", layout); };
  }, []);

  function start() {
    if (exit) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const b = buttonRef.current?.getBoundingClientRect();
    if (reduced || !b) { onStart(); return; }
    setExit({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
    window.setTimeout(onStart, EXIT_MS);
  }

  return (
    <div
      className="pj-funnel"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: color,
        color: "#fff",
        fontFamily: "var(--font-geist), system-ui, sans-serif",
        overflow: "hidden",
        // The handoff: the field closes into the button, revealing the journey page behind it.
        clipPath: exit ? `circle(0px at ${exit.x}px ${exit.y}px)` : "circle(150% at 50% 50%)",
        transition: `clip-path ${EXIT_MS}ms cubic-bezier(0.2, 0.7, 0.2, 1)`,
      }}
    >
      <canvas ref={canvasRef} aria-hidden data-xray="Funnel · canvas, drawn in code" data-xray-tool="code" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
      <div className="pj-funnel-copy">
        <h1 style={{ fontWeight: 600, fontSize: "clamp(64px, 8vw, 106px)", lineHeight: 1, letterSpacing: "-0.02em", margin: 0 }}>{wordmark}</h1>
      </div>
      <button ref={buttonRef} type="button" onClick={start} className="pj-funnel-cta">
        Get started
      </button>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, textAlign: "center", fontSize: 12, opacity: 0.6 }}>
        Terms &amp; Conditions · Privacy Policy
      </div>
    </div>
  );
}
