import type { Metadata } from "next";
import { Figtree, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Strategize × RT Digital | Client Dashboard",
  description:
    "Shared client dashboard for clarifying the offer, shaping the campaign, and moving qualified trade owners from ad click to booked consult.",
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
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${figtreeHeading.variable} ${figtreeBody.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
