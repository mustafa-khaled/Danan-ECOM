"use client"

import type { ReactNode } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export default function OwnershipChart({
  data = [],
}: {
  data?: Array<{
    period: string;
    acquisitions: number;
    transfers: number;
    pending: number;
  }>;
}) {
  const ownershipData = data.map((row) => ({
    month: row.period.slice(5),
    acquisitions: row.acquisitions,
    transfers: row.transfers,
    pending: row.pending,
  }));

const ownershipConfig = {
  acquisitions: {
    label: "Total Acquisitions",
    color: "var(--chart-purple)",
  },
  transfers: {
    label: "Ownership Transfers",
    color: "var(--chart-pink)",
  },
  pending: {
    label: "Pending Transfers",
    color: "var(--chart-teal)",
  },
}

  return (
    <article className="rounded-xl bg-card p-7 shadow-sm ring-1 ring-border/40">
      <header className="mb-7 flex items-start justify-between gap-5">
        <div>
          <h2 className="text-body-lg font-semibold uppercase tracking-tight">
            Ownership Activity
          </h2>

          <p className="mt-1 text-[14px] text-muted-foreground">
            Overview of Profit
          </p>
        </div>

        <div className="flex items-start gap-6 text-[12px] leading-3.75 text-muted-foreground">
          <Legend color="var(--chart-purple)" label={<>Total<br />Acquisitions</>} />
          <Legend color="var(--chart-pink)" label={<>Ownership<br />Transfers</>} />
          <Legend color="var(--chart-teal)" label={<>Pending<br />Transfers</>} />
        </div>
      </header>

      <ChartContainer config={ownershipConfig} className="h-70 w-full">
        <AreaChart
          data={ownershipData}
          margin={{ top: 0, right: 0, left: 0, bottom: 4 }}
        >
          <defs>
            <linearGradient
              id="pendingFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--chart-teal)"
                stopOpacity={0.12}
              />
              <stop
                offset="100%"
                stopColor="var(--chart-teal)"
                stopOpacity={0.03}
              />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--chart-grid)" />

          <YAxis hide domain={[0, 100]} />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tickMargin={18}
            tick={{
              fill: "var(--chart-text)",
              fontSize: 12,
            }}
          />

          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />

          <Area
            type="monotone"
            dataKey="pending"
            stroke="var(--color-pending)"
            fill="url(#pendingFill)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />

          <Line
            type="monotone"
            dataKey="transfers"
            stroke="var(--color-transfers)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />

          <Line
            type="monotone"
            dataKey="acquisitions"
            stroke="var(--color-acquisitions)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ChartContainer>
    </article>
  )
}

function Legend({
  color,
  label,
}: {
  color: string
  label: ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-0.5 size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  )
}