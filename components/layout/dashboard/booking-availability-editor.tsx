"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronLeftIcon,
  Clock3Icon,
  CopyIcon,
  EllipsisIcon,
  GlobeIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import {
  bookingDayLabels,
  formatBookingMinuteRange,
  minutesToTimeInput,
  summarizeBookingAvailabilityWindows,
  timeInputToMinutes,
} from "@/lib/bookings/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type AvailabilityWindow = {
  id: string
  dayOfWeek: number
  startMinute: number
  endMinute: number
  position: number
}

type AvailabilityOverride = {
  id: string
  date: string | Date
  kind: string
  startMinute: number | null
  endMinute: number | null
  reason: string | null
}

type AvailabilitySchedule = {
  id: string
  name: string
  timezone: string
  isDefault: boolean
  isActive: boolean
  windows: AvailabilityWindow[]
  overrides: AvailabilityOverride[]
}

type ScheduleDraft = AvailabilitySchedule & {
  overrides: AvailabilityOverride[]
}

function sortWindows(windows: AvailabilityWindow[]) {
  return [...windows].sort((left, right) => {
    if (left.dayOfWeek !== right.dayOfWeek) {
      return left.dayOfWeek - right.dayOfWeek
    }

    if (left.position !== right.position) {
      return left.position - right.position
    }

    return left.startMinute - right.startMinute
  })
}

function sortSchedules(schedules: AvailabilitySchedule[]) {
  return [...schedules].sort((left, right) => {
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? -1 : 1
    }

    return left.name.localeCompare(right.name)
  })
}

function normalizeDateInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

function createDraft(schedule: AvailabilitySchedule): ScheduleDraft {
  return {
    ...schedule,
    windows: sortWindows(schedule.windows),
    overrides: schedule.overrides.map((override) => ({
      ...override,
      date: normalizeDateInput(override.date),
    })),
  }
}

