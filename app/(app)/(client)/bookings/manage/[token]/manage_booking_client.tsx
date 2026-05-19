"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { formatBookingTimeZoneLabel } from "@/lib/bookings/format"
import { cn } from "@/lib/utils"

type ManagedBooking = {
  id: string
  status: string
  title: string
  attendeeName: string
  attendeeEmail: string
  startsAt: string
  endsAt: string
  timezone: string
  eventTypeId: string
  eventTypeTitle: string
  durationMinutes: number
  ownerName: string
  locationLabel: string | null
  canCancel: boolean
  canReschedule: boolean
}

type SlotPayload = {
  timezone: string
  days: Array<{
    date: string
    label: string
    slots: Array<{
      startsAt: string
      endsAt: string
    }>
  }>
}

export function ManageBookingClient({
  token,
  booking,
}: {
  token: string
  booking: ManagedBooking
}) {
  const [currentBooking, setCurrentBooking] = useState(booking)
  const [slots, setSlots] = useState<SlotPayload | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState(false)

  const activeDay = useMemo(
    () => slots?.days.find((day) => day.date === selectedDay) ?? slots?.days[0] ?? null,
    [selectedDay, slots],
  )

  useEffect(() => {
    if (!currentBooking.canReschedule) {
      return
    }

    const controller = new AbortController()
    const query = new URLSearchParams({
      eventTypeId: currentBooking.eventTypeId,
      durationMinutes: String(currentBooking.durationMinutes),
      days: "14",
    })

    fetch(`/api/bookings/public/slots?${query.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          data?: SlotPayload
          error?: string
        } | null

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error ?? "Unable to load reschedule slots")
        }

        return payload.data
      })
      .then((data) => {
        setSlots(data)
        setSelectedDay(data.days[0]?.date ?? null)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          toast.error(
            error instanceof Error ? error.message : "Unable to load reschedule slots",
          )
        }
      })

    return () => controller.abort()
  }, [currentBooking.canReschedule, currentBooking.durationMinutes, currentBooking.eventTypeId])

  function formatRange(startsAt: string, endsAt: string, timeZone: string) {
    const start = new Date(startsAt)
    const end = new Date(endsAt)
    const date = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone,
    }).format(start)
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).formatRange(start, end)

    return `${date}, ${time}`
  }

  function formatSlotTime(value: string) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: slots?.timezone ?? currentBooking.timezone,
    }).format(new Date(value))
  }

  async function cancelBooking() {
    if (!currentBooking.canCancel || pending) {
      return
    }

    setPending(true)
    try {
      const response = await fetch(`/api/bookings/manage/${token}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to cancel booking")
      }

      setCurrentBooking((current) => ({
        ...current,
        status: "cancelled",
        canCancel: false,
        canReschedule: false,
      }))
      toast.success("Booking cancelled")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel booking")
    } finally {
      setPending(false)
    }
  }

  async function rescheduleBooking() {
    if (!selectedSlot || !currentBooking.canReschedule || pending) {
      return
    }

    setPending(true)
    try {
      const response = await fetch(`/api/bookings/manage/${token}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          startsAt: selectedSlot,
          durationMinutes: currentBooking.durationMinutes,
          reason,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error ?? "Unable to reschedule booking")
      }

      setCurrentBooking((current) => ({
        ...current,
        status: payload.data.status,
        startsAt: payload.data.startsAt,
        endsAt: payload.data.endsAt,
        timezone: payload.data.timezone,
      }))
      setSelectedSlot(null)
      toast.success("Booking rescheduled")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reschedule booking")
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 rounded-lg border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur md:grid-cols-[0.8fr_1.2fr]">
      <section className="space-y-4 border-b border-black/10 pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-5">
        <div>
          <p className="text-sm text-black/55">Booking with {currentBooking.ownerName}</p>
          <h1 className="mt-2 text-3xl font-semibold">{currentBooking.eventTypeTitle}</h1>
        </div>
        <div className="space-y-2 text-sm">
          <p>{formatRange(currentBooking.startsAt, currentBooking.endsAt, currentBooking.timezone)}</p>
          <p>{currentBooking.durationMinutes} min</p>
          <p>{formatBookingTimeZoneLabel(currentBooking.timezone)}</p>
          <p>Status: {currentBooking.status}</p>
          {currentBooking.locationLabel ? <p>Location: {currentBooking.locationLabel}</p> : null}
        </div>
        <Field>
          <FieldLabel htmlFor="manage-reason">Reason</FieldLabel>
          <Textarea
            id="manage-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Optional note for the booking change."
            className="min-h-24"
          />
        </Field>
        <Button
          type="button"
          variant="outline"
          disabled={!currentBooking.canCancel || pending}
          onClick={cancelBooking}
        >
          Cancel booking
        </Button>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Reschedule</h2>
          <p className="text-sm text-black/55">
            Choose a new available slot for this booking.
          </p>
        </div>

        {!currentBooking.canReschedule ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-black/60">
            Rescheduling is not available for this booking.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {slots?.days.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDay(day.date)}
                  className={cn(
                    "rounded-lg border border-black/10 px-3 py-2 text-sm transition-colors hover:bg-black/5",
                    day.date === activeDay?.date && "bg-black text-white hover:bg-black",
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <ScrollArea className="h-[300px] pr-1" hideScrollbars scrollFade>
              <div className="grid gap-2">
                {activeDay?.slots.map((slot) => (
                  <button
                    key={slot.startsAt}
                    type="button"
                    onClick={() => setSelectedSlot(slot.startsAt)}
                    className={cn(
                      "rounded-lg border border-black/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5",
                      selectedSlot === slot.startsAt && "bg-black text-white hover:bg-black",
                    )}
                  >
                    {formatSlotTime(slot.startsAt)}
                  </button>
                ))}
                {activeDay && activeDay.slots.length === 0 ? (
                  <p className="text-sm text-black/55">No slots available for this day.</p>
                ) : null}
              </div>
            </ScrollArea>
            <Button
              type="button"
              disabled={!selectedSlot || pending}
              onClick={rescheduleBooking}
            >
              Confirm reschedule
            </Button>
          </>
        )}
      </section>
    </main>
  )
}
