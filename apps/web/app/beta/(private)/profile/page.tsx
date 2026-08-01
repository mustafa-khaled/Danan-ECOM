import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AccountLayout } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { fetchProfile } from "@/features/profile";
import { fetchWardrobe } from "@/features/wardrobe";
import { fetchSaved } from "@/features/saved";
import { getSessionCookieHeader, requireClientSession } from "@/features/auth/server/session";

export default async function ProfilePage() {
  const session = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("profile");

  const [profile, wardrobe, saved] = await Promise.all([
    fetchProfile(cookie).catch(() => null),
    fetchWardrobe(cookie),
    fetchSaved(cookie),
  ]);

  return (
    <>
      <AccountLayout title={t("title")}>
        <section className="mb-12 border-b border-[var(--color-border)] pb-12">
          <h2 className="font-english text-2xl text-[var(--color-text)]">
            {session.displayName}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {t("memberSince", { date: new Date().getFullYear().toString() })}
          </p>
        </section>

        <section className="mb-12">
          <h3 className="mb-6 font-english text-xl text-[var(--color-text)]">
            {t("personalInfo")}
          </h3>
          <ProfileForm
            initial={{
              displayName: session.displayName,
              phone: profile?.phone ?? "",
            }}
          />
        </section>

        <section className="mb-12">
          <h3 className="mb-4 font-english text-xl text-[var(--color-text)]">
            {t("houseMembership")}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t("houseKey")}: ••••••••
          </p>
        </section>

        <section className="mb-12">
          <div className="mb-4 flex items-end justify-between">
            <h3 className="font-english text-xl text-[var(--color-text)]">
              {t("collectionSummary")}
            </h3>
            <Link
              href="/beta/wardrobe"
              className="text-xs tracking-[0.12em] uppercase text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
            >
              {t("ownedPieces", { count: wardrobe.length })}
            </Link>
          </div>
        </section>

        <section>
          <h3 className="mb-4 font-english text-xl text-[var(--color-text)]">
            {t("wishlist")}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {saved.length} {t("wishlist").toLowerCase()}
          </p>
        </section>
      </AccountLayout>
    </>
  );
}
