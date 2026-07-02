import { notFound } from "next/navigation";
import { ClientPortalExperience } from "@/app/components/portal/ClientPortalExperience";
import { computeCurrentDay, getCompletedMilestoneIds, getPortalClientByToken } from "@/lib/portalClientStore";

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

  const [completedIds, currentDay] = await Promise.all([
    getCompletedMilestoneIds(client.id),
    Promise.resolve(computeCurrentDay(client.startDate)),
  ]);

  return (
    <ClientPortalExperience
      name={client.name}
      currentDay={currentDay}
      initialCompletedMilestoneIds={[...completedIds]}
      portalToken={token}
    />
  );
}
