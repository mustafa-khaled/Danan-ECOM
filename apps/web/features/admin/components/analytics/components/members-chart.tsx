"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslations } from "next-intl";

export default function MembersChart({
  data = [],
}: {
  data?: Array<{ period: string; count: number }>;
}) {
  const t = useTranslations("admin");
  const memberData = data.map((row) => ({
    month: row.period.slice(5),
    members: row.count,
  }));

const memberConfig = {
  members: {
    label: "Members",
    color: "var(--chart-purple)",
  },
};

  if (memberData.length === 0) {
    return (
      <article className="rounded-xl bg-card p-7 shadow-sm ring-1 ring-border/40">
        <p className="text-[13px] font-medium uppercase text-foreground/80">{t("analytics.members")}</p>
        <p className="mt-4 text-sm text-muted-foreground">No member activity yet.</p>
      </article>
    );
  }

  return (
    <article className="rounded-xl bg-card p-7 shadow-sm ring-1 ring-border/40">
      <header className="mb-7">
        <p className="text-[13px] font-medium uppercase text-foreground/80">
          Member Activity
        </p>

        <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
          {t("analytics.members")}
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
