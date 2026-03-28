import {
  BOOKING_APP_PROVIDERS,
  BOOKING_APP_STATUSES,
  BOOKING_EVENT_TYPE_STATUSES,
  BOOKING_LOCATION_KINDS,
  BOOKING_QUESTION_VISIBILITIES,
  BOOKING_STATUSES,
} from "@/lib/constants/booking"

function labelize(value: string) {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export const bookingStatusOptions = BOOKING_STATUSES.map((value) => ({
  value,
  label: labelize(value),
}))

export const bookingEventTypeStatusOptions = BOOKING_EVENT_TYPE_STATUSES.map((value) => ({
  value,
  label: labelize(value),
}))

export const bookingLocationKindOptions = BOOKING_LOCATION_KINDS.map((value) => ({
  value,
  label: labelize(value),
}))

export const bookingAppProviderOptions = BOOKING_APP_PROVIDERS.map((value) => ({
  value,
  label: labelize(value),
}))

export const bookingAppStatusOptions = BOOKING_APP_STATUSES.map((value) => ({
  value,
  label: labelize(value),
}))

export const bookingQuestionVisibilityOptions = BOOKING_QUESTION_VISIBILITIES.map(
  (value) => ({
    value,
    label: labelize(value),
  }),
)

export function getBookingOptionLabel(
  options: Array<{ value: string; label: string }>,
  value: string | null | undefined,
  fallback = "-",
) {
  if (!value) {
    return fallback
  }

  return options.find((option) => option.value === value)?.label ?? fallback
}
