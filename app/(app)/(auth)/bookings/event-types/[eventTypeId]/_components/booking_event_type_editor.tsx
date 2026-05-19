"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  ExternalLinkIcon,
  LinkIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { BOOKING_QUESTION_TYPES } from "@/lib/constants/booking"
import {
  bookingAppProviderOptions,
  bookingEventTypeStatusOptions,
  bookingLocationKindOptions,
  bookingQuestionVisibilityOptions,
  getBookingOptionLabel,
} from "@/lib/constants/booking-display"
import { formatBookingMinuteRange } from "@/lib/bookings/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Frame, FrameDescription, FramePanel, FrameTitle } from "@/components/ui/frame"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type AvailabilityOption = {
  id: string
  name: string
  timezone: string
  isDefault: boolean
  isActive: boolean
  windows: Array<{
    id: string
    dayOfWeek: number
    startMinute: number
    endMinute: number
    position: number
  }>
}

type AppConnectionOption = {
  id: string
  provider: string
  accountLabel: string
  accountEmail: string | null
  supportsCalendar: boolean
  supportsConferencing: boolean
}

type EventTypeLocation = {
  kind: string
  label: string
  value: string | null
  appConnectionId: string | null
  isDefault: boolean
  isActive: boolean
  position: number
}

type EventTypeCalendar = {
  appConnectionId: string
  purpose: string
  isPrimary: boolean
}

type EventTypeQuestion = {
  fieldKey: string
  label: string
  description: string | null
  inputType: string
  visibility: string
  placeholder: string | null
  options: string[] | null
  isSystem: boolean
  position: number
}

type EventTypeRecord = {
  id: string
  availabilityScheduleId: string | null
  title: string
  slug: string
  description: string | null
  status: string
  durationMinutes: number
  allowMultipleDurations: boolean
  durationOptions: number[] | null
  color: string | null
  bookingNoticeMinutes: number
  bookingWindowDays: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  maxBookingsPerDay: number | null
  requireEmailVerification: boolean
  allowGuestBookings: boolean
  requireLogin: boolean
  allowCancellation: boolean
  allowReschedule: boolean
  isPublic: boolean
  confirmationChannels: string[] | null
  locations: EventTypeLocation[]
  calendars: EventTypeCalendar[]
  questions: EventTypeQuestion[]
}

type SectionId =
  | "basics"
  | "availability"
  | "limits"
  | "advanced"
  | "recurring"
  | "apps"
  | "workflows"
  | "webhooks"

