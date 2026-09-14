import { redirect } from "next/navigation";

export default async function NewTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ pieceId?: string }>;
}) {
  const { pieceId } = await searchParams;
  redirect(pieceId ? `/admin/ownership/${pieceId}` : "/admin/ownership");
}
