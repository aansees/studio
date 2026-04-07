import { z } from "zod"

import {
  BOOKING_APP_PROVIDERS,
  BOOKING_APP_STATUSES,
  BOOKING_EVENT_TYPE_CALENDAR_PURPOSES,
  BOOKING_EVENT_TYPE_STATUSES,
  BOOKING_LOCATION_KINDS,
  BOOKING_OVERRIDE_KINDS,
  BOOKING_QUESTION_TYPES,
  BOOKING_QUESTION_VISIBILITIES,
} from "@/lib/constants/booking"

const minuteSchema = z.number().int().min(0).max(24 * 60)

export const bookingAvailabilityWindowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinute: minuteSchema,
    endMinute: minuteSchema,
    position: z.number().int().min(0).optional(),
  })
  .refine((value) => value.startMinute < value.endMinute, {
    message: "startMinute must be earlier than endMinute",
    path: ["endMinute"],
  })

export const bookingAvailabilityOverrideSchema = z.object({
  date: z.coerce.date(),
  kind: z.enum(BOOKING_OVERRIDE_KINDS),
  startMinute: minuteSchema.nullish(),
  endMinute: minuteSchema.nullish(),
  reason: z.string().trim().max(191).nullish(),
})

export const bookingAvailabilitySchema = z.object({
  scheduleId: z.string().optional(),
  name: z.string().trim().min(2).max(191).optional(),
  timezone: z.string().trim().min(1).max(64),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  windows: z.array(bookingAvailabilityWindowSchema),
  overrides: z.array(bookingAvailabilityOverrideSchema).optional(),
})

export const bookingAvailabilityCreateSchema = z.object({
  name: z.string().trim().min(2).max(191),
  timezone: z.string().trim().min(1).max(64).optional(),
  cloneFromScheduleId: z.string().trim().min(1).nullish(),
  setAsDefault: z.boolean().optional(),
})

export const bookingAvailabilityDeleteSchema = z.object({
  scheduleId: z.string().trim().min(1),
})

export const bookingAppConnectionSchema = z.object({
  provider: z.enum(BOOKING_APP_PROVIDERS),
  status: z.enum(BOOKING_APP_STATUSES).optional(),
  accountLabel: z.string().trim().min(2).max(191),
  accountEmail: z.string().trim().max(191).nullish(),
  externalAccountId: z.string().trim().max(255).nullish(),
  externalCalendarId: z.string().trim().max(255).nullish(),
  externalCalendarName: z.string().trim().max(191).nullish(),
  scopes: z.string().trim().nullish(),
  supportsCalendar: z.boolean().optional(),
  supportsConferencing: z.boolean().optional(),
  canCheckConflicts: z.boolean().optional(),
  canCreateEvents: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export const bookingEventTypeLocationSchema = z.object({
  kind: z.enum(BOOKING_LOCATION_KINDS),
  label: z.string().trim().min(2).max(191),
  value: z.string().trim().nullish(),
  appConnectionId: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
})

export const bookingEventTypeCalendarSchema = z.object({
  appConnectionId: z.string(),
  purpose: z.enum(BOOKING_EVENT_TYPE_CALENDAR_PURPOSES),
  isPrimary: z.boolean().optional(),
})

export const bookingEventTypeQuestionSchema = z.object({
  fieldKey: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(191),
  description: z.string().trim().nullish(),
  inputType: z.enum(BOOKING_QUESTION_TYPES),
  visibility: z.enum(BOOKING_QUESTION_VISIBILITIES),
  placeholder: z.string().trim().max(191).nullish(),
  options: z.array(z.string().trim().min(1)).nullish(),
  isSystem: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
})

export const bookingEventTypeSchema = z.object({
  availabilityScheduleId: z.string().nullish(),
  title: z.string().trim().min(2).max(191),
  slug: z.string().trim().max(191).nullish(),
  description: z.string().trim().nullish(),
  status: z.enum(BOOKING_EVENT_TYPE_STATUSES).optional(),
  durationMinutes: z.number().int().min(5).max(8 * 60),
  allowMultipleDurations: z.boolean().optional(),
  durationOptions: z.array(z.number().int().min(5).max(8 * 60)).nullish(),
  color: z.string().trim().max(32).nullish(),
  bookingNoticeMinutes: z.number().int().min(0).max(30 * 24 * 60).optional(),
  bookingWindowDays: z.number().int().min(1).max(365).optional(),
  bufferBeforeMinutes: z.number().int().min(0).max(24 * 60).optional(),
  bufferAfterMinutes: z.number().int().min(0).max(24 * 60).optional(),
  maxBookingsPerDay: z.number().int().min(1).max(100).nullish(),
  requireEmailVerification: z.boolean().optional(),
  allowGuestBookings: z.boolean().optional(),
  requireLogin: z.boolean().optional(),
  allowCancellation: z.boolean().optional(),
  allowReschedule: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  confirmationChannels: z.array(z.string().trim().min(1)).nullish(),
  locations: z.array(bookingEventTypeLocationSchema).optional(),
  calendars: z.array(bookingEventTypeCalendarSchema).optional(),
  questions: z.array(bookingEventTypeQuestionSchema).optional(),
})

export const clientBookingSlotQuerySchema = z.object({
  eventTypeId: z.string().trim().min(1),
  durationMinutes: z.coerce.number().int().min(5).max(8 * 60).optional(),
  fromDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  days: z.coerce.number().int().min(1).max(31).optional(),
})

export const clientBookingCreateSchema = z.object({
  eventTypeId: z.string().trim().min(1),
  startsAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(5).max(8 * 60).optional(),
  attendeeTimezone: z.string().trim().max(64).nullish(),
})
