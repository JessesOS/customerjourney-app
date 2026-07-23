import { requestCanAdmin } from "@/lib/adminAuth";
import { allMilestoneTemplates } from "@/lib/allJourneys";
import { getAllMilestoneContent, getAllMilestoneUploadsMeta, getFormResponses, getMilestoneNotes } from "@/lib/portalClientStore";

const allMilestones = allMilestoneTemplates;
const formIdsInJourney = Array.from(new Set(allMilestones.map((m) => m.formId).filter((id): id is string => Boolean(id))));
const editableMilestones = allMilestones.filter((m) => m.hasEditableContent);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const [forms, notes, content, uploadsMeta] = await Promise.all([
      Promise.all(
        formIdsInJourney.map(async (formId) => {
          const saved = await getFormResponses(id, formId);
          return { formId, responses: saved?.responses ?? null, completedAt: saved?.completedAt ?? null };
        }),
      ),
      getMilestoneNotes(id),
      getAllMilestoneContent(id),
      getAllMilestoneUploadsMeta(id),
    ]);

    const milestoneNotes = allMilestones
      .filter((m) => notes[m.id])
      .map((m) => ({ milestoneId: m.id, title: m.title, note: notes[m.id] }));

    const editableContent = editableMilestones.map((m) => ({
      milestoneId: m.id,
      title: m.title,
      content: content[m.id] ?? "",
    }));

    const uploads = allMilestones
      .filter((m) => uploadsMeta[m.id])
      .map((m) => ({ milestoneId: m.id, title: m.title, fileName: uploadsMeta[m.id].fileName, uploadedAt: uploadsMeta[m.id].uploadedAt }));

    return Response.json({ ok: true, forms, milestoneNotes, editableContent, uploads });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not load form responses." },
      { status: 500 },
    );
  }
}
