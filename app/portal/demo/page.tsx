import { ClientPortalExperience } from "@/app/components/portal/ClientPortalExperience";
import { DEFAULT_CLIENT_TYPE, portalJourneyFor } from "@/lib/productRegistry";

export const metadata = {
  title: "Client Portal",
};

// Code-only demo (no DB): starts as a brand-new client — day 1, nothing
// complete — so a review walks the exact first-run a real client gets:
// welcome mosaic → Stage 1, first task. Completing tasks advances the
// journey in memory, so later states are reachable by clicking through.
export default function PortalDemoPage() {
  return <ClientPortalExperience name="Chris" journey={portalJourneyFor(DEFAULT_CLIENT_TYPE)} currentDay={1} initialCompletedMilestoneIds={[]} themeVariant="grove" />;
}
