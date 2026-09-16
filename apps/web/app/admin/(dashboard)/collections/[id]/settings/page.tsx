import { redirect } from "next/navigation";

/**
 * Collection-specific settings (name, slug, visibility, class access, sort order)
 * are managed in the edit form. Redirect there to avoid duplicating house settings.
 */
export default async function CollectionSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/collections/${id}/edit`);
}
