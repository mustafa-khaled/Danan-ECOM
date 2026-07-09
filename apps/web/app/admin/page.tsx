import { redirect } from "next/navigation";
import { getAdminSession } from "@/features/auth/server/admin-session";

export default async function AdminRootPage() {
  const session = await getAdminSession();
  redirect(session ? "/admin/dashboard" : "/admin/login");
}
