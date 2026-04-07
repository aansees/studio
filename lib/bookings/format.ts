export function minutesToTimeInput(minutes: number) {
  const normalized = Math.max(0, Math.min(24 * 60, Math.round(minutes)))
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

export function timeInputToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((segment) => Number(segment))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0
  }

  return hours * 60 + minutes
}

export const bookingDayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

export const bookingDayShortLabels = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const

export function formatBookingMinuteLabel(minutes: number) {
  const normalized = Math.max(0, Math.min(24 * 60, Math.round(minutes)))
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  const anchor = new Date(Date.UTC(2000, 0, 1, hours, mins))

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(anchor)
}

export function formatBookingMinuteRange(startMinute: number, endMinute: number) {
  return `${formatBookingMinuteLabel(startMinute)} - ${formatBookingMinuteLabel(
    endMinute,
  )}`
}

export function summarizeBookingAvailabilityWindows(
  windows: Array<{
    dayOfWeek: number
    startMinute: number
    endMinute: number
  }>,
) {
  if (windows.length === 0) {
    return "No weekly hours configured"
  }

  const byDay = new Map<
    number,
    Array<{
      startMinute: number
      endMinute: number
    }>
  >()

  for (const window of windows) {
    const current = byDay.get(window.dayOfWeek) ?? []
    current.push({
      startMinute: window.startMinute,
      endMinute: window.endMinute,
    })
    byDay.set(window.dayOfWeek, current)
  }

  const activeDays = Array.from(byDay.keys()).sort((left, right) => left - right)
  const firstDaySlots = byDay.get(activeDays[0]) ?? []
  const hasSharedSingleWindow =
    firstDaySlots.length === 1 &&
    activeDays.every((dayOfWeek) => {
      const slots = byDay.get(dayOfWeek) ?? []
      return (
        slots.length === 1 &&
        slots[0]?.startMinute === firstDaySlots[0]?.startMinute &&
        slots[0]?.endMinute === firstDaySlots[0]?.endMinute
      )
    })
  const isConsecutive = activeDays.every(
    (dayOfWeek, index) => index === 0 || dayOfWeek === activeDays[index - 1] + 1,
  )

  if (hasSharedSingleWindow && isConsecutive) {
    return `${bookingDayShortLabels[activeDays[0]]} - ${
      bookingDayShortLabels[activeDays.at(-1) ?? activeDays[0]]
    }, ${formatBookingMinuteRange(
      firstDaySlots[0].startMinute,
      firstDaySlots[0].endMinute,
    )}`
  }

  return `${activeDays.length} day${activeDays.length === 1 ? "" : "s"} configured`
}

export function formatBookingDateTimeRange(
  startsAt: Date | string,
  endsAt: Date | string,
) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).formatRange(start, end)
}
