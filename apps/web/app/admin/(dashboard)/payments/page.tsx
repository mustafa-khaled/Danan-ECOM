"use client";

import { useMemo, useState } from "react";
import {
  PaymentsTable,
  PaymentsTableFilter,
  type AdminPaymentListItem,
  type PaymentAmountFilter,
  type PaymentMethodFilter,
  type PaymentStatusFilter,
} from "@/features/admin";

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

const initialPayments: AdminPaymentListItem[] = [
  {
    id: "txn-8f3a1b2c-4d5e",
    status: "PAID",
    totalAmount: 1250,
    currency: "SAR",
    placedAt: "12 Jan 2025",
    paymentMethod: "CARD",
    paymentStatus: "PAID",
    client: { displayName: "Sultan Al-Otaibi", email: "sultan.otaibi@dadan.sa" },
    items: [{ piece: { serialNumber: "DADAN-001" } }],
  },
  {
    id: "txn-9c2d4e6f-7a8b",
    status: "PAID",
    totalAmount: 890,
    currency: "SAR",
    placedAt: "14 Jan 2025",
    paymentMethod: "MADA",
    paymentStatus: "PAID",
    client: { displayName: "Noura Al-Saud", email: "noura.saud@royalhouse.sa" },
    items: [
      { piece: { serialNumber: "DADAN-042" } },
      { piece: { serialNumber: "DADAN-043" } },
    ],
  },
  {
    id: "txn-3e5f7a9b-1c2d",
    status: "PENDING",
    totalAmount: 2400,
    currency: "SAR",
    placedAt: "20 Jan 2025",
    paymentMethod: "APPLE_PAY",
    paymentStatus: "PENDING",
    client: { displayName: "Tariq Mansour", email: "tariq.mansour@gmail.com" },
    items: [{ piece: { serialNumber: "DADAN-108" } }],
  },
  {
    id: "txn-7b8c0d2e-4f6a",
    status: "FAILED",
    totalAmount: 450,
    currency: "SAR",
    placedAt: "22 Jan 2025",
    paymentMethod: "CARD",
    paymentStatus: "FAILED",
    client: { displayName: "Reem Al-Ghamdi", email: "reem.ghamdi@dadan.sa" },
    items: [{ piece: { serialNumber: "DADAN-055" } }],
  },
  {
    id: "txn-1a2b3c4d-5e6f",
    status: "PAID",
    totalAmount: 3200,
    currency: "SAR",
    placedAt: "01 Feb 2025",
    paymentMethod: "CARD",
    paymentStatus: "PAID",
    client: { displayName: "Fahad Al-Husseini", email: "fahad.h@atelier.com" },
    items: [
      { piece: { serialNumber: "DADAN-077" } },
      { piece: { serialNumber: "DADAN-078" } },
      { piece: { serialNumber: "DADAN-079" } },
    ],
  },
  {
    id: "txn-5f6a7b8c-9d0e",
    status: "PAID",
    totalAmount: 780,
    currency: "SAR",
    placedAt: "05 Feb 2025",
    paymentMethod: "MADA",
    paymentStatus: "PAID",
    client: { displayName: "Lina Al-Khatib", email: "lina.khatib@luxury.sa" },
    items: [{ piece: { serialNumber: "DADAN-021" } }],
  },
  {
    id: "txn-2c3d4e5f-6a7b",
    status: "PENDING",
    totalAmount: 1500,
    currency: "SAR",
    placedAt: "10 Feb 2025",
    paymentMethod: "APPLE_PAY",
    paymentStatus: "PENDING",
    client: { displayName: "Khalid Bin Rashid", email: "khalid.rashid@house.sa" },
    items: [{ piece: { serialNumber: "DADAN-099" } }],
  },
  {
    id: "txn-6d7e8f9a-0b1c",
    status: "PAID",
    totalAmount: 320,
    currency: "SAR",
    placedAt: "15 Feb 2025",
    paymentMethod: "CARD",
    paymentStatus: "PAID",
    client: { displayName: "Maha Al-Dossary", email: "maha.dossary@invest.sa" },
    items: [{ piece: { serialNumber: "DADAN-033" } }],
  },
];

export default function PaymentsPage() {
  const [payments] = useState<AdminPaymentListItem[]>(initialPayments);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (searchValue.trim()) {
        const q = searchValue.toLowerCase();
        const matchesSearch =
          payment.id.toLowerCase().includes(q) ||
          payment.client.displayName.toLowerCase().includes(q) ||
          payment.client.email.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (statusFilter !== "all" && payment.paymentStatus !== statusFilter) {
        return false;
      }

      const total = Number(payment.totalAmount);
      if (amountFilter === "under500" && total >= 500) return false;
      if (amountFilter === "500-1000" && (total < 500 || total > 1000))
        return false;
      if (amountFilter === "over1000" && total <= 1000) return false;

      if (methodFilter !== "all" && payment.paymentMethod !== methodFilter) {
        return false;
      }

      return true;
    });
  }, [payments, searchValue, statusFilter, amountFilter, methodFilter]);

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
