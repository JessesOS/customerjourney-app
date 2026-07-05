import { AdminClientsPanel } from "@/app/components/admin/AdminClientsPanel";

// The page shell always renders; the client panel reads the ?token= from the
// URL and every admin API call it makes is token/header gated server-side.
// Real client data is never exposed without valid admin auth. Gating the page
// render itself is unreliable on Cloudflare Workers (searchParams / process.env
// aren't dependable at RSC render time), so enforcement lives in the API routes.
export default function AdminClientsPage() {
  return <AdminClientsPanel />;
}
