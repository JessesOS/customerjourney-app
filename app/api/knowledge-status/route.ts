import { requestCanAdmin } from "@/lib/adminAuth";
import { getKnowledgeStatus, summarizeKnowledgeStatus } from "@/lib/knowledgeStore";

export async function GET(request: Request) {
  const status = await getKnowledgeStatus();
  return Response.json(requestCanAdmin(request) ? status : summarizeKnowledgeStatus(status));
}
