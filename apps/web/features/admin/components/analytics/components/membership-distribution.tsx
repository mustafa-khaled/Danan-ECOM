const memberships = [
  { label: "Class A", value: 124, percentage: 34 },
  { label: "Class B", value: 54, percentage: 51 },
  { label: "Class C", value: 582, percentage: 68 },
]

export default function MembershipDistribution() {
  return (
    <section aria-labelledby="membership-distribution-title" className="w-full">
      <h4
        id="membership-distribution-title"
        className="mb-6 font-heading text-h4 font-bold uppercase"
      >
        Membership Distribution
      </h4>

      <div
        className="flex flex-col gap-4"
        role="list"
        aria-label="Membership classes"
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