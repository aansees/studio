import { notFound } from "next/navigation"

import { ManageBookingClient } from "./manage_booking_client"
import { getBookingByManageToken } from "@/lib/services/bookings"

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  let booking: Awaited<ReturnType<typeof getBookingByManageToken>>

  try {
    booking = await getBookingByManageToken(token)
  } catch {
    notFound()
  }

  return (
    <div className="min-h-screen px-4 py-28 text-[var(--otis-fg)]">
      <ManageBookingClient
        token={token}
        booking={{
          id: booking.id,
          status: booking.status,
          title: booking.title,
          attendeeName: booking.attendeeName,
          attendeeEmail: booking.attendeeEmail,
          startsAt: booking.startsAt.toISOString(),
          endsAt: booking.endsAt.toISOString(),
          timezone: booking.timezone,
          eventTypeId: booking.eventTypeId,
          eventTypeTitle: booking.eventTypeTitle,
          durationMinutes: booking.durationMinutes,
          ownerName: booking.ownerName,
          locationLabel: booking.locationLabel,
          canCancel: booking.canCancel,
          canReschedule: booking.canReschedule,
        }}
      />
    </div>
  )
}
