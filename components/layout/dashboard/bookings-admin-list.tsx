"use client"

import { useMemo, useState } from "react"

import { formatBookingDateTimeRange } from "@/lib/bookings/format"
import {
  bookingStatusOptions,
  getBookingOptionLabel,
} from "@/lib/constants/booking-display"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Frame, FramePanel } from "@/components/ui/frame"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type BookingRow = {
  id: string
  status: string
  source: string
  title: string
  attendeeName: string
  attendeeEmail: string
  attendeePhone: string | null
  attendeeTimezone: string | null
  locationKind: string | null
  locationLabel: string | null
  meetingUrl: string | null
  startsAt: string | Date
  endsAt: string | Date
  confirmedAt: string | Date | null
  cancelledAt: string | Date | null
  createdAt: string | Date
  eventTypeId: string
  eventTypeTitle: string
}

type BookingSummary = {
  total: number
  upcoming: number
  pending: number
  confirmed: number
  cancelled: number
}

const statusTabs = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
] as const

export function BookingsAdminList({
  rows,
  summary,
}: {
  rows: BookingRow[]
  summary: BookingSummary
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<(typeof statusTabs)[number]["value"]>("all")
  const [referenceNow] = useState(() => Date.now())

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        row.attendeeName.toLowerCase().includes(normalizedQuery) ||
        row.attendeeEmail.toLowerCase().includes(normalizedQuery) ||
        row.eventTypeTitle.toLowerCase().includes(normalizedQuery)

      if (!matchesQuery) {
        return false
      }

      if (status === "all") {
        return true
      }

      if (status === "upcoming") {
        return new Date(row.startsAt).getTime() >= referenceNow
      }

      return row.status === status
    })
  }, [query, referenceNow, rows, status])

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        {[
          { label: "Total", value: summary.total },
          { label: "Upcoming", value: summary.upcoming },
          { label: "Pending", value: summary.pending },
          { label: "Confirmed", value: summary.confirmed },
          { label: "Cancelled", value: summary.cancelled },
        ].map((item) => (
          <Frame key={item.label}>
            <FramePanel className="space-y-1 p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold">{item.value}</p>
            </FramePanel>
          </Frame>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs
          value={status}
          onValueChange={(value) =>
            setStatus(value as (typeof statusTabs)[number]["value"])
          }
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search bookings"
          className="md:max-w-sm"
        />
      </div>

      <Frame className="p-0">
        {filteredRows.length === 0 ? (
          <FramePanel className="p-10">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No bookings yet</EmptyTitle>
                <EmptyDescription>
                  Booked meetings will appear here once the public booking flow is
                  enabled.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </FramePanel>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Attendee</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatBookingDateTimeRange(row.startsAt, row.endsAt)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{row.attendeeName}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.attendeeEmail}
                    </div>
                  </TableCell>
                  <TableCell>{row.eventTypeTitle}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getBookingOptionLabel(bookingStatusOptions, row.status, row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.locationLabel ?? row.locationKind ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Frame>
    </div>
  )
}
