"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PaymentsTable,
  PaymentsTableFilter,
  type AdminPaymentListItem,
  type PaymentAmountFilter,
  type PaymentMethodFilter,
  type PaymentStatusFilter,
} from "@/features/admin";
import { fetchAdminOrders } from "@/features/admin/api/fetch-admin-orders";
import { fetchAdminOrderStats } from "@/features/admin/api/fetch-admin-stats";
import { useTranslations } from "next-intl";

export default function PaymentsPage() {
  const t = useTranslations("admin");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const statsQuery = useQuery({
    queryKey: ["admin-order-stats"],
    queryFn: () => fetchAdminOrderStats(),
  });
  const paymentsQuery = useQuery({
    queryKey: ["admin-orders", searchValue, statusFilter, methodFilter],
    queryFn: () =>
      fetchAdminOrders(1, 20, undefined, {
        q: searchValue || undefined,
        paymentStatus: statusFilter === "all" ? undefined : statusFilter,
        paymentMethod: methodFilter === "all" ? undefined : methodFilter,
      }),
  });

  const filteredPayments = useMemo(() => {
    return (paymentsQuery.data?.items ?? [])
      .filter((payment) => {
        const total = Number(payment.totalAmount);
        if (amountFilter === "under500" && total >= 500) return false;
        if (amountFilter === "500-1000" && (total < 500 || total > 1000)) return false;
        if (amountFilter === "over1000" && total <= 1000) return false;
        return true;
      })
      .map((payment) => ({
        ...payment,
        paymentMethod: payment.paymentMethod ?? "CARD",
        paymentStatus: payment.paymentStatus ?? payment.status,
      })) as AdminPaymentListItem[];
  }, [paymentsQuery.data, amountFilter]);

  const stats = [
    { id: 1, title: "Total Revenue", count: statsQuery.data?.totalRevenue ?? 0 },
    { id: 2, title: "Successful Payments", count: statsQuery.data?.successful ?? 0 },
    { id: 3, title: "Pending Payments", count: statsQuery.data?.pending ?? 0 },
    { id: 4, title: "Refunded", count: statsQuery.data?.refunded ?? 0 },
  ];

  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        {t("payments.banner")}
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

          <div className="space-y-4">
            <PaymentsTableFilter
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              statusFilter={statusFilter as PaymentStatusFilter}
              onStatusFilterChange={setStatusFilter}
              amountFilter={amountFilter as PaymentAmountFilter}
              onAmountFilterChange={setAmountFilter}
              methodFilter={methodFilter as PaymentMethodFilter}
              onMethodFilterChange={setMethodFilter}
            />

            <PaymentsTable items={filteredPayments} />
          </div>
        </div>
      </div>
    </>
  );
}
