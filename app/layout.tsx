import type { Metadata } from "next";
import { Archivo, DM_Mono, DM_Sans, Figtree, IBM_Plex_Mono, Instrument_Serif, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Client-portal typography, exposed as semantic --font-heading / --font-body so
// the whole scheme can be re-pointed from this one file.
// One family, two voices: Figtree black (800/900) for display headings —
// per the Claude Design task-view mockup Jesse picked (2026-07-19) — over
// regular Figtree body. Fraunces (serif) was tried for a few hours and retired
// the same day in favour of this heavier single-family look.
const figtreeHeading = Figtree({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["800", "900"],
});

const figtreeBody = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Welcome marquee (design handoff 2026-08-10): serif wordmark + Archivo UI.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

// "Handoff" design skin (demo review toggle) re-points the portal type to
// DM Sans / DM Mono via [data-pj-design="handoff"] in globals.css.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  // Neutral default — portal and admin pages set their own titles. The old
  // "Strategize ×" title leaked into every tab (client-visible); gone per
  // Jesse 2026-08-06.
  title: "RT Digital",
  description: "Client portal by RT Digital.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${figtreeHeading.variable} ${figtreeBody.variable} ${instrumentSerif.variable} ${archivo.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
