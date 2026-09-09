const stats = [
  {
    id: 1,
    title: "Total Revenue",
    count: "238,500",
  },
  {
    id: 2,
    title: "Successful Payments",
    count: "231,200",
  },
  {
    id: 3,
    title: "Pending Payments",
    count: "12,300",
  },
  {
    id: 4,
    title: "Refunded",
    count: "5,000",
  },
] as const;

export default function PaymentsPage() {
  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        Manage and monitor all financial transactions related to DADAN pieces
        and purchases.
      </div>

      <div className="px-7.5 py-6.75">
        <div className="bg-white rounded-3xl p-6 space-y-6">
          <div className="grid grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="flex flex-col font-medium items-start justify-center rounded-2xl border border-[#F3F3F3] p-6 h-30"
              >
                <h4 className="font-heading text-[40px]">${stat.count}</h4>
                <p className="text-[#5D697A] text-[12px]">{stat.title}</p>
              </div>
            ))}
          </div>

          <div className="mt-[32px]">
            <h4 className="font-heading text-h4 font-bold text-[#272D35] mb-6">
              Payment
            </h4>
            {/* <OperationsTableFilter
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              transferFilter={transferFilter}
              onTransferFilterChange={setTransferFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
            />

            <OperationsTable items={filteredOperations} /> */}
          </div>
        </div>
      </div>
    </>
  );
}
