"use client"

import { endOfWeek, isSameDay, isWithinInterval, startOfWeek } from "date-fns"
import { useEffect, useMemo, useState } from "react"

import { EndHour, StartHour } from "@/components/layout/sheduling/constants"

type CalendarView = "day" | "week"

type CurrentTimeIndicator = {
  currentTimePosition: number
  currentTimeVisible: boolean
}

export function useCurrentTimeIndicator(
  currentDate: Date,
  view: CalendarView,
): CurrentTimeIndicator {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 60_000)

    return () => window.clearInterval(interval)
  }, [])

  return useMemo(() => {
    const startMinutes = StartHour * 60
    const endMinutes = EndHour * 60
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const clampedMinutes = Math.min(Math.max(currentMinutes, startMinutes), endMinutes)
    const currentTimePosition =
      ((clampedMinutes - startMinutes) / (endMinutes - startMinutes)) * 100

    const isWithinHours = currentMinutes >= startMinutes && currentMinutes <= endMinutes

    const currentTimeVisible =
      view === "day"
        ? isSameDay(now, currentDate) && isWithinHours
        : isWithinInterval(now, {
            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
            end: endOfWeek(currentDate, { weekStartsOn: 1 }),
          }) && isWithinHours

    return {
      currentTimePosition,
      currentTimeVisible,
    }
  }, [currentDate, now, view])
}
