export const BOOKING_EVENT_TYPE_STATUSES = [
  "draft",
  "active",
  "archived",
] as const

export type BookingEventTypeStatus = (typeof BOOKING_EVENT_TYPE_STATUSES)[number]

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const BOOKING_SOURCES = ["authenticated", "guest", "admin"] as const

export type BookingSource = (typeof BOOKING_SOURCES)[number]

export const BOOKING_LOCATION_KINDS = [
  "google_meet",
  "zoom",
  "in_person",
  "phone",
  "custom_link",
  "custom_address",
] as const

export type BookingLocationKind = (typeof BOOKING_LOCATION_KINDS)[number]

export const BOOKING_APP_PROVIDERS = [
  "google_calendar",
  "outlook_calendar",
  "zoom",
] as const

export type BookingAppProvider = (typeof BOOKING_APP_PROVIDERS)[number]

export const BOOKING_APP_STATUSES = [
  "connected",
  "expired",
  "error",
  "revoked",
] as const

export type BookingAppStatus = (typeof BOOKING_APP_STATUSES)[number]

export const BOOKING_EVENT_TYPE_CALENDAR_PURPOSES = [
  "destination",
  "conflict",
] as const

export type BookingEventTypeCalendarPurpose =
  (typeof BOOKING_EVENT_TYPE_CALENDAR_PURPOSES)[number]

export const BOOKING_QUESTION_TYPES = [
  "short_text",
  "long_text",
  "email",
  "phone",
  "multiple_emails",
  "select",
  "location",
] as const

export type BookingQuestionType = (typeof BOOKING_QUESTION_TYPES)[number]

export const BOOKING_QUESTION_VISIBILITIES = [
  "hidden",
  "optional",
  "required",
] as const

export type BookingQuestionVisibility =
  (typeof BOOKING_QUESTION_VISIBILITIES)[number]

export const BOOKING_OVERRIDE_KINDS = [
  "available",
  "unavailable",
] as const

export type BookingOverrideKind = (typeof BOOKING_OVERRIDE_KINDS)[number]
