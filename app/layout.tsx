import type { Metadata } from "next";
import { Figtree, Fraunces, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
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
// Editorial serif display (Fraunces, per the attn:os reference) over a warm
// humanist sans body (Figtree) — the "bold pass" direction from Jesse's
// reference set (2026-07-19).
const frauncesHeading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${frauncesHeading.variable} ${figtreeBody.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
