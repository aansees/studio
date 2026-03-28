import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm"

import {
  DEFAULT_BOOKING_AVAILABILITY_WINDOWS,
  DEFAULT_BOOKING_LOCATION,
  DEFAULT_BOOKING_QUESTIONS,
} from "@/lib/bookings/defaults"
import type {
  BookingAppProvider,
  BookingAppStatus,
  BookingEventTypeCalendarPurpose,
  BookingLocationKind,
  BookingQuestionType,
  BookingQuestionVisibility,
} from "@/lib/constants/booking"
import { db } from "@/lib/db"
import {
  booking,
  bookingAppConnection,
  bookingAvailabilityOverride,
  bookingAvailabilitySchedule,
  bookingAvailabilityWindow,
  bookingEventType,
  bookingEventTypeCalendar,
  bookingEventTypeLocation,
  bookingEventTypeQuestion,
  user,
} from "@/lib/db/schema"
import type { SessionUser } from "@/lib/session"
import { isAdmin } from "@/lib/services/access-control"

type BookingAvailabilityWindowInput = {
  dayOfWeek: number
  startMinute: number
  endMinute: number
  position?: number
}

type BookingAvailabilityOverrideInput = {
  date: Date
  kind: "available" | "unavailable"
  startMinute?: number | null
  endMinute?: number | null
  reason?: string | null
}

export type BookingAvailabilityInput = {
  scheduleId?: string
  name?: string
  timezone: string
  windows: BookingAvailabilityWindowInput[]
  overrides?: BookingAvailabilityOverrideInput[]
}

export type BookingAppConnectionInput = {
  provider: BookingAppProvider
  status?: BookingAppStatus
  accountLabel: string
  accountEmail?: string | null
  externalAccountId?: string | null
  externalCalendarId?: string | null
  externalCalendarName?: string | null
  scopes?: string | null
  supportsCalendar?: boolean
  supportsConferencing?: boolean
  canCheckConflicts?: boolean
  canCreateEvents?: boolean
  metadata?: Record<string, unknown> | null
}

export type BookingEventTypeLocationInput = {
  kind: BookingLocationKind
  label: string
  value?: string | null
  appConnectionId?: string | null
  metadata?: Record<string, unknown> | null
  isDefault?: boolean
  isActive?: boolean
  position?: number
}

export type BookingEventTypeCalendarInput = {
  appConnectionId: string
  purpose: BookingEventTypeCalendarPurpose
  isPrimary?: boolean
}

export type BookingEventTypeQuestionInput = {
  fieldKey: string
  label: string
  description?: string | null
  inputType: BookingQuestionType
  visibility: BookingQuestionVisibility
  placeholder?: string | null
  options?: string[] | null
  isSystem?: boolean
  position?: number
}

export type BookingEventTypeInput = {
  availabilityScheduleId?: string | null
  title: string
  slug?: string | null
  description?: string | null
  status?: "draft" | "active" | "archived"
  durationMinutes: number
  allowMultipleDurations?: boolean
  durationOptions?: number[] | null
  color?: string | null
  bookingNoticeMinutes?: number
  bookingWindowDays?: number
  bufferBeforeMinutes?: number
  bufferAfterMinutes?: number
  maxBookingsPerDay?: number | null
  requireEmailVerification?: boolean
  allowGuestBookings?: boolean
  requireLogin?: boolean
  allowCancellation?: boolean
  allowReschedule?: boolean
  isPublic?: boolean
  confirmationChannels?: string[] | null
  locations?: BookingEventTypeLocationInput[]
  calendars?: BookingEventTypeCalendarInput[]
  questions?: BookingEventTypeQuestionInput[]
}

function assertAdminBookingAccess(currentUser: SessionUser) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can manage bookings")
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

function normalizeMinute(value: number) {
  return Math.max(0, Math.min(24 * 60, Math.round(value)))
}

function normalizeAvailabilityWindows(windows: BookingAvailabilityWindowInput[]) {
  return windows
    .map((window, index) => ({
      dayOfWeek: Math.max(0, Math.min(6, Math.round(window.dayOfWeek))),
      startMinute: normalizeMinute(window.startMinute),
      endMinute: normalizeMinute(window.endMinute),
      position: window.position ?? index,
    }))
    .filter((window) => window.startMinute < window.endMinute)
    .sort((left, right) => {
      if (left.dayOfWeek !== right.dayOfWeek) {
        return left.dayOfWeek - right.dayOfWeek
      }

      if (left.position !== right.position) {
        return left.position - right.position
      }

      return left.startMinute - right.startMinute
    })
}

