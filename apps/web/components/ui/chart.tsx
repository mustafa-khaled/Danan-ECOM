"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border/50 [&_.recharts-dot[stroke='#fff']]:transition-colors duration-200 [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_line]:stroke-border [&_.recharts-sector[stroke='#fff']]:transition-colors duration-200 [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color,
  )

  if (!colorConfig.length) {
    return null
  }

  // M-03: SECURITY — THEMES is a hardcoded static object. Never introduce user-controlled
  // data into THEMES or this template, as it would create a stored XSS vector.
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}`,
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

type TooltipPayloadItem = {
  name?: string | number
  dataKey?: string | number
  value?: unknown
  color?: string
  fill?: string
  payload?: Record<string, unknown>
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  labelKey,
  labelClassName,
  color,
  nameKey,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  className?: string
  hideLabel?: boolean
  indicator?: "dot" | "line" | "dashed"
  nameKey?: string
  labelKey?: string
  labelClassName?: string
  color?: string
}) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const item = payload[0]
    if (!item) {
      return null
    }

    const key = `${labelKey || item.dataKey || item.name || "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)

    if (itemConfig?.label) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {String(itemConfig.label)}
        </div>
      )
    }
    return null
  }, [hideLabel, labelClassName, config, labelKey, payload])

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const fillColor =
            typeof item.payload?.fill === "string"
              ? item.payload.fill
              : undefined
          const indicatorColor = color || item.color || fillColor

          return (
            <div
              key={`${item.dataKey}-${index}`}
              className="flex w-full items-stretch gap-2 rounded-md py-0.5"
            >
              {indicator === "dot" && (
                <div
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: indicatorColor }}
                />
              )}
              {indicator === "line" && (
                <div
                  className="w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: indicatorColor }}
                />
              )}
              <div className="flex w-full items-center justify-between gap-2 leading-none">
                <span className="text-muted-foreground">
                  {itemConfig?.label || item.name}
                </span>
                <span className="font-medium text-foreground">
                  {String(item.value)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: TooltipPayloadItem,
  key: string,
) {
  const record = payload as Record<string, unknown>
  const payloadPayload: Record<string, unknown> | undefined =
    typeof record.payload === "object" && record.payload !== null
      ? (record.payload as Record<string, unknown>)
      : undefined

  let configLabelKey: string = key

  if (key in record && typeof record[key] === "string") {
    configLabelKey = record[key] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key] === "string"
  ) {
    configLabelKey = payloadPayload[key] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }