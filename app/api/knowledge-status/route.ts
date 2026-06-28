import { getKnowledgeStatus } from "@/lib/knowledgeStore";

export async function GET() {
  return Response.json(await getKnowledgeStatus());
}
