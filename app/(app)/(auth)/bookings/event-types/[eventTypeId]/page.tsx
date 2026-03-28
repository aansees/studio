import { notFound } from "next/navigation"

import { BookingEventTypeEditor } from "@/components/layout/dashboard/booking-event-type-editor"
import { requireSession } from "@/lib/session"
import {
  getBookingEventTypeForAdmin,
  listBookingAppConnectionsForAdmin,
  listBookingAvailabilitySchedulesForAdmin,
} from "@/lib/services/bookings"

type PageProps = {
  params: Promise<{ eventTypeId: string }>
}

export default async function BookingEventTypeDetailPage({
  params,
}: PageProps) {
  const { user } = await requireSession(["admin"])
  const { eventTypeId } = await params

  const [eventType, schedules, appConnections] = await Promise.all([
    getBookingEventTypeForAdmin(user, eventTypeId),
    listBookingAvailabilitySchedulesForAdmin(user),
    listBookingAppConnectionsForAdmin(user),
  ])

  if (!eventType) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <BookingEventTypeEditor
        initialEventType={eventType}
        availabilityOptions={schedules.map((schedule) => ({
          id: schedule.id,
          name: schedule.name,
          timezone: schedule.timezone,
        }))}
        appConnections={appConnections.map((connection) => ({
          id: connection.id,
          provider: connection.provider,
          accountLabel: connection.accountLabel,
          accountEmail: connection.accountEmail,
          supportsCalendar: connection.supportsCalendar,
          supportsConferencing: connection.supportsConferencing,
        }))}
      />
    </div>
  )
}
