"use client";

/**
 * First-visit welcome landing (reference: Imprint's launch screen). A
 * full-bleed mosaic of trade-services iconography — every tile hand-drawn
 * SVG coloured by the --pj-* tokens, so the screen re-themes warm/cool with
 * the portal — over a bottom panel with the brand wordmark and one action.
 * Shown once per device (ClientPortalExperience owns that logic).
 */

type Tile = { bg: string; art: React.ReactNode };

const cream = "var(--pj-card)";

// Bold flat-geometric marks, one idea per tile, ~4 shapes max. All 100×100.
const TILES: Tile[] = [
  {
    // Wrench
    bg: "var(--pj-act)",
    art: (
      <g fill={cream}>
        <path d="M63 22a16 16 0 0 0-17 25L26 67a8 8 0 1 0 11 11l20-20a16 16 0 0 0 21-21l-10 10-9-2-2-9 10-10a16 16 0 0 0-4-4z" />
      </g>
    ),
  },
  {
    // Hard hat
    bg: "var(--pj-done)",
    art: (
      <g fill={cream}>
        <path d="M50 26c-14 0-25 11-25 25v6h50v-6c0-14-11-25-25-25z" />
        <rect x="44" y="20" width="12" height="14" rx="4" />
        <rect x="18" y="60" width="64" height="8" rx="4" />
      </g>
    ),
  },
  {
    // Ute / work van
    bg: "var(--pj-withus)",
    art: (
      <g fill={cream}>
        <path d="M18 44h34l8-12h14a6 6 0 0 1 6 6v22H18z" />
        <circle cx="34" cy="64" r="8" />
        <circle cx="68" cy="64" r="8" />
      </g>
    ),
  },
  {
    // House + roofline
    bg: "var(--pj-upnext)",
    art: (
      <g fill={cream}>
        <path d="M50 22 18 48h10v28h44V48h10z" />
        <rect x="44" y="58" width="12" height="18" fill="var(--pj-upnext)" />
      </g>
    ),
  },
  {
    // Lightning bolt (sparkie)
    bg: "color-mix(in srgb, var(--pj-ink) 76%, var(--pj-bg))",
    art: <path d="M56 16 30 54h14l-6 30 28-42H50z" fill="var(--pj-act)" />,
  },
  {
    // Pipe elbow (plumbing)
    bg: "var(--pj-done)",
    art: (
      <g fill={cream}>
        <path d="M34 18h16v32h32v16H34z" />
        <rect x="28" y="14" width="28" height="10" rx="3" />
        <rect x="78" y="44" width="10" height="28" rx="3" />
      </g>
    ),
  },
  {
    // Paint roller
    bg: "var(--pj-act)",
    art: (
      <g fill={cream}>
        <rect x="22" y="24" width="44" height="18" rx="6" />
        <path d="M66 30h12v18H54v10h-8V44h20z" fill="var(--pj-act-ink)" opacity="0.9" />
        <rect x="42" y="60" width="10" height="22" rx="3" />
      </g>
    ),
  },
  {
    // Ladder
    bg: "var(--pj-withus)",
    art: (
      <g stroke={cream} strokeWidth="7" strokeLinecap="round">
        <path d="M36 16v68M64 16v68" />
        <path d="M36 30h28M36 48h28M36 66h28" />
      </g>
    ),
  },
  {
    // Phone + AI waves (receptionist)
    bg: "color-mix(in srgb, var(--pj-ink) 76%, var(--pj-bg))",
    art: (
      <g>
        <rect x="26" y="20" width="30" height="60" rx="8" fill={cream} />
        <path d="M64 40a14 14 0 0 1 0 20M72 32a26 26 0 0 1 0 36" stroke="var(--pj-done)" strokeWidth="6" strokeLinecap="round" fill="none" />
      </g>
    ),
  },
  {
    // Booked-solid calendar
    bg: "var(--pj-done)",
    art: (
      <g>
        <rect x="20" y="26" width="60" height="52" rx="8" fill={cream} />
        <rect x="20" y="26" width="60" height="14" rx="7" fill="var(--pj-ink)" opacity="0.25" />
        <path d="m36 58 10 10 18-20" stroke="var(--pj-done)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    ),
  },
  {
    // Map pin + route
    bg: "var(--pj-act)",
    art: (
      <g>
        <path d="M22 78c14 2 18-10 30-10" stroke={cream} strokeWidth="6" strokeLinecap="round" strokeDasharray="1 12" fill="none" />
        <path d="M62 20a16 16 0 0 0-16 16c0 12 16 30 16 30s16-18 16-30a16 16 0 0 0-16-16z" fill={cream} />
        <circle cx="62" cy="36" r="7" fill="var(--pj-act)" />
      </g>
    ),
  },
  {
    // Five-star job
    bg: "var(--pj-withus)",
    art: (
      <g fill={cream}>
        {[26, 50, 74].map((x) => (
          <path key={x} d={`m${x} 30 4.7 9.6 10.6 1.5-7.7 7.4 1.9 10.5-9.5-5-9.5 5 1.9-10.5-7.7-7.4 10.6-1.5z`} />
        ))}
        <path d="m38 66 3 6 6.6 1-4.8 4.6 1.2 6.5-6-3.1-6 3.1 1.2-6.5-4.8-4.6 6.6-1zM62 66l3 6 6.6 1-4.8 4.6 1.2 6.5-6-3.1-6 3.1 1.2-6.5-4.8-4.6 6.6-1z" />
      </g>
    ),
  },
  {
    // Power drill
    bg: "var(--pj-upnext)",
    art: (
      <g fill={cream}>
        <path d="M24 34h38a8 8 0 0 1 8 8v6a8 8 0 0 1-8 8H44l-4 18h-12l4-18h-8z" />
        <rect x="70" y="40" width="14" height="8" rx="3" />
      </g>
    ),
  },
  {
    // Tape measure
    bg: "color-mix(in srgb, var(--pj-ink) 76%, var(--pj-bg))",
    art: (
      <g>
        <circle cx="44" cy="46" r="22" fill={cream} />
        <circle cx="44" cy="46" r="8" fill="var(--pj-ink)" />
        <path d="M66 46h18v10H66z" fill={cream} />
        <path d="M80 46v10" stroke="var(--pj-ink)" strokeWidth="3" />
      </g>
    ),
  },
  {
    // Toolbox
    bg: "var(--pj-act)",
    art: (
      <g fill={cream}>
        <rect x="20" y="40" width="60" height="34" rx="7" />
        <path d="M40 40v-6a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v6h-8v-4h-4v4z" />
        <rect x="20" y="52" width="60" height="6" fill="var(--pj-act)" opacity="0.55" />
      </g>
    ),
  },
  {
    // Sun over roofline (early starts)
    bg: "var(--pj-done)",
    art: (
      <g fill={cream}>
        <circle cx="50" cy="44" r="16" />
        <path d="M14 78l18-16 12 10 16-14 26 20z" opacity="0.9" />
      </g>
    ),
  },
  {
    // Spanner + bolt head
    bg: "var(--pj-upnext)",
    art: (
      <g fill={cream}>
        <path d="m50 24 12 7v14l-12 7-12-7V31z" />
        <circle cx="50" cy="38" r="6" fill="var(--pj-upnext)" />
        <rect x="44" y="56" width="12" height="26" rx="5" />
      </g>
    ),
  },
  {
    // Growth bars
    bg: "color-mix(in srgb, var(--pj-ink) 76%, var(--pj-bg))",
    art: (
      <g fill="var(--pj-act)">
        <rect x="24" y="58" width="12" height="20" rx="3" />
        <rect x="44" y="44" width="12" height="34" rx="3" fill="var(--pj-done)" />
        <rect x="64" y="26" width="12" height="52" rx="3" fill={cream} />
      </g>
    ),
  },
];

export function WelcomeScreen({ name, brand, onStart }: { name: string; brand: "scale" | "respond"; onStart: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", background: "var(--pj-ink)" }}>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }} aria-hidden>
        <div className="pj-welcome-grid">
          {/* Cycle the tile set so every 8-wide row fills; the frame crops the
              overflow. Art is scaled down inside each tile (negative space
              frames the mark), and each tile drifts on its own slow phase. */}
          {[...TILES, ...TILES].map((tile, i) => (
            <div
              key={i}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: "18%",
                background: tile.bg,
                overflow: "hidden",
                animation: `pjWelcomeTile 0.5s ${i * 40}ms cubic-bezier(0.2, 0.7, 0.2, 1) both, pjWelcomeFloat ${5.5 + (i % 5) * 0.9}s ${(i % 7) * 0.6}s ease-in-out infinite`,
              }}
            >
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <g transform="translate(50 50) scale(0.66) translate(-50 -50)">{tile.art}</g>
              </svg>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          background: "var(--pj-bg)",
          padding: "clamp(26px, 4.5vh, 40px) 24px clamp(28px, 5vh, 44px)",
          textAlign: "center",
          animation: "pjWelcomePanel 0.55s 0.15s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        }}
      >
        <div style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: "clamp(34px, 4.5vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--pj-ink)", lineHeight: 1 }}>
          {brand}
        </div>
        <p style={{ margin: "12px 0 22px", fontSize: 15, color: "var(--pj-muted)" }}>
          Welcome, {name} — your journey starts here.
        </p>
        <button
          type="button"
          onClick={onStart}
          style={{
            background: "var(--pj-btn-grad)",
            color: "var(--pj-act-ink)",
            fontWeight: 650,
            fontSize: 15.5,
            border: "none",
            borderRadius: "var(--pj-radius-pill)",
            padding: "15px 42px",
            cursor: "pointer",
            boxShadow: "var(--pj-shadow-btn)",
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          Start here →
        </button>
      </div>
    </div>
  );
}