function normalizeAvailabilityOverrides(
  overrides: BookingAvailabilityOverrideInput[] | undefined,
) {
  return (overrides ?? [])
    .map((override) => ({
      date: override.date,
      kind: override.kind,
      startMinute:
        typeof override.startMinute === "number"
          ? normalizeMinute(override.startMinute)
          : null,
      endMinute:
        typeof override.endMinute === "number"
          ? normalizeMinute(override.endMinute)
          : null,
      reason: override.reason?.trim() || null,
    }))
    .filter((override) => {
      if (override.kind === "unavailable") {
        return true
      }

      return (
        typeof override.startMinute === "number" &&
        typeof override.endMinute === "number" &&
        override.startMinute < override.endMinute
      )
    })
    .sort((left, right) => left.date.getTime() - right.date.getTime())
}

function normalizeLocationInputs(locations: BookingEventTypeLocationInput[] | undefined) {
  const source = locations && locations.length > 0 ? locations : [DEFAULT_BOOKING_LOCATION]

  return source.map((location, index) => ({
    kind: location.kind,
    label: location.label.trim(),
    value: location.value?.trim() || null,
    appConnectionId: location.appConnectionId ?? null,
    metadata: location.metadata ?? null,
    isDefault:
      typeof location.isDefault === "boolean"
        ? location.isDefault
        : index === 0,
    isActive:
      typeof location.isActive === "boolean" ? location.isActive : true,
    position: location.position ?? index,
  }))
}

