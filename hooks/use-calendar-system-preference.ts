"use client"

import { useState } from "react"

import type { CalendarSystem } from "@/components/layout/sheduling/calendar-system"

const STORAGE_KEY = "calendar-system-preference"

export function useCalendarSystemPreference(defaultSystem: CalendarSystem) {
  const [calendarSystem, setCalendarSystem] = useState<CalendarSystem>(() => {
    if (typeof window === "undefined") {
      return defaultSystem
    }

    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === "gregorian" || saved === "nepali") {
      return saved
    }
    return defaultSystem
  })

  function onSetCalendarSystem(value: CalendarSystem) {
    setCalendarSystem(value)
    window.localStorage.setItem(STORAGE_KEY, value)
  }

  return {
    calendarSystem,
    setCalendarSystem: onSetCalendarSystem,
  }
}
