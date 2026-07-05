import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminClientsPanel } from "@/app/components/admin/AdminClientsPanel";
import { isAdminEmail, isLocalDevelopmentHost } from "@/lib/adminAuth";

export default async function AdminClientsPage() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const host = requestHeaders.get("host");

  if (!isAdminEmail(email) && !isLocalDevelopmentHost(host)) {
    notFound();
  }

  return <AdminClientsPanel />;
}
