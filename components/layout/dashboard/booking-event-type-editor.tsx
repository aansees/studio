"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import {
  BOOKING_QUESTION_TYPES,
} from "@/lib/constants/booking"
import {
  bookingAppProviderOptions,
  bookingEventTypeStatusOptions,
  bookingLocationKindOptions,
  bookingQuestionVisibilityOptions,
  getBookingOptionLabel,
} from "@/lib/constants/booking-display"
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
  const [form, setForm] = useState({
    availabilityScheduleId: initialEventType.availabilityScheduleId ?? "",
    title: initialEventType.title,
    slug: initialEventType.slug,
    description: initialEventType.description ?? "",
    status: initialEventType.status,
    durationMinutes: initialEventType.durationMinutes,
    allowMultipleDurations: initialEventType.allowMultipleDurations,
    durationOptions:
      initialEventType.durationOptions?.join(", ") ?? "",
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
  })
  const [locations, setLocations] = useState(initialEventType.locations)
  const [calendars, setCalendars] = useState(initialEventType.calendars)
  const [questions, setQuestions] = useState(initialEventType.questions)
  const [pending, setPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

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

  function updateLocation(
    index: number,
    updates: Partial<EventTypeLocation>,
  ) {
    setLocations((current) =>
      current.map((location, currentIndex) =>
        currentIndex === index ? { ...location, ...updates } : location,
      ),
    )
  }

  function addLocation() {
    setLocations((current) => [
      ...current,
      {
        kind: "custom_link",
        label: "New location",
        value: null,
        appConnectionId: null,
        isDefault: current.length === 0,
        isActive: true,
        position: current.length,
      },
    ])
  }

  function removeLocation(index: number) {
    setLocations((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function updateCalendar(
    index: number,
    updates: Partial<EventTypeCalendar>,
  ) {
    setCalendars((current) =>
      current.map((calendar, currentIndex) =>
        currentIndex === index ? { ...calendar, ...updates } : calendar,
      ),
    )
  }

  function addCalendar() {
    const firstConnection = calendarProviderOptions[0]
    if (!firstConnection) {
      toast.error("Add a calendar connection in settings first")
      return
    }

    setCalendars((current) => [
      ...current,
      {
        appConnectionId: firstConnection.value,
        purpose: current.some((item) => item.purpose === "destination")
          ? "conflict"
          : "destination",
        isPrimary: current.length === 0,
      },
    ])
  }

  function removeCalendar(index: number) {
    setCalendars((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function updateQuestion(
    index: number,
    updates: Partial<EventTypeQuestion>,
  ) {
    setQuestions((current) =>
      current.map((question, currentIndex) =>
        currentIndex === index ? { ...question, ...updates } : question,
      ),
    )
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        fieldKey: `custom_${current.length + 1}`,
        label: "New question",
        description: null,
        inputType: "short_text",
        visibility: "optional",
        placeholder: null,
        options: null,
        isSystem: false,
        position: current.length,
      },
    ])
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  async function saveEventType() {
    setPending(true)
    try {
      const response = await fetch(
        `/api/bookings/event-types/${initialEventType.id}`,
        {
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
              Number(form.maxBookingsPerDay) > 0
                ? Number(form.maxBookingsPerDay)
                : null,
            requireEmailVerification: form.requireEmailVerification,
            allowGuestBookings: form.allowGuestBookings,
            requireLogin: form.requireLogin,
            allowCancellation: form.allowCancellation,
            allowReschedule: form.allowReschedule,
            isPublic: form.isPublic,
            confirmationChannels: ["email"],
            locations: locations.map((location, index) => ({
              ...location,
              position: index,
            })),
            calendars: calendars,
            questions: questions.map((question, index) => ({
              ...question,
              position: index,
              options:
                question.inputType === "select"
                  ? question.options
                  : null,
            })),
          }),
        },
      )

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to save event type")
      }

      toast.success("Event type updated")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save event type",
      )
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
      const response = await fetch(
        `/api/bookings/event-types/${initialEventType.id}`,
        { method: "DELETE" },
      )
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete event type")
      }

      router.push("/bookings/event-types")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete event type",
      )
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <div className="space-y-4">
      <Frame>
        <FramePanel className="space-y-4">
          <div>
            <FrameTitle>Basics</FrameTitle>
            <FrameDescription>
              Configure the public event settings for this booking type.
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
              <Input
                id="event-type-slug"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="event-type-status">Status</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status: value as typeof form.status,
                  }))
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
                placeholder="Short description for bookers"
              />
            </Field>
          </FieldGroup>
        </FramePanel>
      </Frame>

      <Frame>
        <FramePanel className="space-y-4">
          <div>
            <FrameTitle>Availability And Limits</FrameTitle>
            <FrameDescription>
              Connect the event type to a schedule and control how it can be booked.
            </FrameDescription>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel>Availability schedule</FieldLabel>
              <Select
                value={form.availabilityScheduleId}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    availabilityScheduleId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a schedule" />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name} • {option.timezone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Duration (minutes)</FieldLabel>
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
              <FieldLabel>Booking window (days)</FieldLabel>
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
              <FieldLabel>Minimum notice (minutes)</FieldLabel>
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
              <FieldLabel>Buffer before</FieldLabel>
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
              <FieldLabel>Buffer after</FieldLabel>
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
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                key: "allowMultipleDurations",
                label: "Allow multiple durations",
              },
              { key: "allowGuestBookings", label: "Allow guest bookings" },
              { key: "requireLogin", label: "Require login to book" },
              { key: "allowCancellation", label: "Allow cancellation" },
              { key: "allowReschedule", label: "Allow reschedule" },
              { key: "isPublic", label: "Public event type" },
              {
                key: "requireEmailVerification",
                label: "Require email verification",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3"
              >
                <span className="text-sm font-medium">{item.label}</span>
                <Switch
                  checked={Boolean(form[item.key as keyof typeof form])}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      [item.key]: checked,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          {form.allowMultipleDurations ? (
            <Field>
              <FieldLabel>Duration options (comma separated)</FieldLabel>
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <FrameTitle>Locations</FrameTitle>
              <FrameDescription>
                Add the meeting locations this event type can offer to bookers.
              </FrameDescription>
            </div>
            <Button type="button" variant="outline" onClick={addLocation}>
              <PlusIcon className="size-4" />
              Add location
            </Button>
          </div>
          <div className="space-y-3">
            {locations.map((location, index) => (
              <div
                key={`${location.label}-${index}`}
                className="grid gap-3 rounded-xl border border-border/60 bg-background/60 p-4 md:grid-cols-[180px_1fr_1fr_120px_40px]"
              >
                <Select
                  value={location.kind}
                  onValueChange={(value) =>
                    updateLocation(index, {
                      kind: value as EventTypeLocation["kind"],
                    })
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
                  placeholder="Label"
                />
                <Input
                  value={location.value ?? ""}
                  onChange={(event) =>
                    updateLocation(index, { value: event.target.value })
                  }
                  placeholder="Link or address"
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
                    <SelectValue placeholder="App" />
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeLocation(index)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </FramePanel>
      </Frame>

      <Frame>
        <FramePanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <FrameTitle>Calendars</FrameTitle>
              <FrameDescription>
                Set where bookings should be written and which calendars block
                availability.
              </FrameDescription>
            </div>
            <Button type="button" variant="outline" onClick={addCalendar}>
              <PlusIcon className="size-4" />
              Add calendar
            </Button>
          </div>
          <div className="space-y-3">
            {calendars.map((calendar, index) => (
              <div
                key={`${calendar.appConnectionId}-${calendar.purpose}-${index}`}
                className="grid gap-3 rounded-xl border border-border/60 bg-background/60 p-4 md:grid-cols-[1fr_180px_120px_40px]"
              >
                <Select
                  value={calendar.appConnectionId}
                  onValueChange={(value) =>
                    updateCalendar(index, { appConnectionId: value })
                  }
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
                  onValueChange={(value) =>
                    updateCalendar(index, {
                      purpose: value as EventTypeCalendar["purpose"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="destination">Destination</SelectItem>
                    <SelectItem value="conflict">Conflict check</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between rounded-xl border px-3">
                  <span className="text-sm">Primary</span>
                  <Switch
                    checked={calendar.isPrimary}
                    onCheckedChange={(checked) =>
                      updateCalendar(index, { isPrimary: checked })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeCalendar(index)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </FramePanel>
      </Frame>

      <Frame>
        <FramePanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <FrameTitle>Booking Questions</FrameTitle>
              <FrameDescription>
                Customize the fields shown before a booking is created.
              </FrameDescription>
            </div>
            <Button type="button" variant="outline" onClick={addQuestion}>
              <PlusIcon className="size-4" />
              Add question
            </Button>
          </div>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div
                key={`${question.fieldKey}-${index}`}
                className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px_160px_40px]">
                  <Input
                    value={question.label}
                    onChange={(event) =>
                      updateQuestion(index, { label: event.target.value })
                    }
                    placeholder="Label"
                  />
                  <Input
                    value={question.fieldKey}
                    disabled={question.isSystem}
                    onChange={(event) =>
                      updateQuestion(index, { fieldKey: event.target.value })
                    }
                    placeholder="field_key"
                  />
                  <Select
                    value={question.inputType}
                    onValueChange={(value) =>
                      updateQuestion(index, {
                        inputType: value as EventTypeQuestion["inputType"],
                      })
                    }
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
                    onValueChange={(value) =>
                      updateQuestion(index, {
                        visibility: value as EventTypeQuestion["visibility"],
                      })
                    }
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
                    type="button"
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
                    updateQuestion(index, {
                      placeholder: event.target.value,
                    })
                  }
                  placeholder="Placeholder"
                />
              </div>
            ))}
          </div>
        </FramePanel>
      </Frame>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="destructive"
          onClick={() => void deleteEventType()}
          disabled={deletePending}
        >
          {deletePending ? "Deleting..." : "Delete event type"}
        </Button>
        <Button onClick={() => void saveEventType()} disabled={pending}>
          {pending ? "Saving..." : "Save event type"}
        </Button>
      </div>
    </div>
  )
}
