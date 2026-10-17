import { notFound } from "next/navigation";
import { ClientPortalExperience } from "@/app/components/portal/ClientPortalExperience";
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
import type { ClientType } from "@/products";

// The browser tab: a custom product shows its own name (BSS: "BSS Launchpad").
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);
  return { title: client ? tabTitle(portalJourneyFor(client.clientType)) : "Client Portal" };
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
        clientType={client.clientType as ClientType}
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
