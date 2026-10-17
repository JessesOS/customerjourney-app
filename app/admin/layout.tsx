import "./admin.css";
import { AdminShell } from "@/app/components/admin/AdminShell";

/**
 * Wraps every /admin page. With the team board switched on (staging, and prod
 * after go-live) it adds the back-office menu; with it off, pages render
 * exactly as before.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
