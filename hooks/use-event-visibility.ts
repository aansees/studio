"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type UseEventVisibilityArgs = {
  eventHeight: number
  eventGap: number
}

export function useEventVisibility({ eventHeight, eventGap }: UseEventVisibilityArgs) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [availableHeight, setAvailableHeight] = useState<number>(0)

  useEffect(() => {
    const node = contentRef.current
    if (!node) return

    const update = () => {
      const rect = node.getBoundingClientRect()
      setAvailableHeight(rect.height)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  const getVisibleEventCount = useCallback(
    (totalEvents: number) => {
      if (availableHeight <= 0) {
        return Math.min(totalEvents, 3)
      }
      const rowHeight = eventHeight + eventGap
      const possibleRows = Math.max(1, Math.floor(availableHeight / rowHeight))
      return Math.min(totalEvents, possibleRows)
    },
    [availableHeight, eventGap, eventHeight],
  )

  return { contentRef, getVisibleEventCount }
}
