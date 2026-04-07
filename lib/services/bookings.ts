import { and, asc, desc, eq, gt, inArray, lt, ne, sql } from "drizzle-orm"

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
  isDefault?: boolean
  isActive?: boolean
  windows: BookingAvailabilityWindowInput[]
  overrides?: BookingAvailabilityOverrideInput[]
}

export type BookingAvailabilityCreateInput = {
  name: string
  timezone?: string
  cloneFromScheduleId?: string | null
  setAsDefault?: boolean
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

function assertClientBookingAccess(currentUser: SessionUser) {
  if (currentUser.role !== "client") {
    throw new Error("Only clients can book consultation slots")
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

async function resolveUniqueScheduleName(
  userId: string,
  value: string,
  excludeId?: string,
) {
  const baseName = value.trim() || "Working hours"
  let candidate = baseName
  let suffix = 2

  while (true) {
    const [existing] = await db
      .select({ id: bookingAvailabilitySchedule.id })
      .from(bookingAvailabilitySchedule)
      .where(
        and(
          eq(bookingAvailabilitySchedule.userId, userId),
          eq(bookingAvailabilitySchedule.name, candidate),
          excludeId ? ne(bookingAvailabilitySchedule.id, excludeId) : undefined,
        ),
      )
      .limit(1)

    if (!existing) {
      return candidate
    }

    candidate = `${baseName} ${suffix}`
    suffix += 1
  }
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

  if (!primarySchedule.isDefault) {
    await db
      .update(bookingAvailabilitySchedule)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(bookingAvailabilitySchedule.id, primarySchedule.id))
  }

  return {
    ...primarySchedule,
    isDefault: true,
  }
}

export async function listBookingAvailabilitySchedulesForAdmin(currentUser: SessionUser) {
  assertAdminBookingAccess(currentUser)
  await ensureDefaultBookingAvailabilityForAdmin(currentUser)
  return hydrateAvailabilitySchedules(currentUser.id)
}

export async function createBookingAvailabilityScheduleForAdmin(
  currentUser: SessionUser,
  input: BookingAvailabilityCreateInput,
) {
  assertAdminBookingAccess(currentUser)
  await ensureDefaultBookingAvailabilityForAdmin(currentUser)

  const sourceScheduleId = input.cloneFromScheduleId ?? null
  const sourceSchedule = sourceScheduleId
    ? (await hydrateAvailabilitySchedules(currentUser.id)).find(
        (schedule) => schedule.id === sourceScheduleId,
      ) ?? null
    : null

  if (sourceScheduleId && !sourceSchedule) {
    throw new Error("Schedule to copy was not found")
  }

  const name = await resolveUniqueScheduleName(currentUser.id, input.name)
  const timezone =
    input.timezone?.trim() ||
    sourceSchedule?.timezone ||
    "UTC"
  const windowsSource =
    sourceSchedule?.windows.length
      ? sourceSchedule.windows
      : DEFAULT_BOOKING_AVAILABILITY_WINDOWS
  const overridesSource = sourceSchedule?.overrides ?? []

  const [created] = await db.transaction(async (tx) => {
    if (input.setAsDefault) {
      await tx
        .update(bookingAvailabilitySchedule)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(bookingAvailabilitySchedule.userId, currentUser.id))
    }

    const [result] = await tx
      .insert(bookingAvailabilitySchedule)
      .values({
        userId: currentUser.id,
        name,
        timezone,
        isDefault: Boolean(input.setAsDefault),
        isActive: true,
      })
      .$returningId()

    const scheduleId = result?.id
    if (!scheduleId) {
      throw new Error("Unable to create availability schedule")
    }

    await tx.insert(bookingAvailabilityWindow).values(
      windowsSource.map((window, index) => ({
        scheduleId,
        dayOfWeek: window.dayOfWeek,
        startMinute: window.startMinute,
        endMinute: window.endMinute,
        position: window.position ?? index,
      })),
    )

    if (overridesSource.length > 0) {
      await tx.insert(bookingAvailabilityOverride).values(
        overridesSource.map((override) => ({
          scheduleId,
          date: override.date,
          kind: override.kind,
          startMinute: override.startMinute,
          endMinute: override.endMinute,
          reason: override.reason,
        })),
      )
    }

    return [result]
  })

  const scheduleId = created?.id
  if (!scheduleId) {
    throw new Error("Availability schedule was created but could not be loaded")
  }

  const schedules = await hydrateAvailabilitySchedules(currentUser.id)
  return schedules.find((schedule) => schedule.id === scheduleId) ?? null
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
  const shouldBecomeDefault = input.isDefault === true
  const name = input.name?.trim()
    ? await resolveUniqueScheduleName(
        currentUser.id,
        input.name,
        schedule.id,
      )
    : schedule.name

  await db.transaction(async (tx) => {
    if (shouldBecomeDefault) {
      await tx
        .update(bookingAvailabilitySchedule)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(bookingAvailabilitySchedule.userId, currentUser.id),
            ne(bookingAvailabilitySchedule.id, schedule.id),
          ),
        )
    }

    await tx
      .update(bookingAvailabilitySchedule)
      .set({
        name,
        timezone: input.timezone,
        isDefault: shouldBecomeDefault ? true : schedule.isDefault,
        isActive:
          typeof input.isActive === "boolean"
            ? input.isActive
            : schedule.isActive,
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

export async function deleteBookingAvailabilityScheduleForAdmin(
  currentUser: SessionUser,
  scheduleId: string,
) {
  assertAdminBookingAccess(currentUser)
  await ensureDefaultBookingAvailabilityForAdmin(currentUser)

  const schedules = await hydrateAvailabilitySchedules(currentUser.id)
  const schedule = schedules.find((item) => item.id === scheduleId)

  if (!schedule) {
    throw new Error("Availability schedule not found")
  }

  if (schedules.length === 1) {
    throw new Error("At least one availability schedule must remain")
  }

  const [linkedEventType] = await db
    .select({ id: bookingEventType.id })
    .from(bookingEventType)
    .where(eq(bookingEventType.availabilityScheduleId, scheduleId))
    .limit(1)

  if (linkedEventType) {
    throw new Error("This availability is already assigned to an event type")
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(bookingAvailabilitySchedule)
      .where(eq(bookingAvailabilitySchedule.id, scheduleId))

    if (schedule.isDefault) {
      const fallback = schedules.find((item) => item.id !== scheduleId)
      if (fallback) {
        await tx
          .update(bookingAvailabilitySchedule)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(bookingAvailabilitySchedule.id, fallback.id))
      }
    }
  })
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

type DateParts = {
  year: number
  month: number
  day: number
}

type MinuteRange = {
  startMinute: number
  endMinute: number
}

type ResolvedClientBookableEvent = {
  adminLead: {
    id: string
    name: string
    bookingPageTitle: string | null
    bookingPageDescription: string | null
  }
  eventType: typeof bookingEventType.$inferSelect
  schedule: typeof bookingAvailabilitySchedule.$inferSelect
  windows: typeof bookingAvailabilityWindow.$inferSelect[]
  overrides: typeof bookingAvailabilityOverride.$inferSelect[]
  location: typeof bookingEventTypeLocation.$inferSelect | null
}

type ClientSlotComputationInput = {
  fromDate?: string
  days: number
  durationMinutes: number
}

type ClientSlotComputationResult = {
  timezone: string
  selectedDurationMinutes: number
  days: Array<{
    date: string
    label: string
    slots: Array<{
      startsAt: Date
      endsAt: Date
    }>
  }>
}

const SLOT_STEP_MINUTES = 15
const ACTIVE_BOOKING_STATUSES: Array<(typeof booking.$inferSelect)["status"]> = [
  "pending",
  "confirmed",
]

function normalizeTimeZone(value: string | null | undefined) {
  const fallback = "UTC"
  const candidate = value?.trim()

  if (!candidate) {
    return fallback
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date())
    return candidate
  } catch {
    return fallback
  }
}

function parseDateKey(value: string | undefined): DateParts | null {
  if (!value) {
    return null
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  return { year, month, day }
}

function toDateKey(parts: DateParts) {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(
    2,
    "0",
  )}-${String(parts.day).padStart(2, "0")}`
}

function addDaysToDateParts(parts: DateParts, days: number): DateParts {
  const anchor = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days))
  return {
    year: anchor.getUTCFullYear(),
    month: anchor.getUTCMonth() + 1,
    day: anchor.getUTCDate(),
  }
}

function getDatePartsInTimeZone(reference: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = formatter.formatToParts(reference)

  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0")
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1")
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "1")

  return { year, month, day }
}

function getTimeZoneOffsetMinutes(reference: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(reference)

  const token = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT"
  if (token === "GMT" || token === "UTC") {
    return 0
  }

  const match = /^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(token)
  if (!match) {
    return 0
  }

  const sign = match[1] === "-" ? -1 : 1
  const hours = Number(match[2] ?? "0")
  const minutes = Number(match[3] ?? "0")

  return sign * (hours * 60 + minutes)
}

function zonedDateTimeToUtc(parts: DateParts, minuteOfDay: number, timeZone: string) {
  const normalizedMinute = Math.max(0, Math.min(24 * 60, Math.round(minuteOfDay)))
  const hour = Math.floor(normalizedMinute / 60)
  const minute = normalizedMinute % 60

  let utcTime = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0)
  const initialOffset = getTimeZoneOffsetMinutes(new Date(utcTime), timeZone)
  utcTime -= initialOffset * 60 * 1000
  const correctedOffset = getTimeZoneOffsetMinutes(new Date(utcTime), timeZone)

  if (correctedOffset !== initialOffset) {
    utcTime += (initialOffset - correctedOffset) * 60 * 1000
  }

  return new Date(utcTime)
}

function mergeMinuteRanges(ranges: MinuteRange[]) {
  if (ranges.length === 0) {
    return []
  }

  const sorted = [...ranges]
    .map((range) => ({
      startMinute: Math.max(0, Math.min(24 * 60, Math.round(range.startMinute))),
      endMinute: Math.max(0, Math.min(24 * 60, Math.round(range.endMinute))),
    }))
    .filter((range) => range.startMinute < range.endMinute)
    .sort((left, right) => {
      if (left.startMinute !== right.startMinute) {
        return left.startMinute - right.startMinute
      }

      return left.endMinute - right.endMinute
    })

  const merged: MinuteRange[] = []

  for (const range of sorted) {
    const previous = merged.at(-1)

    if (!previous || range.startMinute > previous.endMinute) {
      merged.push({ ...range })
      continue
    }

    previous.endMinute = Math.max(previous.endMinute, range.endMinute)
  }

  return merged
}

function subtractMinuteRange(ranges: MinuteRange[], blocked: MinuteRange) {
  if (blocked.startMinute >= blocked.endMinute) {
    return ranges
  }

  const next: MinuteRange[] = []
  for (const range of ranges) {
    if (blocked.endMinute <= range.startMinute || blocked.startMinute >= range.endMinute) {
      next.push(range)
      continue
    }

    if (blocked.startMinute > range.startMinute) {
      next.push({
        startMinute: range.startMinute,
        endMinute: blocked.startMinute,
      })
    }

    if (blocked.endMinute < range.endMinute) {
      next.push({
        startMinute: blocked.endMinute,
        endMinute: range.endMinute,
      })
    }
  }

  return mergeMinuteRanges(next)
}

function applyAvailabilityOverrides(
  baseWindows: MinuteRange[],
  dayOverrides: typeof bookingAvailabilityOverride.$inferSelect[],
) {
  let effective = mergeMinuteRanges(baseWindows)

  for (const override of dayOverrides) {
    if (override.kind === "unavailable") {
      if (override.startMinute === null || override.endMinute === null) {
        return []
      }

      effective = subtractMinuteRange(effective, {
        startMinute: override.startMinute,
        endMinute: override.endMinute,
      })
      continue
    }

    if (override.startMinute === null || override.endMinute === null) {
      continue
    }

    effective = mergeMinuteRanges(
      effective.concat({
        startMinute: override.startMinute,
        endMinute: override.endMinute,
      }),
    )
  }

  return effective
}

function resolveEventTypeDurationMinutes(
  eventType: typeof bookingEventType.$inferSelect,
  requestedDurationMinutes?: number,
) {
  const baseDuration = Math.max(5, Math.round(eventType.durationMinutes))
  const options = Array.from(
    new Set(
      [
        baseDuration,
        ...(eventType.allowMultipleDurations
          ? (eventType.durationOptions ?? [])
          : []),
      ]
        .map((value) => Math.round(value))
        .filter((value) => Number.isFinite(value) && value >= 5 && value <= 8 * 60),
    ),
  ).sort((left, right) => left - right)

  if (options.length === 0) {
    return baseDuration
  }

  if (!eventType.allowMultipleDurations) {
    return baseDuration
  }

  if (
    typeof requestedDurationMinutes === "number" &&
    options.includes(Math.round(requestedDurationMinutes))
  ) {
    return Math.round(requestedDurationMinutes)
  }

  return options.includes(baseDuration) ? baseDuration : options[0]
}

async function getDefaultProposalLeadForClientBooking() {
  const [adminLead] = await db
    .select({
      id: user.id,
      name: user.name,
      bookingPageTitle: user.bookingPageTitle,
      bookingPageDescription: user.bookingPageDescription,
      bookingEnabled: user.bookingEnabled,
    })
    .from(user)
    .where(and(eq(user.role, "admin"), eq(user.isActive, true)))
    .orderBy(asc(user.createdAt), asc(user.name))
    .limit(1)

  if (!adminLead || !adminLead.bookingEnabled) {
    throw new Error("No active admin is available for booking")
  }

  return adminLead
}

async function resolveBookableEventTypeForClient(
  currentUser: SessionUser,
  eventTypeId: string,
): Promise<ResolvedClientBookableEvent> {
  assertClientBookingAccess(currentUser)

  const adminLead = await getDefaultProposalLeadForClientBooking()
  const [eventType] = await db
    .select()
    .from(bookingEventType)
    .where(
      and(
        eq(bookingEventType.id, eventTypeId),
        eq(bookingEventType.userId, adminLead.id),
        eq(bookingEventType.status, "active"),
        eq(bookingEventType.isPublic, true),
      ),
    )
    .limit(1)

  if (!eventType) {
    throw new Error("Bookable event type not found")
  }

  const [defaultSchedule] = await db
    .select({
      id: bookingAvailabilitySchedule.id,
      timezone: bookingAvailabilitySchedule.timezone,
      isActive: bookingAvailabilitySchedule.isActive,
    })
    .from(bookingAvailabilitySchedule)
    .where(
      and(
        eq(bookingAvailabilitySchedule.userId, adminLead.id),
        eq(bookingAvailabilitySchedule.isDefault, true),
      ),
    )
    .orderBy(asc(bookingAvailabilitySchedule.createdAt))
    .limit(1)

  const scheduleId = eventType.availabilityScheduleId ?? defaultSchedule?.id
  if (!scheduleId) {
    throw new Error("No availability schedule is configured for this event type")
  }

  const [schedule] = await db
    .select()
    .from(bookingAvailabilitySchedule)
    .where(
      and(
        eq(bookingAvailabilitySchedule.id, scheduleId),
        eq(bookingAvailabilitySchedule.userId, adminLead.id),
      ),
    )
    .limit(1)

  if (!schedule || !schedule.isActive) {
    throw new Error("This event type is not currently accepting bookings")
  }

  const [windows, overrides, locations] = await Promise.all([
    db
      .select()
      .from(bookingAvailabilityWindow)
      .where(eq(bookingAvailabilityWindow.scheduleId, schedule.id))
      .orderBy(
        asc(bookingAvailabilityWindow.dayOfWeek),
        asc(bookingAvailabilityWindow.position),
      ),
    db
      .select()
      .from(bookingAvailabilityOverride)
      .where(eq(bookingAvailabilityOverride.scheduleId, schedule.id))
      .orderBy(asc(bookingAvailabilityOverride.date)),
    db
      .select()
      .from(bookingEventTypeLocation)
      .where(
        and(
          eq(bookingEventTypeLocation.eventTypeId, eventType.id),
          eq(bookingEventTypeLocation.isActive, true),
        ),
      )
      .orderBy(
        desc(bookingEventTypeLocation.isDefault),
        asc(bookingEventTypeLocation.position),
      ),
  ])

  return {
    adminLead: {
      id: adminLead.id,
      name: adminLead.name,
      bookingPageTitle: adminLead.bookingPageTitle,
      bookingPageDescription: adminLead.bookingPageDescription,
    },
    eventType,
    schedule,
    windows,
    overrides,
    location: locations[0] ?? null,
  }
}

function formatDayLabel(parts: DateParts, timeZone: string) {
  const anchor = zonedDateTimeToUtc(parts, 12 * 60, timeZone)
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(anchor)
}

async function computeClientSlotsForResolvedEvent(
  resolved: ResolvedClientBookableEvent,
  input: ClientSlotComputationInput,
): Promise<ClientSlotComputationResult> {
  const timezone = normalizeTimeZone(resolved.schedule.timezone)
  const durationMinutes = resolveEventTypeDurationMinutes(
    resolved.eventType,
    input.durationMinutes,
  )
  const normalizedDays = Math.max(1, Math.min(31, Math.round(input.days)))
  const now = new Date()
  const earliestStart = new Date(
    now.getTime() + resolved.eventType.bookingNoticeMinutes * 60 * 1000,
  )
  const latestStart = new Date(
    now.getTime() + resolved.eventType.bookingWindowDays * 24 * 60 * 60 * 1000,
  )

  const fromParts =
    parseDateKey(input.fromDate) ?? getDatePartsInTimeZone(now, timezone)
  const rangeStart = zonedDateTimeToUtc(fromParts, 0, timezone)
  const rangeEnd = zonedDateTimeToUtc(
    addDaysToDateParts(fromParts, normalizedDays),
    0,
    timezone,
  )

  const existingBookings = await db
    .select({
      eventTypeId: booking.eventTypeId,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      status: booking.status,
    })
    .from(booking)
    .where(
      and(
        eq(booking.ownerUserId, resolved.adminLead.id),
        inArray(booking.status, ACTIVE_BOOKING_STATUSES),
        lt(booking.startsAt, rangeEnd),
        gt(booking.endsAt, rangeStart),
      ),
    )
    .orderBy(asc(booking.startsAt))

  const blockedIntervals = existingBookings.map((item) => ({
    startsAt: new Date(
      item.startsAt.getTime() - resolved.eventType.bufferBeforeMinutes * 60 * 1000,
    ),
    endsAt: new Date(
      item.endsAt.getTime() + resolved.eventType.bufferAfterMinutes * 60 * 1000,
    ),
  }))

  const maxPerDay = resolved.eventType.maxBookingsPerDay
  const eventTypeDayCounts = new Map<string, number>()

  if (typeof maxPerDay === "number" && maxPerDay > 0) {
    for (const item of existingBookings) {
      if (item.eventTypeId !== resolved.eventType.id) {
        continue
      }

      const key = toDateKey(getDatePartsInTimeZone(item.startsAt, timezone))
      eventTypeDayCounts.set(key, (eventTypeDayCounts.get(key) ?? 0) + 1)
    }
  }

  const windowsByDay = new Map<number, MinuteRange[]>()
  for (const window of resolved.windows) {
    const current = windowsByDay.get(window.dayOfWeek) ?? []
    current.push({
      startMinute: window.startMinute,
      endMinute: window.endMinute,
    })
    windowsByDay.set(window.dayOfWeek, current)
  }

  const overridesByDate = new Map<string, typeof bookingAvailabilityOverride.$inferSelect[]>()
  for (const override of resolved.overrides) {
    const key = override.date.toISOString().slice(0, 10)
    const current = overridesByDate.get(key) ?? []
    current.push(override)
    overridesByDate.set(key, current)
  }

  const dayBuckets: ClientSlotComputationResult["days"] = []

  for (let index = 0; index < normalizedDays; index += 1) {
    const dayParts = addDaysToDateParts(fromParts, index)
    const dayKey = toDateKey(dayParts)
    const dayOfWeek = new Date(
      Date.UTC(dayParts.year, dayParts.month - 1, dayParts.day),
    ).getUTCDay()

    if (
      typeof maxPerDay === "number" &&
      maxPerDay > 0 &&
      (eventTypeDayCounts.get(dayKey) ?? 0) >= maxPerDay
    ) {
      continue
    }

    const baseWindows = mergeMinuteRanges(windowsByDay.get(dayOfWeek) ?? [])
    const effectiveWindows = applyAvailabilityOverrides(
      baseWindows,
      overridesByDate.get(dayKey) ?? [],
    )

    if (effectiveWindows.length === 0) {
      continue
    }

    const slots: Array<{ startsAt: Date; endsAt: Date }> = []

    for (const window of effectiveWindows) {
      const latestStartMinute = window.endMinute - durationMinutes
      if (latestStartMinute < window.startMinute) {
        continue
      }

      for (
        let minute = window.startMinute;
        minute <= latestStartMinute;
        minute += SLOT_STEP_MINUTES
      ) {
        const startsAt = zonedDateTimeToUtc(dayParts, minute, timezone)
        const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000)

        if (startsAt < earliestStart || startsAt > latestStart) {
          continue
        }

        const overlapsExisting = blockedIntervals.some(
          (interval) => startsAt < interval.endsAt && endsAt > interval.startsAt,
        )
        if (overlapsExisting) {
          continue
        }

        slots.push({ startsAt, endsAt })
      }
    }

    if (slots.length === 0) {
      continue
    }

    dayBuckets.push({
      date: dayKey,
      label: formatDayLabel(dayParts, timezone),
      slots,
    })
  }

  return {
    timezone,
    selectedDurationMinutes: durationMinutes,
    days: dayBuckets,
  }
}

export async function listBookableEventTypesForClient(currentUser: SessionUser) {
  assertClientBookingAccess(currentUser)

  const adminLead = await getDefaultProposalLeadForClientBooking()
  const eventTypes = await db
    .select({
      id: bookingEventType.id,
      title: bookingEventType.title,
      description: bookingEventType.description,
      durationMinutes: bookingEventType.durationMinutes,
      allowMultipleDurations: bookingEventType.allowMultipleDurations,
      durationOptions: bookingEventType.durationOptions,
      availabilityScheduleId: bookingEventType.availabilityScheduleId,
    })
    .from(bookingEventType)
    .where(
      and(
        eq(bookingEventType.userId, adminLead.id),
        eq(bookingEventType.status, "active"),
        eq(bookingEventType.isPublic, true),
      ),
    )
    .orderBy(asc(bookingEventType.title))

  if (eventTypes.length === 0) {
    return {
      admin: {
        id: adminLead.id,
        name: adminLead.name,
        bookingPageTitle: adminLead.bookingPageTitle,
        bookingPageDescription: adminLead.bookingPageDescription,
      },
      eventTypes: [] as Array<{
        id: string
        title: string
        description: string | null
        durationMinutes: number
        availableDurations: number[]
        timezone: string
        locationLabel: string | null
        locationKind: string | null
      }>,
    }
  }

  const scheduleIds = Array.from(
    new Set(
      eventTypes
        .map((eventType) => eventType.availabilityScheduleId)
        .filter((value): value is string => Boolean(value)),
    ),
  )

  const [defaultSchedule, schedules, locations] = await Promise.all([
    db
      .select({
        id: bookingAvailabilitySchedule.id,
        timezone: bookingAvailabilitySchedule.timezone,
      })
      .from(bookingAvailabilitySchedule)
      .where(
        and(
          eq(bookingAvailabilitySchedule.userId, adminLead.id),
          eq(bookingAvailabilitySchedule.isDefault, true),
        ),
      )
      .orderBy(asc(bookingAvailabilitySchedule.createdAt))
      .limit(1),
    scheduleIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            id: bookingAvailabilitySchedule.id,
            timezone: bookingAvailabilitySchedule.timezone,
          })
          .from(bookingAvailabilitySchedule)
          .where(inArray(bookingAvailabilitySchedule.id, scheduleIds)),
    db
      .select({
        eventTypeId: bookingEventTypeLocation.eventTypeId,
        label: bookingEventTypeLocation.label,
        kind: bookingEventTypeLocation.kind,
      })
      .from(bookingEventTypeLocation)
      .where(
        and(
          inArray(
            bookingEventTypeLocation.eventTypeId,
            eventTypes.map((eventType) => eventType.id),
          ),
          eq(bookingEventTypeLocation.isActive, true),
        ),
      )
      .orderBy(
        asc(bookingEventTypeLocation.eventTypeId),
        desc(bookingEventTypeLocation.isDefault),
        asc(bookingEventTypeLocation.position),
      ),
  ])

  const timezoneByScheduleId = new Map(
    schedules.map((schedule) => [schedule.id, normalizeTimeZone(schedule.timezone)]),
  )
  const defaultTimezone = normalizeTimeZone(defaultSchedule[0]?.timezone)

  const locationByEventTypeId = new Map<string, { label: string; kind: string }>()
  for (const location of locations) {
    if (!locationByEventTypeId.has(location.eventTypeId)) {
      locationByEventTypeId.set(location.eventTypeId, {
        label: location.label,
        kind: location.kind,
      })
    }
  }

  return {
    admin: {
      id: adminLead.id,
      name: adminLead.name,
      bookingPageTitle: adminLead.bookingPageTitle,
      bookingPageDescription: adminLead.bookingPageDescription,
    },
    eventTypes: eventTypes.map((eventType) => {
      const fallbackDurations = [Math.max(5, Math.round(eventType.durationMinutes))]
      const availableDurations = Array.from(
        new Set(
          [
            ...fallbackDurations,
            ...(eventType.allowMultipleDurations
              ? (eventType.durationOptions ?? [])
              : []),
          ]
            .map((value) => Math.round(value))
            .filter((value) => Number.isFinite(value) && value >= 5 && value <= 8 * 60),
        ),
      ).sort((left, right) => left - right)

      const location = locationByEventTypeId.get(eventType.id)

      return {
        id: eventType.id,
        title: eventType.title,
        description: eventType.description,
        durationMinutes: Math.max(5, Math.round(eventType.durationMinutes)),
        availableDurations:
          availableDurations.length > 0 ? availableDurations : fallbackDurations,
        timezone:
          timezoneByScheduleId.get(eventType.availabilityScheduleId ?? "") ??
          defaultTimezone,
        locationLabel: location?.label ?? null,
        locationKind: location?.kind ?? null,
      }
    }),
  }
}

export async function listAvailableBookingSlotsForClient(
  currentUser: SessionUser,
  input: {
    eventTypeId: string
    durationMinutes?: number
    fromDate?: string
    days?: number
  },
) {
  assertClientBookingAccess(currentUser)

  const resolved = await resolveBookableEventTypeForClient(
    currentUser,
    input.eventTypeId,
  )
  const slotData = await computeClientSlotsForResolvedEvent(resolved, {
    fromDate: input.fromDate,
    days: input.days ?? 14,
    durationMinutes: resolveEventTypeDurationMinutes(
      resolved.eventType,
      input.durationMinutes,
    ),
  })

  return {
    admin: resolved.adminLead,
    eventType: {
      id: resolved.eventType.id,
      title: resolved.eventType.title,
      description: resolved.eventType.description,
      durationMinutes: resolved.eventType.durationMinutes,
      allowMultipleDurations: resolved.eventType.allowMultipleDurations,
      durationOptions: resolved.eventType.durationOptions ?? null,
    },
    timezone: slotData.timezone,
    selectedDurationMinutes: slotData.selectedDurationMinutes,
    days: slotData.days,
  }
}

export async function createBookingForClient(
  currentUser: SessionUser,
  input: {
    eventTypeId: string
    startsAt: Date
    durationMinutes?: number
    attendeeTimezone?: string | null
  },
) {
  assertClientBookingAccess(currentUser)

  const resolved = await resolveBookableEventTypeForClient(
    currentUser,
    input.eventTypeId,
  )
  const durationMinutes = resolveEventTypeDurationMinutes(
    resolved.eventType,
    input.durationMinutes,
  )
  const requestedStart = new Date(input.startsAt)

  if (Number.isNaN(requestedStart.getTime())) {
    throw new Error("Invalid booking start time")
  }

  const requestDayKey = toDateKey(
    getDatePartsInTimeZone(requestedStart, normalizeTimeZone(resolved.schedule.timezone)),
  )
  const slotData = await computeClientSlotsForResolvedEvent(resolved, {
    fromDate: requestDayKey,
    days: 1,
    durationMinutes,
  })
  const matchedSlot = slotData.days
    .flatMap((day) => day.slots)
    .find((slot) => slot.startsAt.getTime() === requestedStart.getTime())

  if (!matchedSlot) {
    throw new Error("Selected slot is no longer available")
  }

  const [attendee] = await db
    .select({
      name: user.name,
      email: user.email,
      phone: user.phone,
      timezone: user.timezone,
    })
    .from(user)
    .where(eq(user.id, currentUser.id))
    .limit(1)

  const [created] = await db
    .insert(booking)
    .values({
      ownerUserId: resolved.adminLead.id,
      eventTypeId: resolved.eventType.id,
      attendeeUserId: currentUser.id,
      createdByUserId: currentUser.id,
      appConnectionId: resolved.location?.appConnectionId ?? null,
      source: "authenticated",
      status: "confirmed",
      title: resolved.eventType.title,
      attendeeName: attendee?.name ?? currentUser.name,
      attendeeEmail: attendee?.email ?? currentUser.email,
      attendeePhone: attendee?.phone ?? null,
      attendeeTimezone:
        input.attendeeTimezone?.trim() ||
        attendee?.timezone ||
        normalizeTimeZone(resolved.schedule.timezone),
      locationKind: resolved.location?.kind ?? null,
      locationLabel: resolved.location?.label ?? null,
      locationValue: resolved.location?.value ?? null,
      meetingUrl:
        resolved.location?.kind === "custom_link" ||
        resolved.location?.kind === "google_meet" ||
        resolved.location?.kind === "zoom"
          ? resolved.location?.value ?? null
          : null,
      startsAt: matchedSlot.startsAt,
      endsAt: matchedSlot.endsAt,
      confirmedAt: new Date(),
      manageToken: crypto.randomUUID(),
    })
    .$returningId()

  const bookingId = created?.id
  if (!bookingId) {
    throw new Error("Unable to create booking")
  }

  return {
    id: bookingId,
    eventTypeId: resolved.eventType.id,
    eventTypeTitle: resolved.eventType.title,
    startsAt: matchedSlot.startsAt,
    endsAt: matchedSlot.endsAt,
    timezone: normalizeTimeZone(resolved.schedule.timezone),
    ownerUserId: resolved.adminLead.id,
    ownerName: resolved.adminLead.name,
    locationLabel: resolved.location?.label ?? null,
    locationKind: resolved.location?.kind ?? null,
    meetingUrl:
      resolved.location?.kind === "custom_link" ||
      resolved.location?.kind === "google_meet" ||
      resolved.location?.kind === "zoom"
        ? resolved.location?.value ?? null
        : null,
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
