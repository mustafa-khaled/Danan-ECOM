export default async function OwnershipDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>OwnershipPage {id}</div>;
}