function labelize(value: string) {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function BookingEventTypeEditor({
  initialEventType,
  availabilityOptions,
  appConnections,
}: {
  initialEventType: EventTypeRecord
  availabilityOptions: AvailabilityOption[]
  appConnections: AppConnectionOption[]
}) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SectionId>("basics")
  const [form, setForm] = useState({
    availabilityScheduleId: initialEventType.availabilityScheduleId ?? "",
    title: initialEventType.title,
    slug: initialEventType.slug,
    description: initialEventType.description ?? "",
    status: initialEventType.status,
    durationMinutes: initialEventType.durationMinutes,
    allowMultipleDurations: initialEventType.allowMultipleDurations,
    durationOptions: initialEventType.durationOptions?.join(", ") ?? "",
    color: initialEventType.color ?? "",
    bookingNoticeMinutes: initialEventType.bookingNoticeMinutes,
    bookingWindowDays: initialEventType.bookingWindowDays,
    bufferBeforeMinutes: initialEventType.bufferBeforeMinutes,
    bufferAfterMinutes: initialEventType.bufferAfterMinutes,
    maxBookingsPerDay: initialEventType.maxBookingsPerDay ?? 0,
    requireEmailVerification: initialEventType.requireEmailVerification,
    allowGuestBookings: initialEventType.allowGuestBookings,
    requireLogin: initialEventType.requireLogin,
    allowCancellation: initialEventType.allowCancellation,
    allowReschedule: initialEventType.allowReschedule,
    isPublic: initialEventType.isPublic,
    confirmationChannels: initialEventType.confirmationChannels ?? ["email"],
  })
  const [locations, setLocations] = useState(initialEventType.locations)
  const [calendars, setCalendars] = useState(initialEventType.calendars)
  const [questions, setQuestions] = useState(initialEventType.questions)
  const [pending, setPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  const selectedAvailability = useMemo(
    () =>
      availabilityOptions.find((option) => option.id === form.availabilityScheduleId) ??
      availabilityOptions.find((option) => option.isDefault) ??
      availabilityOptions[0] ??
      null,
    [availabilityOptions, form.availabilityScheduleId],
  )

  const calendarProviderOptions = useMemo(
    () =>
      appConnections
        .filter((connection) => connection.supportsCalendar)
        .map((connection) => ({
          value: connection.id,
          label: `${getBookingOptionLabel(
            bookingAppProviderOptions,
            connection.provider,
            connection.provider,
          )} • ${connection.accountLabel}`,
        })),
    [appConnections],
  )

  const conferencingOptions = useMemo(
    () =>
      appConnections
        .filter((connection) => connection.supportsConferencing)
        .map((connection) => ({
          value: connection.id,
          label: `${getBookingOptionLabel(
            bookingAppProviderOptions,
            connection.provider,
            connection.provider,
          )} • ${connection.accountLabel}`,
        })),
    [appConnections],
  )

  function updateLocation(index: number, updates: Partial<EventTypeLocation>) {
    setLocations((current) =>
      current.map((location, currentIndex) => {
        if (currentIndex !== index) {
          return updates.isDefault ? { ...location, isDefault: false } : location
        }

        return { ...location, ...updates }
      }),
    )
  }

  function addLocation() {
    setLocations((current) =>
      current.concat({
        kind: "custom_link",
        label: "New location",
        value: null,
        appConnectionId: null,
        isDefault: current.length === 0,
        isActive: true,
        position: current.length,
      }),
    )
  }

  function removeLocation(index: number) {
    setLocations((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function updateCalendar(index: number, updates: Partial<EventTypeCalendar>) {
    setCalendars((current) =>
      current.map((calendar, currentIndex) => {
        if (currentIndex !== index) {
          return updates.isPrimary ? { ...calendar, isPrimary: false } : calendar
        }

        return { ...calendar, ...updates }
      }),
    )
  }

  function addCalendar() {
    const firstConnection = calendarProviderOptions[0]
    if (!firstConnection) {
      toast.error("Add a calendar connection in settings first")
      return
    }

    setCalendars((current) =>
      current.concat({
        appConnectionId: firstConnection.value,
        purpose: current.some((item) => item.purpose === "destination")
          ? "conflict"
          : "destination",
        isPrimary: current.length === 0,
      }),
    )
  }

  function removeCalendar(index: number) {
    setCalendars((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function updateQuestion(index: number, updates: Partial<EventTypeQuestion>) {
    setQuestions((current) =>
      current.map((question, currentIndex) =>
        currentIndex === index ? { ...question, ...updates } : question,
      ),
    )
  }

  function addQuestion() {
    setQuestions((current) =>
      current.concat({
        fieldKey: `custom_${current.length + 1}`,
        label: "New question",
        description: null,
        inputType: "short_text",
        visibility: "optional",
        placeholder: null,
        options: null,
        isSystem: false,
        position: current.length,
      }),
    )
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  async function saveEventType() {
    setPending(true)
    try {
      const response = await fetch(`/api/bookings/event-types/${initialEventType.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          availabilityScheduleId: form.availabilityScheduleId || null,
          title: form.title,
          slug: form.slug,
          description: form.description || null,
          status: form.status,
          durationMinutes: Number(form.durationMinutes),
          allowMultipleDurations: form.allowMultipleDurations,
          durationOptions: form.allowMultipleDurations
            ? form.durationOptions
                .split(",")
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isFinite(value))
            : null,
          color: form.color || null,
          bookingNoticeMinutes: Number(form.bookingNoticeMinutes),
          bookingWindowDays: Number(form.bookingWindowDays),
          bufferBeforeMinutes: Number(form.bufferBeforeMinutes),
          bufferAfterMinutes: Number(form.bufferAfterMinutes),
          maxBookingsPerDay:
            Number(form.maxBookingsPerDay) > 0 ? Number(form.maxBookingsPerDay) : null,
          requireEmailVerification: form.requireEmailVerification,
          allowGuestBookings: form.allowGuestBookings,
          requireLogin: form.requireLogin,
          allowCancellation: form.allowCancellation,
          allowReschedule: form.allowReschedule,
          isPublic: form.isPublic,
          confirmationChannels: form.confirmationChannels,
          locations: locations.map((location, index) => ({
            ...location,
            position: index,
          })),
          calendars,
          questions: questions.map((question, index) => ({
            ...question,
            position: index,
            options:
              question.inputType === "select"
                ? question.options?.filter((option) => option.trim().length > 0) ?? null
                : null,
          })),
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to save event type")
      }

      toast.success("Event type updated")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save event type")
    } finally {
      setPending(false)
    }
  }

  async function deleteEventType() {
    if (!window.confirm("Delete this event type?")) {
      return
    }

    setDeletePending(true)
    try {
      const response = await fetch(`/api/bookings/event-types/${initialEventType.id}`, {
        method: "DELETE",
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete event type")
      }

      router.push("/bookings/event-types")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete event type")
    } finally {
      setDeletePending(false)
    }
  }

  async function copyEventSlug() {
    try {
      await navigator.clipboard.writeText(form.slug)
      toast.success("Event slug copied")
    } catch {
      toast.error("Unable to copy event slug")
    }
  }

  function toggleConfirmationChannel(channel: "email" | "phone") {
    setForm((current) => {
      const exists = current.confirmationChannels.includes(channel)

      return {
        ...current,
        confirmationChannels: exists
          ? current.confirmationChannels.filter((item) => item !== channel)
          : current.confirmationChannels.concat(channel),
      }
    })
  }

  const sectionItems = [
    {
      id: "basics",
      title: "Basics",
      subtitle: `${form.durationMinutes} mins`,
    },
    {
      id: "availability",
      title: "Availability",
      subtitle: selectedAvailability?.name ?? "Working hours",
    },
    {
      id: "limits",
      title: "Limits",
      subtitle: "How often you can be booked",
    },
    {
      id: "advanced",
      title: "Advanced",
      subtitle: "Calendar settings & more...",
    },
    {
      id: "recurring",
      title: "Recurring",
      subtitle: "Set up a repeating schedule",
    },
    {
      id: "apps",
      title: "Apps",
      subtitle: `${appConnections.length} apps, ${
        appConnections.filter(
          (connection) => connection.supportsCalendar || connection.supportsConferencing,
        ).length
      } active`,
    },
    {
      id: "workflows",
      title: "Workflows",
      subtitle: "0 active",
    },
    {
      id: "webhooks",
      title: "Webhooks",
      subtitle: "0 active",
    },
  ] as const satisfies Array<{
    id: SectionId
    title: string
    subtitle: string
  }>

  const schedulePreview = selectedAvailability
    ? Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        label: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek],
        windows: selectedAvailability.windows
          .filter((window) => window.dayOfWeek === dayOfWeek)
          .sort((left, right) => left.position - right.position),
      }))
    : []

  const renderedSection =
    activeSection === "basics" ? (
      <div className="space-y-4">
        <Frame>
          <FramePanel className="space-y-4">
            <div className="space-y-1">
              <FrameTitle>Basics</FrameTitle>
              <FrameDescription>
                Configure the primary booking details shown to bookers.
              </FrameDescription>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="event-type-title">Title</FieldLabel>
                <Input
                  id="event-type-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="event-type-slug">Slug</FieldLabel>
                <div className="relative">
                  <LinkIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="event-type-slug"
                    className="pl-9"
                    value={form.slug}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, slug: event.target.value }))
                    }
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="event-type-status">Status</FieldLabel>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, status: value }))
                  }
                >
                  <SelectTrigger id="event-type-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookingEventTypeStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="event-type-description">Description</FieldLabel>
                <Textarea
                  id="event-type-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Explain what this meeting is for."
                />
              </Field>
            </FieldGroup>
          </FramePanel>
        </Frame>

        <Frame>
          <FramePanel className="space-y-4">
            <div className="space-y-1">
              <FrameTitle>Duration</FrameTitle>
              <FrameDescription>
                Configure the length and optional duration choices for this event.
              </FrameDescription>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel>Duration</FieldLabel>
                <Input
                  type="number"
                  min={5}
                  max={480}
                  value={form.durationMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationMinutes: Number(event.target.value),
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Accent color</FieldLabel>
                <Input
                  value={form.color}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, color: event.target.value }))
                  }
                  placeholder="#D4AF37"
                />
              </Field>
            </FieldGroup>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Allow multiple durations</p>
                <p className="text-xs text-muted-foreground">
                  Offer more than one duration choice on the booking page.
                </p>
              </div>
              <Switch
                checked={form.allowMultipleDurations}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    allowMultipleDurations: checked,
                  }))
                }
              />
            </div>
            {form.allowMultipleDurations ? (
              <Field>
                <FieldLabel>Duration options</FieldLabel>
                <Input
                  value={form.durationOptions}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationOptions: event.target.value,
                    }))
                  }
                  placeholder="15, 30, 45, 60"
                />
              </Field>
            ) : null}
          </FramePanel>
        </Frame>

        <Frame>
          <FramePanel className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <FrameTitle>Location</FrameTitle>
                <FrameDescription>
                  Choose where the meeting happens and which option should be the default.
                </FrameDescription>
              </div>
              <Button variant="outline" onClick={addLocation}>
                <PlusIcon className="size-4" />
                Add a location
              </Button>
            </div>
            <div className="space-y-3">
              {locations.map((location, index) => (
                <div
                  key={`${location.label}-${index}`}
                  className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_220px_40px]">
                    <Select
                      value={location.kind}
                      onValueChange={(value) =>
                        updateLocation(index, { kind: value as EventTypeLocation["kind"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kind" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookingLocationKindOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={location.label}
                      onChange={(event) =>
                        updateLocation(index, { label: event.target.value })
                      }
                      placeholder="Location label"
                    />
                    <Select
                      value={location.appConnectionId ?? "__none__"}
                      onValueChange={(value) =>
                        updateLocation(index, {
                          appConnectionId: value === "__none__" ? null : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Connected app" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No app</SelectItem>
                        {conferencingOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeLocation(index)}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                  <Input
                    value={location.value ?? ""}
                    onChange={(event) =>
                      updateLocation(index, { value: event.target.value })
                    }
                    placeholder="Meeting link or address"
                  />
                  <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Use as default location</p>
                      <p className="text-xs text-muted-foreground">
                        Bookers see this selected first.
                      </p>
                    </div>
                    <Switch
                      checked={location.isDefault}
                      onCheckedChange={(checked) =>
                        updateLocation(index, { isDefault: checked })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </FramePanel>
        </Frame>
      </div>
    ) : activeSection === "availability" ? (
      <Frame>
        <FramePanel className="space-y-4">
          <div className="space-y-1">
            <FrameTitle>Availability</FrameTitle>
            <FrameDescription>
              Attach this event type to one of your saved availability schedules.
            </FrameDescription>
          </div>
          <Field>
            <FieldLabel>Availability schedule</FieldLabel>
            <Select
              value={form.availabilityScheduleId}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, availabilityScheduleId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a schedule" />
              </SelectTrigger>
              <SelectContent>
                {availabilityOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                    {option.isDefault ? " (Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {selectedAvailability ? (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-background/60">
              <div className="border-b border-border/60 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{selectedAvailability.name}</span>
                  {selectedAvailability.isDefault ? (
                    <Badge variant="secondary">Default</Badge>
                  ) : null}
                </div>
              </div>
              <div className="space-y-4 px-4 py-4">
                {schedulePreview.map((day) => (
                  <div key={day.dayOfWeek} className="grid grid-cols-[140px_minmax(0,1fr)] gap-4 text-sm">
                    <span className="font-medium">{day.label}</span>
                    <div className="text-muted-foreground">
                      {day.windows.length === 0
                        ? "Unavailable"
                        : day.windows
                            .map((window) =>
                              formatBookingMinuteRange(window.startMinute, window.endMinute),
                            )
                            .join(", ")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-sm text-muted-foreground">
                <span>{selectedAvailability.timezone}</span>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/bookings/availability?schedule=${selectedAvailability.id}`}>
                    Edit availability
                    <ExternalLinkIcon className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </FramePanel>
      </Frame>
    ) : activeSection === "limits" ? (
      <Frame>
        <FramePanel className="space-y-4">
          <div className="space-y-1">
            <FrameTitle>Limits</FrameTitle>
            <FrameDescription>
              Control how often this event type can be booked.
            </FrameDescription>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel>Before event</FieldLabel>
              <Input
                type="number"
                min={0}
                value={form.bufferBeforeMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bufferBeforeMinutes: Number(event.target.value),
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>After event</FieldLabel>
              <Input
                type="number"
                min={0}
                value={form.bufferAfterMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bufferAfterMinutes: Number(event.target.value),
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Minimum notice</FieldLabel>
              <Input
                type="number"
                min={0}
                value={form.bookingNoticeMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bookingNoticeMinutes: Number(event.target.value),
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Limit future bookings</FieldLabel>
              <Input
                type="number"
                min={1}
                max={365}
                value={form.bookingWindowDays}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bookingWindowDays: Number(event.target.value),
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Max bookings per day</FieldLabel>
              <Input
                type="number"
                min={0}
                value={form.maxBookingsPerDay}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxBookingsPerDay: Number(event.target.value),
                  }))
                }
              />
            </Field>
          </FieldGroup>
        </FramePanel>
      </Frame>
    ) : activeSection === "advanced" ? (
      <div className="space-y-4">
        <Frame>
          <FramePanel className="space-y-4">
            <div className="space-y-1">
              <FrameTitle>Booking questions</FrameTitle>
              <FrameDescription>
                Customize what bookers must provide before they can confirm.
              </FrameDescription>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant={form.confirmationChannels.includes("email") ? "secondary" : "outline"}
                size="sm"
                onClick={() => toggleConfirmationChannel("email")}
              >
                <MailIcon className="size-4" />
                Email
              </Button>
              <Button
                variant={form.confirmationChannels.includes("phone") ? "secondary" : "outline"}
                size="sm"
                onClick={() => toggleConfirmationChannel("phone")}
              >
                <PhoneIcon className="size-4" />
                Phone
              </Button>
            </div>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={`${question.fieldKey}-${index}`}
                  className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_40px]">
                    <Input
                      value={question.label}
                      onChange={(event) =>
                        updateQuestion(index, { label: event.target.value })
                      }
                      placeholder="Label"
                    />
                    <Select
                      value={question.inputType}
                      onValueChange={(value) => updateQuestion(index, { inputType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Input type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BOOKING_QUESTION_TYPES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {labelize(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={question.visibility}
                      onValueChange={(value) => updateQuestion(index, { visibility: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookingQuestionVisibilityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={question.isSystem}
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                  <Input
                    value={question.placeholder ?? ""}
                    onChange={(event) =>
                      updateQuestion(index, { placeholder: event.target.value })
                    }
                    placeholder="Placeholder"
                  />
                  {question.inputType === "select" ? (
                    <Input
                      value={question.options?.join(", ") ?? ""}
                      onChange={(event) =>
                        updateQuestion(index, {
                          options: event.target.value
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Option 1, Option 2"
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={addQuestion}>
              <PlusIcon className="size-4" />
              Add a question
            </Button>
          </FramePanel>
        </Frame>

        <Frame>
          <FramePanel className="grid gap-3">
            {[
              ["allowGuestBookings", "Allow guest bookings"],
              ["requireLogin", "Require login"],
              ["requireEmailVerification", "Require email verification"],
              ["allowCancellation", "Allow cancellation"],
              ["allowReschedule", "Allow reschedule"],
              ["isPublic", "Public event type"],
            ].map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3"
              >
                <span className="text-sm font-medium">{label}</span>
                <Switch
                  checked={Boolean(form[key as keyof typeof form])}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, [key]: checked }))
                  }
                />
              </div>
            ))}
          </FramePanel>
        </Frame>
      </div>
    ) : activeSection === "apps" ? (
      <Frame>
        <FramePanel className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <FrameTitle>Calendars</FrameTitle>
              <FrameDescription>
                Select where bookings are created and which calendars block conflicts.
              </FrameDescription>
            </div>
            <Button variant="outline" onClick={addCalendar}>
              <PlusIcon className="size-4" />
              Add calendar
            </Button>
          </div>
          <div className="space-y-3">
            {calendars.map((calendar, index) => (
              <div
                key={`${calendar.appConnectionId}-${calendar.purpose}-${index}`}
                className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_140px_40px]">
                  <Select
                    value={calendar.appConnectionId}
                    onValueChange={(value) => updateCalendar(index, { appConnectionId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Calendar connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendarProviderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={calendar.purpose}
                    onValueChange={(value) => updateCalendar(index, { purpose: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="destination">Destination</SelectItem>
                      <SelectItem value="conflict">Conflict check</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between rounded-xl border border-border/60 px-3">
                    <span className="text-sm">Primary</span>
                    <Switch
                      checked={calendar.isPrimary}
                      onCheckedChange={(checked) =>
                        updateCalendar(index, { isPrimary: checked })
                      }
                    />
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeCalendar(index)}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </FramePanel>
      </Frame>
    ) : (
      <Frame>
        <FramePanel className="space-y-2">
          <FrameTitle>{sectionItems.find((section) => section.id === activeSection)?.title}</FrameTitle>
          <FrameDescription>
            This section is reserved so the admin flow matches Cal.com, but the
            underlying automation for it is still pending.
          </FrameDescription>
        </FramePanel>
      </Frame>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="px-0">
            <Link href="/bookings/event-types">
              <ArrowLeftIcon className="size-4" />
              Back
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="font-cormorant text-3xl leading-none">{form.title}</h1>
            <p className="text-sm text-muted-foreground">/{form.slug}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm">
            <Switch
              checked={form.status === "active"}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  status: checked ? "active" : "draft",
                }))
              }
            />
            <span className="text-muted-foreground">Active</span>
          </div>
          <Button variant="outline" size="icon-sm" onClick={() => void copyEventSlug()}>
            <CopyIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => void deleteEventType()} disabled={deletePending}>
            <Trash2Icon className="size-4" />
          </Button>
          <Button onClick={() => void saveEventType()} disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-2 xl:sticky xl:top-6 xl:self-start">
          {sectionItems.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                section.id === activeSection
                  ? "border-border/80 bg-muted/80"
                  : "border-transparent bg-transparent hover:bg-muted/40"
              }`}
            >
              <div className="space-y-1">
                <div className="font-medium">{section.title}</div>
                <div className="text-sm text-muted-foreground">{section.subtitle}</div>
              </div>
              {section.id === activeSection ? (
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              ) : null}
            </button>
          ))}
        </div>
        <div>{renderedSection}</div>
      </div>
    </div>
  )
}