export function BookingAvailabilityEditor({
  initialSchedules,
  initialSelectedScheduleId,
}: {
  initialSchedules: AvailabilitySchedule[]
  initialSelectedScheduleId: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [schedules, setSchedules] = useState(() => sortSchedules(initialSchedules))
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    initialSelectedScheduleId &&
      initialSchedules.some((schedule) => schedule.id === initialSelectedScheduleId)
      ? initialSelectedScheduleId
      : null,
  )
  const [draft, setDraft] = useState<ScheduleDraft | null>(() => {
    const selected =
      initialSelectedScheduleId
        ? initialSchedules.find((schedule) => schedule.id === initialSelectedScheduleId)
        : null

    return selected ? createDraft(selected) : null
  })
  const [pending, setPending] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createTimezone, setCreateTimezone] = useState("")
  const [cloneFromScheduleId, setCloneFromScheduleId] = useState("__none__")
  const [createPending, setCreatePending] = useState(false)
  const [actionPendingById, setActionPendingById] = useState<Record<string, boolean>>({})

  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId],
  )

  useEffect(() => {
    if (!selectedSchedule) {
      setDraft(null)
      return
    }

    setDraft(createDraft(selectedSchedule))
  }, [selectedSchedule])

  function updateUrl(scheduleId: string | null) {
    if (!scheduleId) {
      router.replace(pathname, { scroll: false })
      return
    }

    router.replace(`${pathname}?schedule=${scheduleId}`, { scroll: false })
  }

  function openSchedule(scheduleId: string) {
    setSelectedScheduleId(scheduleId)
    updateUrl(scheduleId)
  }

  function closeScheduleEditor() {
    setSelectedScheduleId(null)
    updateUrl(null)
  }

  function serializeSchedule(schedule: AvailabilitySchedule | ScheduleDraft) {
    return {
      scheduleId: schedule.id,
      name: schedule.name,
      timezone: schedule.timezone.trim(),
      isDefault: schedule.isDefault,
      isActive: schedule.isActive,
      windows: schedule.windows.map((window, index) => ({
        dayOfWeek: window.dayOfWeek,
        startMinute: window.startMinute,
        endMinute: window.endMinute,
        position: index,
      })),
      overrides: schedule.overrides.map((override) => ({
        date: override.date,
        kind: override.kind,
        startMinute: override.startMinute,
        endMinute: override.endMinute,
        reason: override.reason,
      })),
    }
  }

  async function createSchedule() {
    setCreatePending(true)
    try {
      const response = await fetch("/api/bookings/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          timezone: createTimezone.trim() || undefined,
          cloneFromScheduleId:
            cloneFromScheduleId === "__none__" ? null : cloneFromScheduleId,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: AvailabilitySchedule; error?: string }
        | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error ?? "Unable to create availability")
      }

      setSchedules((current) => sortSchedules(current.concat(payload.data!)))
      setCreateName("")
      setCreateTimezone("")
      setCloneFromScheduleId("__none__")
      setDialogOpen(false)
      openSchedule(payload.data.id)
      toast.success("Availability created")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create availability",
      )
    } finally {
      setCreatePending(false)
    }
  }

  async function setDefaultSchedule(schedule: AvailabilitySchedule) {
    setActionPendingById((current) => ({ ...current, [schedule.id]: true }))
    try {
      const response = await fetch("/api/bookings/availability", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...serializeSchedule(schedule),
          isDefault: true,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: AvailabilitySchedule; error?: string }
        | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error ?? "Unable to update default availability")
      }

      setSchedules((current) =>
        sortSchedules(
          current.map((item) =>
            item.id === schedule.id ? payload.data! : { ...item, isDefault: false },
          ),
        ),
      )

      if (selectedScheduleId === schedule.id) {
        setDraft(createDraft(payload.data))
      }

      toast.success("Default availability updated")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update default availability",
      )
    } finally {
      setActionPendingById((current) => {
        const next = { ...current }
        delete next[schedule.id]
        return next
      })
    }
  }

  async function duplicateSchedule(schedule: AvailabilitySchedule) {
    setActionPendingById((current) => ({ ...current, [schedule.id]: true }))
    try {
      const response = await fetch("/api/bookings/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `Copy of ${schedule.name}`,
          timezone: schedule.timezone,
          cloneFromScheduleId: schedule.id,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: AvailabilitySchedule; error?: string }
        | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error ?? "Unable to duplicate availability")
      }

      setSchedules((current) => sortSchedules(current.concat(payload.data!)))
      openSchedule(payload.data.id)
      toast.success("Availability duplicated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to duplicate availability",
      )
    } finally {
      setActionPendingById((current) => {
        const next = { ...current }
        delete next[schedule.id]
        return next
      })
    }
  }

  async function deleteSchedule(schedule: AvailabilitySchedule) {
    if (!window.confirm(`Delete "${schedule.name}"?`)) {
      return
    }

    setActionPendingById((current) => ({ ...current, [schedule.id]: true }))
    try {
      const response = await fetch("/api/bookings/availability", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scheduleId: schedule.id }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete availability")
      }

      setSchedules((current) =>
        sortSchedules(current.filter((item) => item.id !== schedule.id)),
      )

      if (selectedScheduleId === schedule.id) {
        closeScheduleEditor()
      }

      toast.success("Availability deleted")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete availability",
      )
    } finally {
      setActionPendingById((current) => {
        const next = { ...current }
        delete next[schedule.id]
        return next
      })
    }
  }

  function updateDayEnabled(dayOfWeek: number, enabled: boolean) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      if (!enabled) {
        return {
          ...current,
          windows: current.windows.filter((window) => window.dayOfWeek !== dayOfWeek),
        }
      }

      if (current.windows.some((window) => window.dayOfWeek === dayOfWeek)) {
        return current
      }

      return {
        ...current,
        windows: sortWindows(
          current.windows.concat({
            id: crypto.randomUUID(),
            dayOfWeek,
            startMinute: 9 * 60,
            endMinute: 17 * 60,
            position: 0,
          }),
        ),
      }
    })
  }

  function addWindow(dayOfWeek: number) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      const dayWindows = current.windows.filter((window) => window.dayOfWeek === dayOfWeek)
      const previous = dayWindows.at(-1)

      return {
        ...current,
        windows: sortWindows(
          current.windows.concat({
            id: crypto.randomUUID(),
            dayOfWeek,
            startMinute: previous ? previous.endMinute : 9 * 60,
            endMinute: previous ? Math.min(previous.endMinute + 60, 24 * 60) : 17 * 60,
            position: dayWindows.length,
          }),
        ),
      }
    })
  }

  function updateWindow(
    windowId: string,
    updates: Partial<Pick<AvailabilityWindow, "startMinute" | "endMinute">>,
  ) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        windows: sortWindows(
          current.windows.map((window) =>
            window.id === windowId ? { ...window, ...updates } : window,
          ),
        ),
      }
    })
  }

  function removeWindow(windowId: string) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        windows: current.windows.filter((window) => window.id !== windowId),
      }
    })
  }

  function addOverride() {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        overrides: current.overrides.concat({
          id: crypto.randomUUID(),
          date: new Date().toISOString().slice(0, 10),
          kind: "unavailable",
          startMinute: null,
          endMinute: null,
          reason: null,
        }),
      }
    })
  }

  function updateOverride(
    overrideId: string,
    updates: Partial<AvailabilityOverride>,
  ) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        overrides: current.overrides.map((override) =>
          override.id === overrideId ? { ...override, ...updates } : override,
        ),
      }
    })
  }

  function removeOverride(overrideId: string) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        overrides: current.overrides.filter((override) => override.id !== overrideId),
      }
    })
  }

  async function saveSchedule() {
    if (!draft) {
      return
    }

    setPending(true)
    try {
      const response = await fetch("/api/bookings/availability", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(serializeSchedule(draft)),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: AvailabilitySchedule; error?: string }
        | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error ?? "Unable to save availability")
      }

      setSchedules((current) =>
        sortSchedules(
          current.map((schedule) =>
            schedule.id === payload.data!.id
              ? payload.data!
              : draft.isDefault
                ? { ...schedule, isDefault: false }
                : schedule,
          ),
        ),
      )
      setDraft(createDraft(payload.data))
      toast.success("Availability updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save availability",
      )
    } finally {
      setPending(false)
    }
  }

  const scheduleGroups = draft
    ? bookingDayLabels.map((label, dayOfWeek) => ({
        label,
        dayOfWeek,
        windows: sortWindows(
          draft.windows.filter((window) => window.dayOfWeek === dayOfWeek),
        ),
      }))
    : []

  if (!draft || !selectedSchedule) {
    return (
      <>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="font-cormorant text-3xl leading-none">Availability</h1>
              <p className="text-sm text-muted-foreground">
                Configure times when you are available for bookings.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value="personal">
                <TabsList>
                  <TabsTrigger value="personal">My availability</TabsTrigger>
                  <TabsTrigger value="team" disabled>
                    Team availability
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => setDialogOpen(true)}>
                <PlusIcon className="size-4" />
                New
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Frame key={schedule.id}>
                <FramePanel className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between">
                  <button
                    type="button"
                    className="flex flex-1 flex-col items-start gap-2 text-left"
                    onClick={() => openSchedule(schedule.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <FrameTitle className="text-lg">{schedule.name}</FrameTitle>
                      {schedule.isDefault ? (
                        <Badge variant="secondary">Default</Badge>
                      ) : null}
                    </div>
                    <FrameDescription className="flex items-center gap-2 text-sm">
                      <Clock3Icon className="size-4" />
                      {summarizeBookingAvailabilityWindows(schedule.windows)}
                    </FrameDescription>
                    <FrameDescription className="flex items-center gap-2 text-sm">
                      <GlobeIcon className="size-4" />
                      {schedule.timezone}
                    </FrameDescription>
                  </button>

                  <div className="flex items-center gap-2 self-end md:self-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openSchedule(schedule.id)}
                    >
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          disabled={Boolean(actionPendingById[schedule.id])}
                        >
                          <EllipsisIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!schedule.isDefault ? (
                          <DropdownMenuItem
                            onClick={() => void setDefaultSchedule(schedule)}
                          >
                            Set as default
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onClick={() => void duplicateSchedule(schedule)}
                        >
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          data-variant="destructive"
                          onClick={() => void deleteSchedule(schedule)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </FramePanel>
              </Frame>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            Temporarily out-of-office? Add redirects and routing after the
            public booking flow is wired.
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create availability</DialogTitle>
              <DialogDescription>
                Add another schedule for a different booking pattern.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="availability-name">Name</FieldLabel>
                <Input
                  id="availability-name"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  placeholder="Working hours"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="availability-timezone">Timezone</FieldLabel>
                <Input
                  id="availability-timezone"
                  value={createTimezone}
                  onChange={(event) => setCreateTimezone(event.target.value)}
                  placeholder="Asia/Kathmandu"
                />
              </Field>
              <Field>
                <FieldLabel>Copy from</FieldLabel>
                <Select
                  value={cloneFromScheduleId}
                  onValueChange={setCloneFromScheduleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start from default hours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Start from default hours</SelectItem>
                    {schedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        {schedule.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void createSchedule()}
                disabled={createPending || createName.trim().length < 2}
              >
                {createPending ? "Creating..." : "Create availability"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="px-0" onClick={closeScheduleEditor}>
            <ChevronLeftIcon className="size-4" />
            Back
          </Button>
          <div className="space-y-1">
            <h1 className="font-cormorant text-3xl leading-none">{draft.name}</h1>
            <p className="text-sm text-muted-foreground">
              {summarizeBookingAvailabilityWindows(draft.windows)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Set as default</span>
            <Switch
              checked={draft.isDefault}
              disabled={draft.isDefault}
              onCheckedChange={(checked) =>
                setDraft((current) =>
                  current ? { ...current, isDefault: checked || current.isDefault } : current,
                )
              }
            />
          </div>
          <Button variant="outline" size="icon-sm" onClick={() => void duplicateSchedule(selectedSchedule)}>
            <CopyIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => void deleteSchedule(selectedSchedule)}>
            <Trash2Icon className="size-4" />
          </Button>
          <Button onClick={() => void saveSchedule()} disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Frame>
          <FramePanel className="space-y-5">
            <div className="space-y-1">
              <FrameTitle>Working hours</FrameTitle>
              <FrameDescription>
                Define one or more windows for each day.
              </FrameDescription>
            </div>

            <Field>
              <FieldLabel htmlFor="schedule-edit-name">Name</FieldLabel>
              <Input
                id="schedule-edit-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, name: event.target.value } : current,
                  )
                }
              />
            </Field>

            <div className="space-y-4">
              {scheduleGroups.map((group) => {
                const enabled = group.windows.length > 0

                return (
                  <div
                    key={group.label}
                    className="grid gap-3 rounded-xl border border-border/60 bg-background/60 p-4 lg:grid-cols-[180px_minmax(0,1fr)_auto]"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          updateDayEnabled(group.dayOfWeek, checked)
                        }
                      />
                      <span className="font-medium">{group.label}</span>
                    </div>
                    <div className="space-y-3">
                      {!enabled ? (
                        <div className="text-sm text-muted-foreground">Unavailable</div>
                      ) : (
                        group.windows.map((window) => (
                          <div key={window.id} className="flex flex-wrap items-center gap-2">
                            <Input
                              type="time"
                              className="w-36"
                              value={minutesToTimeInput(window.startMinute)}
                              onChange={(event) =>
                                updateWindow(window.id, {
                                  startMinute: timeInputToMinutes(event.target.value),
                                })
                              }
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                              type="time"
                              className="w-36"
                              value={minutesToTimeInput(window.endMinute)}
                              onChange={(event) =>
                                updateWindow(window.id, {
                                  endMinute: timeInputToMinutes(event.target.value),
                                })
                              }
                            />
                            <Button variant="ghost" size="icon-sm" onClick={() => removeWindow(window.id)}>
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" disabled={!enabled} onClick={() => addWindow(group.dayOfWeek)}>
                        <PlusIcon className="size-4" />
                        Add slot
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </FramePanel>
        </Frame>

        <div className="space-y-4">
          <Frame>
            <FramePanel className="space-y-4">
              <div className="space-y-1">
                <FrameTitle>Settings</FrameTitle>
                <FrameDescription>
                  Manage timezone and schedule state.
                </FrameDescription>
              </div>
              <Field>
                <FieldLabel htmlFor="schedule-timezone-edit">Timezone</FieldLabel>
                <Input
                  id="schedule-timezone-edit"
                  value={draft.timezone}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, timezone: event.target.value } : current,
                    )
                  }
                  placeholder="Asia/Kathmandu"
                />
              </Field>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Keep unused schedules available without exposing them as the default pattern.
                  </p>
                </div>
                <Switch
                  checked={draft.isActive}
                  onCheckedChange={(checked) =>
                    setDraft((current) =>
                      current ? { ...current, isActive: checked } : current,
                    )
                  }
                />
              </div>
            </FramePanel>
          </Frame>

          <Frame>
            <FramePanel className="space-y-3">
              <div className="space-y-1">
                <FrameTitle>Summary</FrameTitle>
                <FrameDescription>
                  Quick snapshot of the selected availability.
                </FrameDescription>
              </div>
              <div className="space-y-2 text-sm">
                {scheduleGroups
                  .filter((group) => group.windows.length > 0)
                  .map((group) => (
                    <div key={group.label} className="flex items-start justify-between gap-4">
                      <span className="font-medium">{group.label}</span>
                      <div className="text-right text-muted-foreground">
                        {group.windows.map((window) => (
                          <div key={window.id}>
                            {formatBookingMinuteRange(window.startMinute, window.endMinute)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </FramePanel>
          </Frame>
        </div>
      </div>

      <Frame>
        <FramePanel className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <FrameTitle>Date overrides</FrameTitle>
              <FrameDescription>
                Add dates when your daily availability changes.
              </FrameDescription>
            </div>
            <Button variant="outline" onClick={addOverride}>
              <PlusIcon className="size-4" />
              Add override
            </Button>
          </div>

          {draft.overrides.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              No overrides yet.
            </div>
          ) : (
            <div className="space-y-3">
              {draft.overrides.map((override) => (
                <div
                  key={override.id}
                  className="grid gap-3 rounded-xl border border-border/60 bg-background/60 p-4 lg:grid-cols-[170px_160px_minmax(0,1fr)_40px]"
                >
                  <Input
                    type="date"
                    value={String(override.date)}
                    onChange={(event) =>
                      updateOverride(override.id, { date: event.target.value })
                    }
                  />
                  <Select
                    value={override.kind}
                    onValueChange={(value) => updateOverride(override.id, { kind: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap items-center gap-2">
                    {override.kind === "available" ? (
                      <>
                        <Input
                          type="time"
                          className="w-32"
                          value={minutesToTimeInput(override.startMinute ?? 540)}
                          onChange={(event) =>
                            updateOverride(override.id, {
                              startMinute: timeInputToMinutes(event.target.value),
                            })
                          }
                        />
                        <Input
                          type="time"
                          className="w-32"
                          value={minutesToTimeInput(override.endMinute ?? 1020)}
                          onChange={(event) =>
                            updateOverride(override.id, {
                              endMinute: timeInputToMinutes(event.target.value),
                            })
                          }
                        />
                      </>
                    ) : (
                      <Input
                        value={override.reason ?? ""}
                        onChange={(event) =>
                          updateOverride(override.id, { reason: event.target.value })
                        }
                        placeholder="Reason"
                      />
                    )}
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeOverride(override.id)}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </FramePanel>
      </Frame>
    </div>
  )
}
