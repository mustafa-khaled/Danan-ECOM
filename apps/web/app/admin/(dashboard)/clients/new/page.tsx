import { ClientForm } from "../client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Create Client</h1>
        <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
          Register a new client and generate their House Key.
        </p>
      </div>

      <ClientForm mode="create" />
    </div>
  );
}
