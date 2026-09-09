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

const ownershipData = [
  { month: "Jan", acquisitions: 48, transfers: 60, pending: 92 },
  { month: "", acquisitions: 53, transfers: 62, pending: 70 },
  { month: "Feb", acquisitions: 63, transfers: 56, pending: 68 },
  { month: "", acquisitions: 65, transfers: 50, pending: 62 },
  { month: "Feb", acquisitions: 53, transfers: 58, pending: 34 },
  { month: "", acquisitions: 50, transfers: 50, pending: 36 },
  { month: "Mar", acquisitions: 50, transfers: 51, pending: 38 },
  { month: "Apr", acquisitions: 52, transfers: 53, pending: 39 },
  { month: "Jun", acquisitions: 72, transfers: 85, pending: 30 },
  { month: "Jul", acquisitions: 78, transfers: 88, pending: 26 },
  { month: "Sep", acquisitions: 70, transfers: 81, pending: 24 },
]

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

export default function OwnershipChart() {
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