/**
 * The bare address of the portal. Clients only ever use their own
 * /portal/<code> link, so this just says so.
 *
 * Until 2026-10-16 this was the Codex-era "strategy room" dashboard (Chris and
 * Jesse's tasks, the live Scale bridge, the project chat), public on the same
 * host as client portals. It's in git history if it's ever needed.
 */
export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f6f3ec",
        color: "#1c1b18",
        fontFamily: "system-ui, -apple-system, sans-serif",
        textAlign: "center",
      }}
    >
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>This is a private client portal.</p>
        <p style={{ fontSize: 14, color: "#6b6860", margin: "8px 0 0" }}>Use the link we sent you to open yours.</p>
      </div>
    </main>
  );
}
