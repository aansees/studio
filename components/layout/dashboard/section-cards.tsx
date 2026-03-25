"use client"

import { AlertTriangleIcon, TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Frame, FramePanel } from "@/components/ui/frame"
import type { DashboardCardItem } from "@/lib/dashboard/overview-types"
import { cn } from "@/lib/utils"

function getToneBadge(tone: DashboardCardItem["tone"]) {
  if (tone === "warning") {
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
        <AlertTriangleIcon />
        Attention
      </Badge>
    )
  }

  if (tone === "positive") {
    return (
      <Badge variant="outline">
        <TrendingUpIcon />
        Healthy
      </Badge>
    )
  }

  return <Badge variant="outline">Overview</Badge>
}

export function SectionCards({ cards }: { cards: DashboardCardItem[] }) {
  return (
    <Frame
      className={cn(
        "grid grid-cols-1 gap-1 md:grid-cols-2",
        cards.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4",
      )}
    >
      {cards.map((card) => (
        <FramePanel key={card.id} className="m-0! h-full space-y-2 p-5">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value.toLocaleString()}
            </CardTitle>
            <CardAction>{getToneBadge(card.tone)}</CardAction>
          </CardHeader>
          <CardFooter className="items-start text-sm bg-transparent border-none">
            <div className="text-muted-foreground">{card.description}</div>
          </CardFooter>
        </FramePanel>
      ))}
    </Frame>
  )
}
