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
