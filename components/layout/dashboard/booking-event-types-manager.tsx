"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ExternalLinkIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { getBookingOptionLabel, bookingEventTypeStatusOptions } from "@/lib/constants/booking-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Frame, FrameDescription, FramePanel, FrameTitle } from "@/components/ui/frame"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

type EventTypeRow = {
  id: string
  title: string
  slug: string
  description: string | null
  status: string
  durationMinutes: number
  isPublic: boolean
  bookingCount: number
  upcomingBookingCount: number
  locations: Array<{ kind: string; label: string; isDefault: boolean }>
}

export function BookingEventTypesManager({
  initialRows,
}: {
  initialRows: EventTypeRow[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [pendingById, setPendingById] = useState<Record<string, boolean>>({})

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (normalizedQuery.length === 0) {
        return true
      }

      return (
        row.title.toLowerCase().includes(normalizedQuery) ||
        row.slug.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [query, rows])

  async function createEventType() {
    setCreating(true)
    try {
      const response = await fetch("/api/bookings/event-types", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "30 min meeting",
          slug: "30-min-meeting",
          durationMinutes: 30,
          status: "draft",
          allowGuestBookings: true,
          isPublic: true,
          confirmationChannels: ["email"],
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; eventTypeId?: string }
        | null

      if (!response.ok || !payload?.eventTypeId) {
        throw new Error(payload?.error ?? "Unable to create event type")
      }

      router.push(`/bookings/event-types/${payload.eventTypeId}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create event type",
      )
    } finally {
      setCreating(false)
    }
  }

  async function toggleEventType(row: EventTypeRow, checked: boolean) {
    setPendingById((current) => ({ ...current, [row.id]: true }))
    try {
      const response = await fetch(`/api/bookings/event-types/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: row.title,
          slug: row.slug,
          description: row.description,
          durationMinutes: row.durationMinutes,
          status: checked ? "active" : "draft",
          allowGuestBookings: true,
          isPublic: row.isPublic,
          confirmationChannels: ["email"],
          locations: row.locations.map((location, index) => ({
            kind: location.kind,
            label: location.label,
            isDefault: location.isDefault,
            isActive: true,
            position: index,
          })),
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update event type")
      }

      setRows((current) =>
        current.map((item) =>
          item.id === row.id
            ? { ...item, status: checked ? "active" : "draft" }
            : item,
        ),
      )
      toast.success("Event type updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update event type",
      )
    } finally {
      setPendingById((current) => {
        const next = { ...current }
        delete next[row.id]
        return next
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          type="search"
          placeholder="Search event types"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="md:max-w-sm"
        />
        <Button onClick={() => void createEventType()} disabled={creating}>
          <PlusIcon className="size-4" />
          {creating ? "Creating..." : "New event type"}
        </Button>
      </div>

      {filteredRows.length === 0 ? (
        <Frame>
          <FramePanel className="p-10">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No event types yet</EmptyTitle>
                <EmptyDescription>
                  Create the first admin event type before enabling public
                  booking.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </FramePanel>
        </Frame>
      ) : (
        filteredRows.map((row) => (
          <Frame key={row.id}>
            <FramePanel className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <FrameTitle className="text-lg">{row.title}</FrameTitle>
                  <Badge variant="outline">
                    {getBookingOptionLabel(
                      bookingEventTypeStatusOptions,
                      row.status,
                      row.status,
                    )}
                  </Badge>
                </div>
                <FrameDescription>
                  `{row.slug}` • {row.durationMinutes} min • {row.bookingCount} total
                  bookings
                </FrameDescription>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {row.locations.map((location) => (
                    <Badge key={`${row.id}-${location.label}`} variant="secondary">
                      {location.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <Switch
                    checked={row.status === "active"}
                    disabled={Boolean(pendingById[row.id])}
                    onCheckedChange={(checked) => void toggleEventType(row, checked)}
                  />
                </div>
                <Button asChild variant="outline">
                  <Link href={`/bookings/event-types/${row.id}`}>
                    <ExternalLinkIcon className="size-4" />
                    Configure
                  </Link>
                </Button>
              </div>
            </FramePanel>
          </Frame>
        ))
      )}
    </div>
  )
}
