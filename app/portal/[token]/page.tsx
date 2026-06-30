import { readLiveDashboardSnapshot } from "@/lib/liveDashboardStore";
import { PortalView } from "@/app/components/PortalView";
import { notFound } from "next/navigation";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snapshot = await readLiveDashboardSnapshot();

  if (!snapshot || snapshot.sourceClient.portalToken !== token) {
    notFound();
  }

  return <PortalView client={snapshot.sourceClient} bridge={snapshot.bridge} />;
}
