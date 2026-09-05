import Link from "next/link";
import {
  SingleCollectionTabs,
  SingleCollectionHeader,
  SingleCollectionHero,
} from "@/features/admin";
import { fetchAdminCollectionDetail } from "@/features/admin/api/fetch-admin-collections";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/shared/lib/send-request";
import { notFound } from "next/navigation";

export default async function CollectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();

  let collection;
  try {
    collection = await fetchAdminCollectionDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href="/admin/collections">
            <ArrowLeft className="size-6" />
          </Link>
        </div>

        <SingleCollectionHeader />
      </div>

      <div className="px-7.5 py-[16px]">
        <div className="p-6 bg-white rounded-3xl">
          <SingleCollectionTabs />
          <SingleCollectionHero collection={collection} />
          {children}
        </div>
      </div>
    </>
  );
}
