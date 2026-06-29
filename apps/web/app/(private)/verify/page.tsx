import { PrivateLayout } from "@dadan/ui";
import { VerifyForm } from "../../../components/verify-form";
import { privateNavItems } from "../../../lib/nav";
import { requireClientSession } from "../../../lib/session";

export default async function VerifyPage() {
  const profile = await requireClientSession();

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <header className="mb-10 space-y-3">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold-light)]">
          Authenticity
        </p>
        <h1 className="font-display text-4xl text-[var(--color-ivory)]">Verify Certificate</h1>
        <p className="max-w-2xl text-[var(--color-ivory-muted)]">
          Confirm the authenticity of a DADAN piece using its serial number and verification token.
        </p>
      </header>

      <VerifyForm />
    </PrivateLayout>
  );
}
