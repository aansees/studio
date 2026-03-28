import { BookingEventTypesManager } from "@/components/layout/dashboard/booking-event-types-manager"
import { requireSession } from "@/lib/session"
import { listBookingEventTypesForAdmin } from "@/lib/services/bookings"

export default async function BookingEventTypesPage() {
  const { user } = await requireSession(["admin"])
  const eventTypes = await listBookingEventTypesForAdmin(user)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <BookingEventTypesManager initialRows={eventTypes} />
    </div>
  )
}
