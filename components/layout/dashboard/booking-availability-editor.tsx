"use client"

import { useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { minutesToTimeInput, timeInputToMinutes } from "@/lib/bookings/format"
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

const dayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

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

function normalizeDateInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

export function BookingAvailabilityEditor({
  initialSchedule,
}: {
  initialSchedule: AvailabilitySchedule
}) {
  const [timezone, setTimezone] = useState(initialSchedule.timezone)
  const [windows, setWindows] = useState<AvailabilityWindow[]>(
    sortWindows(initialSchedule.windows),
  )
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>(
    initialSchedule.overrides.map((override) => ({
      ...override,
      date: normalizeDateInput(override.date),
    })),
  )
  const [pending, setPending] = useState(false)

  function updateDayEnabled(dayOfWeek: number, enabled: boolean) {
    setWindows((current) => {
      if (!enabled) {
        return current.filter((window) => window.dayOfWeek !== dayOfWeek)
      }

      if (current.some((window) => window.dayOfWeek === dayOfWeek)) {
        return current
      }

      return sortWindows([
        ...current,
        {
          id: crypto.randomUUID(),
          dayOfWeek,
          startMinute: 9 * 60,
          endMinute: 17 * 60,
          position: 0,
        },
      ])
    })
  }

  function addWindow(dayOfWeek: number) {
    setWindows((current) => {
      const dayWindows = current.filter((window) => window.dayOfWeek === dayOfWeek)
      const nextPosition = dayWindows.length
      const previous = dayWindows.at(-1)

      return sortWindows([
        ...current,
        {
          id: crypto.randomUUID(),
          dayOfWeek,
          startMinute: previous ? previous.endMinute : 9 * 60,
          endMinute: previous ? Math.min(previous.endMinute + 60, 24 * 60) : 17 * 60,
          position: nextPosition,
        },
      ])
    })
  }

  function updateWindow(
    windowId: string,
    updates: Partial<Pick<AvailabilityWindow, "startMinute" | "endMinute">>,
  ) {
    setWindows((current) =>
      sortWindows(
        current.map((window) =>
          window.id === windowId ? { ...window, ...updates } : window,
        ),
      ),
    )
  }

  function removeWindow(windowId: string) {
    setWindows((current) => current.filter((window) => window.id !== windowId))
  }

  function addOverride() {
    setOverrides((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        kind: "unavailable",
        startMinute: null,
        endMinute: null,
        reason: null,
      },
    ])
  }

  function updateOverride(
    overrideId: string,
    updates: Partial<AvailabilityOverride>,
  ) {
    setOverrides((current) =>
      current.map((override) =>
        override.id === overrideId ? { ...override, ...updates } : override,
      ),
    )
  }

  function removeOverride(overrideId: string) {
    setOverrides((current) => current.filter((override) => override.id !== overrideId))
  }

  async function saveSchedule() {
    setPending(true)
    try {
      const response = await fetch("/api/bookings/availability", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scheduleId: initialSchedule.id,
          timezone: timezone.trim(),
          windows: windows.map((window, index) => ({
            dayOfWeek: window.dayOfWeek,
            startMinute: window.startMinute,
            endMinute: window.endMinute,
            position: index,
          })),
          overrides: overrides.map((override) => ({
            date: override.date,
            kind: override.kind,
            startMinute: override.startMinute,
            endMinute: override.endMinute,
            reason: override.reason,
          })),
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to save availability")
      }

      toast.success("Availability updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save availability",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <Frame>
        <FramePanel className="space-y-4">
          <div>
            <FrameTitle>Working Hours</FrameTitle>
            <FrameDescription>
              Configure the admin schedule that event types can use for booking.
            </FrameDescription>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="availability-timezone">Timezone</FieldLabel>
              <Input
                id="availability-timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                placeholder="Asia/Kathmandu"
              />
            </Field>
          </FieldGroup>
        </FramePanel>
      </Frame>

      <Frame>
        <FramePanel className="space-y-4">
          <div>
            <FrameTitle>Weekly Availability</FrameTitle>
            <FrameDescription>
              Add one or more booking windows for each day.
            </FrameDescription>
          </div>

          <div className="space-y-3">
            {dayLabels.map((label, dayOfWeek) => {
              const dayWindows = windows.filter((window) => window.dayOfWeek === dayOfWeek)
              const enabled = dayWindows.length > 0

              return (
                <div
                  key={label}
                  className="rounded-xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          updateDayEnabled(dayOfWeek, checked)
                        }
                      />
                      <span className="font-medium">{label}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!enabled}
                      onClick={() => addWindow(dayOfWeek)}
                    >
                      <PlusIcon className="size-4" />
                      Add slot
                    </Button>
                  </div>

                  {enabled ? (
                    <div className="mt-3 space-y-2">
                      {dayWindows.map((window) => (
                        <div
                          key={window.id}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <Input
                            type="time"
                            className="w-36"
                            value={minutesToTimeInput(window.startMinute)}
                            onChange={(event) =>
                              updateWindow(window.id, {
                                startMinute: timeInputToMinutes(
                                  event.target.value,
                                ),
                              })
                            }
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            className="w-36"
                            value={minutesToTimeInput(window.endMinute)}
                            onChange={(event) =>
                              updateWindow(window.id, {
                                endMinute: timeInputToMinutes(
                                  event.target.value,
                                ),
                              })
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeWindow(window.id)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </FramePanel>
      </Frame>

      <Frame>
        <FramePanel className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <FrameTitle>Date Overrides</FrameTitle>
              <FrameDescription>
                Block specific dates or make one-off exception windows.
              </FrameDescription>
            </div>
            <Button type="button" variant="outline" onClick={addOverride}>
              <PlusIcon className="size-4" />
              Add override
            </Button>
          </div>

          <div className="space-y-3">
            {overrides.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No overrides yet.
              </div>
            ) : (
              overrides.map((override) => (
                <div
                  key={override.id}
                  className="grid gap-3 rounded-xl border border-border/60 bg-background/60 p-4 md:grid-cols-[170px_150px_1fr_40px]"
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
                    onValueChange={(value) =>
                      updateOverride(override.id, {
                        kind: value as AvailabilityOverride["kind"],
                      })
                    }
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
                              startMinute: timeInputToMinutes(
                                event.target.value,
                              ),
                            })
                          }
                        />
                        <Input
                          type="time"
                          className="w-32"
                          value={minutesToTimeInput(override.endMinute ?? 1020)}
                          onChange={(event) =>
                            updateOverride(override.id, {
                              endMinute: timeInputToMinutes(
                                event.target.value,
                              ),
                            })
                          }
                        />
                      </>
                    ) : (
                      <Input
                        value={override.reason ?? ""}
                        onChange={(event) =>
                          updateOverride(override.id, {
                            reason: event.target.value,
                          })
                        }
                        placeholder="Reason"
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeOverride(override.id)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </FramePanel>
      </Frame>

      <div className="flex justify-end">
        <Button onClick={() => void saveSchedule()} disabled={pending}>
          {pending ? "Saving..." : "Save availability"}
        </Button>
      </div>
    </div>
  )
}
