import { TeamBoard } from "@/app/components/admin/TeamBoard";

export const metadata = { title: "Client board · Team" };

export default async function ClientBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeamBoard clientId={id} />;
}