function normalizeCalendarInputs(calendars: BookingEventTypeCalendarInput[] | undefined) {
  const seen = new Set<string>()

  return (calendars ?? [])
    .filter((calendar) => {
      const key = `${calendar.appConnectionId}:${calendar.purpose}`
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
    .map((calendar) => ({
      appConnectionId: calendar.appConnectionId,
      purpose: calendar.purpose,
      isPrimary: Boolean(calendar.isPrimary),
    }))
}

function normalizeQuestionInputs(questions: BookingEventTypeQuestionInput[] | undefined) {
  const source = questions && questions.length > 0 ? questions : DEFAULT_BOOKING_QUESTIONS
  const seen = new Set<string>()

  return source
    .map((question, index) => ({
      fieldKey: question.fieldKey.trim(),
      label: question.label.trim(),
      description: question.description?.trim() || null,
      inputType: question.inputType,
      visibility: question.visibility,
      placeholder: question.placeholder?.trim() || null,
      options: question.options?.filter((option) => option.trim().length > 0) ?? null,
      isSystem: Boolean(question.isSystem),
      position: question.position ?? index,
    }))
    .filter((question) => {
      if (question.fieldKey.length === 0 || seen.has(question.fieldKey)) {
        return false
      }

      seen.add(question.fieldKey)
      return true
    })
}

async function ensureConnectionsBelongToUser(userId: string, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  if (uniqueIds.length === 0) {
    return new Map<string, typeof bookingAppConnection.$inferSelect>()
  }

  const rows = await db
    .select()
    .from(bookingAppConnection)
    .where(
      and(
        eq(bookingAppConnection.userId, userId),
        inArray(bookingAppConnection.id, uniqueIds),
      ),
    )

  if (rows.length !== uniqueIds.length) {
    throw new Error("One or more connected apps do not belong to this admin")
  }

  return new Map(rows.map((row) => [row.id, row]))
}

async function ensureScheduleBelongsToUser(userId: string, scheduleId: string) {
  const [schedule] = await db
    .select()
    .from(bookingAvailabilitySchedule)
    .where(
      and(
        eq(bookingAvailabilitySchedule.id, scheduleId),
        eq(bookingAvailabilitySchedule.userId, userId),
      ),
    )
    .limit(1)

  if (!schedule) {
    throw new Error("Availability schedule not found")
  }

  return schedule
}

async function resolveUniqueEventTypeSlug(
  userId: string,
  value: string,
  excludeId?: string,
) {
  const baseSlug = slugify(value) || "meeting"
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const [existing] = await db
      .select({ id: bookingEventType.id })
      .from(bookingEventType)
      .where(
        and(
          eq(bookingEventType.userId, userId),
          eq(bookingEventType.slug, candidate),
          excludeId ? ne(bookingEventType.id, excludeId) : undefined,
        ),
      )
      .limit(1)

    if (!existing) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

async function hydrateAvailabilitySchedules(userId: string) {
  const schedules = await db
    .select()
    .from(bookingAvailabilitySchedule)
    .where(eq(bookingAvailabilitySchedule.userId, userId))
    .orderBy(
      desc(bookingAvailabilitySchedule.isDefault),
      asc(bookingAvailabilitySchedule.name),
    )

  const scheduleIds = schedules.map((schedule) => schedule.id)
  if (scheduleIds.length === 0) {
    return []
  }

  const [windows, overrides] = await Promise.all([
    db
      .select()
      .from(bookingAvailabilityWindow)
      .where(inArray(bookingAvailabilityWindow.scheduleId, scheduleIds))
      .orderBy(
        asc(bookingAvailabilityWindow.dayOfWeek),
        asc(bookingAvailabilityWindow.position),
      ),
    db
      .select()
      .from(bookingAvailabilityOverride)
      .where(inArray(bookingAvailabilityOverride.scheduleId, scheduleIds))
      .orderBy(asc(bookingAvailabilityOverride.date)),
  ])

  const windowsByScheduleId = new Map<string, typeof bookingAvailabilityWindow.$inferSelect[]>()
  for (const window of windows) {
    const current = windowsByScheduleId.get(window.scheduleId) ?? []
    current.push(window)
    windowsByScheduleId.set(window.scheduleId, current)
  }

  const overridesByScheduleId = new Map<
    string,
    typeof bookingAvailabilityOverride.$inferSelect[]
  >()
  for (const override of overrides) {
    const current = overridesByScheduleId.get(override.scheduleId) ?? []
    current.push(override)
    overridesByScheduleId.set(override.scheduleId, current)
  }

  return schedules.map((schedule) => ({
    ...schedule,
    windows: windowsByScheduleId.get(schedule.id) ?? [],
    overrides: overridesByScheduleId.get(schedule.id) ?? [],
  }))
}

async function replaceEventTypeChildren(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  eventTypeId: string,
  userId: string,
  locations: BookingEventTypeLocationInput[] | undefined,
  calendars: BookingEventTypeCalendarInput[] | undefined,
  questions: BookingEventTypeQuestionInput[] | undefined,
) {
  const normalizedLocations = normalizeLocationInputs(locations)
  const normalizedCalendars = normalizeCalendarInputs(calendars)
  const normalizedQuestions = normalizeQuestionInputs(questions)

  const connectionIds = Array.from(
    new Set(
      [
        ...normalizedLocations
          .map((location) => location.appConnectionId)
          .filter((value): value is string => Boolean(value)),
        ...normalizedCalendars.map((calendar) => calendar.appConnectionId),
      ],
    ),
  )

  if (connectionIds.length > 0) {
    await ensureConnectionsBelongToUser(userId, connectionIds)
  }

  await tx
    .delete(bookingEventTypeLocation)
    .where(eq(bookingEventTypeLocation.eventTypeId, eventTypeId))
  await tx
    .delete(bookingEventTypeCalendar)
    .where(eq(bookingEventTypeCalendar.eventTypeId, eventTypeId))
  await tx
    .delete(bookingEventTypeQuestion)
    .where(eq(bookingEventTypeQuestion.eventTypeId, eventTypeId))

  if (normalizedLocations.length > 0) {
    await tx.insert(bookingEventTypeLocation).values(
      normalizedLocations.map((location) => ({
        eventTypeId,
        kind: location.kind,
        label: location.label,
        value: location.value,
        appConnectionId: location.appConnectionId,
        metadata: location.metadata,
        isDefault: location.isDefault,
        isActive: location.isActive,
        position: location.position,
      })),
    )
  }

  if (normalizedCalendars.length > 0) {
    await tx.insert(bookingEventTypeCalendar).values(
      normalizedCalendars.map((calendar) => ({
        eventTypeId,
        appConnectionId: calendar.appConnectionId,
        purpose: calendar.purpose,
        isPrimary: calendar.isPrimary,
      })),
    )
  }

  if (normalizedQuestions.length > 0) {
    await tx.insert(bookingEventTypeQuestion).values(
      normalizedQuestions.map((question) => ({
        eventTypeId,
        fieldKey: question.fieldKey,
        label: question.label,
        description: question.description,
        inputType: question.inputType,
        visibility: question.visibility,
        placeholder: question.placeholder,
        options: question.options,
        isSystem: question.isSystem,
        position: question.position,
      })),
    )
  }
}

export async function ensureDefaultBookingAvailabilityForAdmin(currentUser: SessionUser) {
  assertAdminBookingAccess(currentUser)

  const [existing] = await db
    .select()
    .from(bookingAvailabilitySchedule)
    .where(eq(bookingAvailabilitySchedule.userId, currentUser.id))
    .orderBy(
      desc(bookingAvailabilitySchedule.isDefault),
      asc(bookingAvailabilitySchedule.createdAt),
    )
    .limit(1)

  if (!existing) {
    const [created] = await db
      .insert(bookingAvailabilitySchedule)
      .values({
        userId: currentUser.id,
        name: "Working hours",
        timezone: "UTC",
        isDefault: true,
        isActive: true,
      })
      .$returningId()

    const scheduleId = created?.id
    if (!scheduleId) {
      throw new Error("Unable to create default availability schedule")
    }

    await db.insert(bookingAvailabilityWindow).values(
      DEFAULT_BOOKING_AVAILABILITY_WINDOWS.map((window) => ({
        scheduleId,
        dayOfWeek: window.dayOfWeek,
        startMinute: window.startMinute,
        endMinute: window.endMinute,
        position: window.position,
      })),
    )
  } else {
    const [firstWindow] = await db
      .select({ id: bookingAvailabilityWindow.id })
      .from(bookingAvailabilityWindow)
      .where(eq(bookingAvailabilityWindow.scheduleId, existing.id))
      .limit(1)

    if (!firstWindow) {
      await db.insert(bookingAvailabilityWindow).values(
        DEFAULT_BOOKING_AVAILABILITY_WINDOWS.map((window) => ({
          scheduleId: existing.id,
          dayOfWeek: window.dayOfWeek,
          startMinute: window.startMinute,
          endMinute: window.endMinute,
          position: window.position,
        })),
      )
    }
  }

  const schedules = await hydrateAvailabilitySchedules(currentUser.id)
  const primarySchedule =
    schedules.find((schedule) => schedule.isDefault) ?? schedules[0] ?? null

  if (!primarySchedule) {
    throw new Error("Unable to resolve admin availability")
  }

  return primarySchedule
}

export async function listBookingAvailabilitySchedulesForAdmin(currentUser: SessionUser) {
  assertAdminBookingAccess(currentUser)
  await ensureDefaultBookingAvailabilityForAdmin(currentUser)
  return hydrateAvailabilitySchedules(currentUser.id)
}

export async function updateBookingAvailabilityForAdmin(
  currentUser: SessionUser,
  input: BookingAvailabilityInput,
) {
  assertAdminBookingAccess(currentUser)

  const schedule =
    input.scheduleId
      ? await ensureScheduleBelongsToUser(currentUser.id, input.scheduleId)
      : await ensureDefaultBookingAvailabilityForAdmin(currentUser)

  const windows = normalizeAvailabilityWindows(input.windows)
  const overrides = normalizeAvailabilityOverrides(input.overrides)

  await db.transaction(async (tx) => {
    await tx
      .update(bookingAvailabilitySchedule)
      .set({
        name: input.name?.trim() || schedule.name,
        timezone: input.timezone,
        isDefault: true,
        updatedAt: new Date(),
      })
      .where(eq(bookingAvailabilitySchedule.id, schedule.id))

    await tx
      .delete(bookingAvailabilityWindow)
      .where(eq(bookingAvailabilityWindow.scheduleId, schedule.id))
    await tx
      .delete(bookingAvailabilityOverride)
      .where(eq(bookingAvailabilityOverride.scheduleId, schedule.id))

    if (windows.length > 0) {
      await tx.insert(bookingAvailabilityWindow).values(
        windows.map((window) => ({
          scheduleId: schedule.id,
          dayOfWeek: window.dayOfWeek,
          startMinute: window.startMinute,
          endMinute: window.endMinute,
          position: window.position,
        })),
      )
    }

    if (overrides.length > 0) {
      await tx.insert(bookingAvailabilityOverride).values(
        overrides.map((override) => ({
          scheduleId: schedule.id,
          date: override.date,
          kind: override.kind,
          startMinute: override.startMinute,
          endMinute: override.endMinute,
          reason: override.reason,
        })),
      )
    }
  })

  const schedules = await hydrateAvailabilitySchedules(currentUser.id)
  return schedules.find((item) => item.id === schedule.id) ?? null
}

export async function listBookingAppConnectionsForAdmin(currentUser: SessionUser) {
  assertAdminBookingAccess(currentUser)

  return db
    .select()
    .from(bookingAppConnection)
    .where(eq(bookingAppConnection.userId, currentUser.id))
    .orderBy(
      asc(bookingAppConnection.provider),
      asc(bookingAppConnection.accountLabel),
    )
}

export async function createBookingAppConnectionAsAdmin(
  currentUser: SessionUser,
  input: BookingAppConnectionInput,
) {
  assertAdminBookingAccess(currentUser)

  const [created] = await db
    .insert(bookingAppConnection)
    .values({
      userId: currentUser.id,
      provider: input.provider,
      status: input.status ?? "connected",
      accountEmail: input.accountEmail?.trim() || null,
      accountLabel: input.accountLabel.trim(),
      externalAccountId: input.externalAccountId?.trim() || crypto.randomUUID(),
      externalCalendarId: input.externalCalendarId?.trim() || null,
      externalCalendarName: input.externalCalendarName?.trim() || null,
      scopes: input.scopes?.trim() || null,
      metadata: input.metadata ?? null,
      supportsCalendar: Boolean(input.supportsCalendar),
      supportsConferencing: Boolean(input.supportsConferencing),
      canCheckConflicts: Boolean(input.canCheckConflicts),
      canCreateEvents: Boolean(input.canCreateEvents),
    })
    .$returningId()

  const connectionId = created?.id
  if (!connectionId) {
    throw new Error("Unable to create app connection")
  }

  const [connection] = await db
    .select()
    .from(bookingAppConnection)
    .where(eq(bookingAppConnection.id, connectionId))
    .limit(1)

  if (!connection) {
    throw new Error("Connected app was created but could not be loaded")
  }

  return connection
}

export async function updateBookingAppConnectionAsAdmin(
  currentUser: SessionUser,
  connectionId: string,
  input: BookingAppConnectionInput,
) {
  assertAdminBookingAccess(currentUser)

  const connectionMap = await ensureConnectionsBelongToUser(currentUser.id, [
    connectionId,
  ])
  const connection = connectionMap.get(connectionId)
  if (!connection) {
    throw new Error("Connected app not found")
  }

  await db
    .update(bookingAppConnection)
    .set({
      provider: input.provider,
      status: input.status ?? connection.status,
      accountEmail: input.accountEmail?.trim() || null,
      accountLabel: input.accountLabel.trim(),
      externalCalendarId: input.externalCalendarId?.trim() || null,
      externalCalendarName: input.externalCalendarName?.trim() || null,
      scopes: input.scopes?.trim() || null,
      metadata: input.metadata ?? null,
      supportsCalendar: Boolean(input.supportsCalendar),
      supportsConferencing: Boolean(input.supportsConferencing),
      canCheckConflicts: Boolean(input.canCheckConflicts),
      canCreateEvents: Boolean(input.canCreateEvents),
      updatedAt: new Date(),
    })
    .where(eq(bookingAppConnection.id, connectionId))

  const [updated] = await db
    .select()
    .from(bookingAppConnection)
    .where(eq(bookingAppConnection.id, connectionId))
    .limit(1)

  if (!updated) {
    throw new Error("Unable to reload connected app")
  }

  return updated
}

export async function deleteBookingAppConnectionAsAdmin(
  currentUser: SessionUser,
  connectionId: string,
) {
  assertAdminBookingAccess(currentUser)
  await ensureConnectionsBelongToUser(currentUser.id, [connectionId])

  const [locationUsage, calendarUsage, bookingUsage] = await Promise.all([
    db
      .select({ id: bookingEventTypeLocation.id })
      .from(bookingEventTypeLocation)
      .where(eq(bookingEventTypeLocation.appConnectionId, connectionId))
      .limit(1),
    db
      .select({ eventTypeId: bookingEventTypeCalendar.eventTypeId })
      .from(bookingEventTypeCalendar)
      .where(eq(bookingEventTypeCalendar.appConnectionId, connectionId))
      .limit(1),
    db
      .select({ id: booking.id })
      .from(booking)
      .where(eq(booking.appConnectionId, connectionId))
      .limit(1),
  ])

  if (
    locationUsage.length > 0 ||
    calendarUsage.length > 0 ||
    bookingUsage.length > 0
  ) {
    throw new Error("This connected app is already used by event types or bookings")
  }

  await db
    .delete(bookingAppConnection)
    .where(eq(bookingAppConnection.id, connectionId))
}

export async function listBookingEventTypesForAdmin(currentUser: SessionUser) {
  assertAdminBookingAccess(currentUser)
  await ensureDefaultBookingAvailabilityForAdmin(currentUser)

  const [eventTypes, locations, counts] = await Promise.all([
    db
      .select()
      .from(bookingEventType)
      .where(eq(bookingEventType.userId, currentUser.id))
      .orderBy(desc(bookingEventType.updatedAt)),
    db
      .select({
        eventTypeId: bookingEventTypeLocation.eventTypeId,
        kind: bookingEventTypeLocation.kind,
        label: bookingEventTypeLocation.label,
        isDefault: bookingEventTypeLocation.isDefault,
      })
      .from(bookingEventTypeLocation)
      .orderBy(
        asc(bookingEventTypeLocation.eventTypeId),
        desc(bookingEventTypeLocation.isDefault),
        asc(bookingEventTypeLocation.position),
      ),
    db
      .select({
        eventTypeId: booking.eventTypeId,
        total: sql<number>`count(*)`,
        upcoming: sql<number>`sum(case when ${booking.startsAt} >= now() and ${booking.status} in ('pending', 'confirmed') then 1 else 0 end)`,
      })
      .from(booking)
      .groupBy(booking.eventTypeId),
  ])

  const locationsByEventTypeId = new Map<
    string,
    Array<{
      kind: typeof bookingEventTypeLocation.$inferSelect.kind
      label: string
      isDefault: boolean
    }>
  >()
  for (const location of locations) {
    const current = locationsByEventTypeId.get(location.eventTypeId) ?? []
    current.push({
      kind: location.kind,
      label: location.label,
      isDefault: location.isDefault,
    })
    locationsByEventTypeId.set(location.eventTypeId, current)
  }

  const countsByEventTypeId = new Map(
    counts.map((item) => [
      item.eventTypeId,
      {
        total: Number(item.total ?? 0),
        upcoming: Number(item.upcoming ?? 0),
      },
    ]),
  )

  return eventTypes.map((eventType) => ({
    ...eventType,
    locations: locationsByEventTypeId.get(eventType.id) ?? [],
    bookingCount: countsByEventTypeId.get(eventType.id)?.total ?? 0,
    upcomingBookingCount: countsByEventTypeId.get(eventType.id)?.upcoming ?? 0,
  }))
}

export async function getBookingEventTypeForAdmin(
  currentUser: SessionUser,
  eventTypeId: string,
) {
  assertAdminBookingAccess(currentUser)

  const [eventType] = await db
    .select()
    .from(bookingEventType)
    .where(
      and(
        eq(bookingEventType.id, eventTypeId),
        eq(bookingEventType.userId, currentUser.id),
      ),
    )
    .limit(1)

  if (!eventType) {
    return null
  }

  const [locations, calendars, questions] = await Promise.all([
    db
      .select()
      .from(bookingEventTypeLocation)
      .where(eq(bookingEventTypeLocation.eventTypeId, eventTypeId))
      .orderBy(
        desc(bookingEventTypeLocation.isDefault),
        asc(bookingEventTypeLocation.position),
      ),
    db
      .select()
      .from(bookingEventTypeCalendar)
      .where(eq(bookingEventTypeCalendar.eventTypeId, eventTypeId))
      .orderBy(
        desc(bookingEventTypeCalendar.isPrimary),
        asc(bookingEventTypeCalendar.purpose),
      ),
    db
      .select()
      .from(bookingEventTypeQuestion)
      .where(eq(bookingEventTypeQuestion.eventTypeId, eventTypeId))
      .orderBy(asc(bookingEventTypeQuestion.position)),
  ])

  return {
    ...eventType,
    locations,
    calendars,
    questions,
  }
}

export async function createBookingEventTypeAsAdmin(
  currentUser: SessionUser,
  input: BookingEventTypeInput,
) {
  assertAdminBookingAccess(currentUser)

  const schedule =
    input.availabilityScheduleId
      ? await ensureScheduleBelongsToUser(
          currentUser.id,
          input.availabilityScheduleId,
        )
      : await ensureDefaultBookingAvailabilityForAdmin(currentUser)

  const slug = await resolveUniqueEventTypeSlug(
    currentUser.id,
    input.slug?.trim() || input.title,
  )

  const [created] = await db
    .insert(bookingEventType)
    .values({
      userId: currentUser.id,
      availabilityScheduleId: schedule.id,
      title: input.title.trim(),
      slug,
      description: input.description?.trim() || null,
      status: input.status ?? "draft",
      durationMinutes: input.durationMinutes,
      allowMultipleDurations: Boolean(input.allowMultipleDurations),
      durationOptions: input.durationOptions ?? null,
      color: input.color?.trim() || null,
      bookingNoticeMinutes: input.bookingNoticeMinutes ?? 0,
      bookingWindowDays: input.bookingWindowDays ?? 90,
      bufferBeforeMinutes: input.bufferBeforeMinutes ?? 0,
      bufferAfterMinutes: input.bufferAfterMinutes ?? 0,
      maxBookingsPerDay: input.maxBookingsPerDay ?? null,
      requireEmailVerification: Boolean(input.requireEmailVerification),
      allowGuestBookings:
        typeof input.allowGuestBookings === "boolean"
          ? input.allowGuestBookings
          : true,
      requireLogin: Boolean(input.requireLogin),
      allowCancellation:
        typeof input.allowCancellation === "boolean"
          ? input.allowCancellation
          : true,
      allowReschedule:
        typeof input.allowReschedule === "boolean"
          ? input.allowReschedule
          : true,
      isPublic: typeof input.isPublic === "boolean" ? input.isPublic : true,
      confirmationChannels: input.confirmationChannels ?? ["email"],
    })
    .$returningId()

  const eventTypeId = created?.id
  if (!eventTypeId) {
    throw new Error("Unable to create event type")
  }

  await db.transaction(async (tx) => {
    await replaceEventTypeChildren(
      tx,
      eventTypeId,
      currentUser.id,
      input.locations,
      input.calendars,
      input.questions,
    )
  })

  return eventTypeId
}

export async function updateBookingEventTypeAsAdmin(
  currentUser: SessionUser,
  eventTypeId: string,
  input: BookingEventTypeInput,
) {
  assertAdminBookingAccess(currentUser)

  const existing = await getBookingEventTypeForAdmin(currentUser, eventTypeId)
  if (!existing) {
    throw new Error("Event type not found")
  }

  const scheduleId =
    input.availabilityScheduleId === null
      ? null
      : input.availabilityScheduleId
        ? (
            await ensureScheduleBelongsToUser(
              currentUser.id,
              input.availabilityScheduleId,
            )
          ).id
        : existing.availabilityScheduleId

  const slug =
    input.slug || input.title
      ? await resolveUniqueEventTypeSlug(
          currentUser.id,
          input.slug?.trim() || input.title,
          eventTypeId,
        )
      : existing.slug

  await db.transaction(async (tx) => {
    await tx
      .update(bookingEventType)
      .set({
        availabilityScheduleId: scheduleId,
        title: input.title.trim(),
        slug,
        description: input.description?.trim() || null,
        status: input.status ?? existing.status,
        durationMinutes: input.durationMinutes,
        allowMultipleDurations: Boolean(input.allowMultipleDurations),
        durationOptions: input.durationOptions ?? null,
        color: input.color?.trim() || null,
        bookingNoticeMinutes: input.bookingNoticeMinutes ?? 0,
        bookingWindowDays: input.bookingWindowDays ?? 90,
        bufferBeforeMinutes: input.bufferBeforeMinutes ?? 0,
        bufferAfterMinutes: input.bufferAfterMinutes ?? 0,
        maxBookingsPerDay: input.maxBookingsPerDay ?? null,
        requireEmailVerification: Boolean(input.requireEmailVerification),
        allowGuestBookings:
          typeof input.allowGuestBookings === "boolean"
            ? input.allowGuestBookings
            : true,
        requireLogin: Boolean(input.requireLogin),
        allowCancellation:
          typeof input.allowCancellation === "boolean"
            ? input.allowCancellation
            : true,
        allowReschedule:
          typeof input.allowReschedule === "boolean"
            ? input.allowReschedule
            : true,
        isPublic: typeof input.isPublic === "boolean" ? input.isPublic : true,
        confirmationChannels: input.confirmationChannels ?? ["email"],
        updatedAt: new Date(),
      })
      .where(eq(bookingEventType.id, eventTypeId))

    await replaceEventTypeChildren(
      tx,
      eventTypeId,
      currentUser.id,
      input.locations ??
        existing.locations.map((location) => ({
          kind: location.kind as BookingLocationKind,
          label: location.label,
          value: location.value,
          appConnectionId: location.appConnectionId,
          metadata: location.metadata,
          isDefault: location.isDefault,
          isActive: location.isActive,
          position: location.position,
        })),
      input.calendars ??
        existing.calendars.map((calendar) => ({
          appConnectionId: calendar.appConnectionId,
          purpose: calendar.purpose as BookingEventTypeCalendarPurpose,
          isPrimary: calendar.isPrimary,
        })),
      input.questions ??
        existing.questions.map((question) => ({
          fieldKey: question.fieldKey,
          label: question.label,
          description: question.description,
          inputType: question.inputType as BookingQuestionType,
          visibility: question.visibility as BookingQuestionVisibility,
          placeholder: question.placeholder,
          options: question.options,
          isSystem: question.isSystem,
          position: question.position,
        })),
    )
  })

  return eventTypeId
}

export async function deleteBookingEventTypeAsAdmin(
  currentUser: SessionUser,
  eventTypeId: string,
) {
  assertAdminBookingAccess(currentUser)

  const [existing] = await db
    .select({ id: bookingEventType.id })
    .from(bookingEventType)
    .where(
      and(
        eq(bookingEventType.id, eventTypeId),
        eq(bookingEventType.userId, currentUser.id),
      ),
    )
    .limit(1)

  if (!existing) {
    throw new Error("Event type not found")
  }

  const [existingBooking] = await db
    .select({ id: booking.id })
    .from(booking)
    .where(eq(booking.eventTypeId, eventTypeId))
    .limit(1)

  if (existingBooking) {
    throw new Error("This event type already has bookings and cannot be deleted")
  }

  await db.delete(bookingEventType).where(eq(bookingEventType.id, eventTypeId))
}

export async function listBookingsForAdmin(currentUser: SessionUser) {
  assertAdminBookingAccess(currentUser)

  const rows = await db
    .select({
      id: booking.id,
      status: booking.status,
      source: booking.source,
      title: booking.title,
      attendeeName: booking.attendeeName,
      attendeeEmail: booking.attendeeEmail,
      attendeePhone: booking.attendeePhone,
      attendeeTimezone: booking.attendeeTimezone,
      locationKind: booking.locationKind,
      locationLabel: booking.locationLabel,
      meetingUrl: booking.meetingUrl,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      confirmedAt: booking.confirmedAt,
      cancelledAt: booking.cancelledAt,
      createdAt: booking.createdAt,
      eventTypeId: booking.eventTypeId,
      eventTypeTitle: bookingEventType.title,
    })
    .from(booking)
    .innerJoin(bookingEventType, eq(booking.eventTypeId, bookingEventType.id))
    .where(eq(booking.ownerUserId, currentUser.id))
    .orderBy(asc(booking.startsAt), desc(booking.createdAt))

  const now = Date.now()

  return {
    rows,
    summary: {
      total: rows.length,
      upcoming: rows.filter((item) => item.startsAt.getTime() >= now).length,
      pending: rows.filter((item) => item.status === "pending").length,
      confirmed: rows.filter((item) => item.status === "confirmed").length,
      cancelled: rows.filter((item) => item.status === "cancelled").length,
    },
  }
}

export async function getBookingProfileForSettings(currentUser: SessionUser) {
  const [record] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      username: user.username,
      bio: user.bio,
      phone: user.phone,
      timezone: user.timezone,
      bookingPageTitle: user.bookingPageTitle,
      bookingPageDescription: user.bookingPageDescription,
      bookingEnabled: user.bookingEnabled,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
    })
    .from(user)
    .where(eq(user.id, currentUser.id))
    .limit(1)

  if (!record) {
    throw new Error("User not found")
  }

  return record
}
