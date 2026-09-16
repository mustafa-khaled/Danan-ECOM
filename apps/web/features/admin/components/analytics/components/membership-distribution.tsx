import { useTranslations } from "next-intl";

export default function MembershipDistribution({
  memberships = [],
}: {
  memberships?: Array<{ label: string; value: number; percentage: number }>;
}) {
  const t = useTranslations("admin");
  return (
    <section aria-labelledby="membership-distribution-title" className="w-full">
      <h4
        id="membership-distribution-title"
        className="mb-6 font-heading text-h4 font-bold uppercase"
      >
        {t("analytics.membershipDistribution")}
      </h4>

      <div
        className="flex flex-col gap-4"
        role="list"
        aria-label={t("analytics.membershipClasses")}
      >
        {memberships.map((membership) => (
          <div
            key={membership.label}
            className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 sm:gap-5"
            role="listitem"
          >
            <span className="text-xs font-medium text-foreground">
              {membership.label}
            </span>

            <div
              className="h-5 overflow-hidden rounded-[4px] bg-muted"
              role="progressbar"
              aria-label={`${membership.label} membership distribution`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={membership.percentage}
            >
              <div
                className="flex h-full min-w-14 items-center justify-center rounded-r-sm bg-[#c27569] px-2 text-[10px] font-medium text-white transition-[width] duration-500"
                style={{ width: `${membership.percentage}%` }}
              >
                {membership.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}