import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/overview");
  }
  const t = await getTranslations("admin.login");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ds-surface-warm px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-ds-border-light bg-ds-background p-8 shadow-md">
        <div className="mb-6 text-center">
          <p className="font-heading text-2xl font-bold tracking-tight text-ds-text">
            {t("title")}
          </p>
          <p className="mt-2 text-xs tracking-wider uppercase text-ds-text-secondary font-body">
            {t("subtitle")}
          </p>
        </div>
        <div className="my-6 border-t border-ds-border" />
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
