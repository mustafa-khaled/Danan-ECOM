"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const memberData = [
  { month: "Jan", members: 18 },
  { month: "", members: 18 },
  { month: "", members: 34 },
  { month: "", members: 34 },
  { month: "Feb", members: 26 },
  { month: "", members: 26 },
  { month: "", members: 26 },
  { month: "Mar", members: 18 },
  { month: "", members: 18 },
  { month: "", members: 26 },
  { month: "Apr", members: 26 },
  { month: "", members: 48 },
  { month: "", members: 48 },
  { month: "May", members: 20 },
  { month: "", members: 20 },
  { month: "", members: 54 },
  { month: "", members: 54 },
];

const memberConfig = {
  members: {
    label: "Members",
    color: "var(--chart-purple)",
  },
};

export default function MembersChart() {
  return (
    <article className="rounded-xl bg-card p-7 shadow-sm ring-1 ring-border/40">
      <header className="mb-7">
        <p className="text-[13px] font-medium uppercase text-foreground/80">
          Member Activity
        </p>

        <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
          Members
        </h2>
      </header>

      <ChartContainer config={memberConfig} className="h-70 w-full">
        <LineChart
          data={memberData}
          margin={{ top: 0, right: 0, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--chart-grid)"
            strokeDasharray="2 2"
          />

          <YAxis hide domain={[0, 60]} />

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
            content={<ChartTooltipContent hideLabel />}
          />

          <Line
            type="linear"
            dataKey="members"
            stroke="var(--color-members)"
            strokeWidth={2.2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>
    </article>
  );
}
