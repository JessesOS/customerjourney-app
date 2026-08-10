import { ClientPortalExperience } from "@/app/components/portal/ClientPortalExperience";

export const metadata = {
  title: "Client Portal · RT Digital",
};

// Code-only demo (no DB): starts as a brand-new client — day 1, nothing
// complete — so a review walks the exact first-run a real client gets:
// welcome mosaic → Stage 1, first task. Completing tasks advances the
// journey in memory, so later states are reachable by clicking through.
export default function PortalDemoPage() {
  return <ClientPortalExperience name="Chris" currentDay={1} initialCompletedMilestoneIds={[]} themeVariant="handoff" />;
}
