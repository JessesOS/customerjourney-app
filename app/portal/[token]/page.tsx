import { notFound } from "next/navigation";
import { ClientPortalExperience } from "@/app/components/portal/ClientPortalExperience";
import {
  computeCurrentDay,
  getAllMilestoneContent,
  getAllMilestoneUploadsMeta,
  getCompletedMilestoneIds,
  getMilestoneNotes,
  getPortalClientByToken,
} from "@/lib/portalClientStore";
import type { ClientType } from "@/lib/journeyEngine";
import { respondJourneyTotalDays } from "@/lib/respondJourney";

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

  const clientType: ClientType = (client.clientType as ClientType) ?? "meta-google";
  const totalDaysForClient = clientType === "respond" ? respondJourneyTotalDays : undefined;

  const [completedIds, currentDay, milestoneNotes, milestoneContent, milestoneUploads] = await Promise.all([
    getCompletedMilestoneIds(client.id),
    Promise.resolve(computeCurrentDay(client.startDate, totalDaysForClient)),
    getMilestoneNotes(client.id),
    getAllMilestoneContent(client.id),
    getAllMilestoneUploadsMeta(client.id),
  ]);

  return (
    <ClientPortalExperience
      name={client.name}
      clientType={clientType}
      currentDay={currentDay}
      initialCompletedMilestoneIds={[...completedIds]}
      initialMilestoneNotes={milestoneNotes}
      milestoneContent={milestoneContent}
      milestoneUploads={milestoneUploads}
      portalToken={token}
    />
  );
}
