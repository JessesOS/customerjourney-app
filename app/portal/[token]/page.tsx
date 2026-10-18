import { notFound } from "next/navigation";
import { ClientPortalExperience } from "@/app/components/portal/ClientPortalExperience";
import { PortalPausedNotice } from "@/app/components/portal/PortalPausedNotice";
import {
  computeCurrentDay,
  getAllMilestoneContent,
  getAllMilestoneUploadsMeta,
  getCompletedMilestoneIds,
  getMilestoneNotes,
  getPortalClientByToken,
  isPortalThemeVariant,
} from "@/lib/portalClientStore";
import { tabTitle } from "@/lib/journeyBuild";
import { portalJourneyFor } from "@/lib/productRegistry";

// The browser tab: a custom product shows its own name (BSS: "BSS Launchpad").
// A product with a home-screen icon also gets the "Add to Home Screen" app
// settings: its icon, full screen, and a manifest that opens this client's link.
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);
  if (!client) return { title: "Client Portal" };
  const journey = portalJourneyFor(client.clientType);
  const title = tabTitle(journey);
  if (!journey.appIcon) return { title };
  const icon = (size: number) => `/portal/icons/${journey.appIcon}-${size}.png`;
  return {
    title,
    manifest: `/api/portal/${token}/manifest`,
    icons: { icon: [{ url: icon(192), sizes: "192x192", type: "image/png" }], apple: [{ url: icon(180), sizes: "180x180" }] },
    appleWebApp: { capable: true, title, statusBarStyle: "black-translucent" as const },
    // Older iPhones read only this name for "open full screen".
    other: { "apple-mobile-web-app-capable": "yes" },
  };
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);

  if (!client) {
    notFound();
  }

  // Everything the portal shows for this client's product, from its product file.
  const journey = portalJourneyFor(client.clientType);

  // A paused client sees a short notice instead of their portal (Jesse, 2026-10-17).
  if (client.journeyState === "paused") {
    return <PortalPausedNotice firstName={client.name.trim().split(/\s+/)[0] ?? ""} brand={tabTitle(journey)} portalToken={token} />;
  }

  const [completedIds, currentDay, milestoneNotes, milestoneContent, milestoneUploads] = await Promise.all([
    getCompletedMilestoneIds(client.id),
    Promise.resolve(computeCurrentDay(client.startDate, journey.totalDays)),
    getMilestoneNotes(client.id),
    getAllMilestoneContent(client.id),
    getAllMilestoneUploadsMeta(client.id),
  ]);

  // Anti-flash veil: the welcome-or-not decision lives in localStorage, which
  // only the browser can read — without this, the journey rail paints for a
  // frame or two before the welcome overlay mounts. This inline script runs
  // before first paint and hides the page when the welcome is due; the
  // experience component lifts the veil once the welcome (or the rail, on a
  // return visit) is actually mounted.
  const veilScript = `try{var q=new URLSearchParams(location.search);if(q.get("welcome")==="1"||localStorage.getItem(${JSON.stringify(`pjWelcomed:${token}`)})!=="1"){document.documentElement.setAttribute("data-welcome-pending","1")}}catch(e){}`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: veilScript }} />
      <style>{`html[data-welcome-pending] body{visibility:hidden;background:#f6f3ec}`}</style>
      <ClientPortalExperience
        name={client.name}
        journey={journey}
        currentDay={currentDay}
        calendarDay={computeCurrentDay(client.startDate, 100000)}
        initialCompletedMilestoneIds={[...completedIds]}
        initialMilestoneNotes={milestoneNotes}
        milestoneContent={milestoneContent}
        milestoneUploads={milestoneUploads}
        portalToken={token}
        themeVariant={journey.lockedLook ?? (isPortalThemeVariant(client.themeVariant) ? client.themeVariant : "handoff")}
      />
    </>
  );
}
