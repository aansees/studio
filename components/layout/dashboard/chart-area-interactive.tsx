"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DashboardStatusDatum } from "@/lib/dashboard/overview-types"

const chartConfig = {
  count: {
    label: "Tasks",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function ChartAreaInteractive({ data }: { data: DashboardStatusDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <>
      <CardHeader>
        <CardTitle>Task Status Distribution</CardTitle>
        <CardDescription>
          {total > 0
            ? `${total.toLocaleString()} tasks tracked in your current scope`
            : "No tasks available yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatStatusLabel}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatStatusLabel(String(value))}
                  indicator="dot"
                />
              }
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </>
  )
}
