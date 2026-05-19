"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";

import {
  formatBookingDateTimeRange,
  formatBookingTimeZoneLabel,
} from "@/lib/bookings/format";
import {
  bookingStatusOptions,
  getBookingOptionLabel,
} from "@/lib/constants/booking-display";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TablePagination,
  useTablePagination,
} from "@/components/ui/table-pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BookingRow = {
  id: string;
  status: string;
  source: string;
  title: string;
  projectId: string | null;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string | null;
  attendeeTimezone: string | null;
  answers: Record<string, unknown> | null;
  guests: string[] | null;
  locationKind: string | null;
  locationLabel: string | null;
  locationValue: string | null;
  meetingUrl: string | null;
  internalNotes: string | null;
  cancellationReason: string | null;
  rescheduleReason: string | null;
  startsAt: string | Date;
  endsAt: string | Date;
  confirmedAt: string | Date | null;
  cancelledAt: string | Date | null;
  completedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  eventTypeId: string;
  eventTypeTitle: string;
};

type BookingSummary = {
  total: number;
  upcoming: number;
  pending: number;
  confirmed: number;
  cancelled: number;
};

const statusTabs = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function formatBookingAnswer(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatDateTime(value: string | Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAnswerLabel(key: string) {
  if (key === "notes") {
    return "Additional notes";
  }

  return key
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

function BookingDetailDialog({
  booking,
  onOpenChange,
}: {
  booking: BookingRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const answerEntries = booking?.answers
    ? Object.entries(booking.answers)
        .map(([key, value]) => [key, formatBookingAnswer(value)] as const)
        .filter(([, value]) => value.length > 0)
    : [];

  return (
    <Dialog open={Boolean(booking)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Booking details</DialogTitle>
          <DialogDescription>
            Full session, attendee, location, and submitted booking form data.
          </DialogDescription>
        </DialogHeader>

        {booking ? (
          <div className="space-y-6">
            <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
              <DetailItem label="Session">
                <div className="font-medium">{booking.title}</div>
                <div className="text-muted-foreground">
                  {formatBookingDateTimeRange(booking.startsAt, booking.endsAt)}
                </div>
              </DetailItem>
              <DetailItem label="Status">
                <Badge variant="outline">
                  {getBookingOptionLabel(
                    bookingStatusOptions,
                    booking.status,
                    booking.status,
                  )}
                </Badge>
              </DetailItem>
              <DetailItem label="Event type">
                {booking.eventTypeTitle}
              </DetailItem>
              <DetailItem label="Source">{booking.source}</DetailItem>
              <DetailItem label="Created">
                {formatDateTime(booking.createdAt)}
              </DetailItem>
              <DetailItem label="Updated">
                {formatDateTime(booking.updatedAt)}
              </DetailItem>
              <DetailItem label="Confirmed">
                {formatDateTime(booking.confirmedAt)}
              </DetailItem>
              <DetailItem label="Cancelled">
                {formatDateTime(booking.cancelledAt)}
              </DetailItem>
            </section>

            <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
              <DetailItem label="Attendee name">
                {booking.attendeeName}
              </DetailItem>
              <DetailItem label="Attendee email">
                {booking.attendeeEmail}
              </DetailItem>
              <DetailItem label="Phone">
                {booking.attendeePhone ?? "-"}
              </DetailItem>
              <DetailItem label="Timezone">
                {formatBookingTimeZoneLabel(booking.attendeeTimezone)}
              </DetailItem>
              <DetailItem label="Guests">
                {booking.guests?.length ? booking.guests.join(", ") : "-"}
              </DetailItem>
              <DetailItem label="Project">
                {booking.projectId ? (
                  <Link
                    href={`/dashboard/projects/${booking.projectId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Open linked project
                  </Link>
                ) : (
                  "-"
                )}
              </DetailItem>
            </section>

            <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
              <DetailItem label="Location label">
                {booking.locationLabel ?? booking.locationKind ?? "-"}
              </DetailItem>
              <DetailItem label="Meeting URL">
                {booking.meetingUrl ? (
                  <a
                    href={booking.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {booking.meetingUrl}
                  </a>
                ) : (
                  "-"
                )}
              </DetailItem>
              <DetailItem label="Location value">
                {booking.locationValue ?? "-"}
              </DetailItem>
              <DetailItem label="Internal notes">
                {booking.internalNotes ?? "-"}
              </DetailItem>
            </section>

            <section className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-medium">Submitted form answers</h3>
              {answerEntries.length > 0 ? (
                <dl className="grid gap-4 md:grid-cols-2">
                  {answerEntries.map(([key, value]) => (
                    <DetailItem key={key} label={formatAnswerLabel(key)}>
                      {value}
                    </DetailItem>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No custom answers were submitted.
                </p>
              )}
            </section>

            {booking.cancellationReason || booking.rescheduleReason ? (
              <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                <DetailItem label="Cancellation reason">
                  {booking.cancellationReason ?? "-"}
                </DetailItem>
                <DetailItem label="Reschedule reason">
                  {booking.rescheduleReason ?? "-"}
                </DetailItem>
              </section>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function BookingsAdminList({
  rows,
  summary,
}: {
  rows: BookingRow[];
  summary: BookingSummary;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] =
    useState<(typeof statusTabs)[number]["value"]>("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(
    null,
  );
  const [referenceNow] = useState(() => Date.now());

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        row.attendeeName.toLowerCase().includes(normalizedQuery) ||
        row.attendeeEmail.toLowerCase().includes(normalizedQuery) ||
        row.eventTypeTitle.toLowerCase().includes(normalizedQuery);

      if (!matchesQuery) {
        return false;
      }

      if (status === "all") {
        return true;
      }

      if (status === "upcoming") {
        return new Date(row.startsAt).getTime() >= referenceNow;
      }

      return row.status === status;
    });
  }, [query, referenceNow, rows, status]);
  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedRows,
    setCurrentPage,
    totalItems,
    totalPages,
  } = useTablePagination(filteredRows);

  function handleStatusChange(value: string) {
    setStatus(value as (typeof statusTabs)[number]["value"]);
    setCurrentPage(1);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setCurrentPage(1);
  }

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
        <Tabs value={status} onValueChange={handleStatusChange}>
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
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Search bookings"
          className="md:max-w-sm"
        />
      </div>

      <Frame className="p-0">
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
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24">
                  <EmptyTitle>No bookings yet</EmptyTitle>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setSelectedBooking(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedBooking(row);
                    }
                  }}
                >
                  <TableCell>
                    {formatBookingDateTimeRange(row.startsAt, row.endsAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{row.attendeeName}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.attendeeEmail}
                    </div>
                  </TableCell>
                  <TableCell>{row.eventTypeTitle}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getBookingOptionLabel(
                        bookingStatusOptions,
                        row.status,
                        row.status,
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.locationLabel ?? row.locationKind ?? "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Frame>
      <TablePagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="px-4 pb-4"
      />
      <BookingDetailDialog
        booking={selectedBooking}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBooking(null);
          }
        }}
      />
    </div>
  );
}
