import { BookingAvailabilityEditor } from "@/components/layout/dashboard/booking-availability-editor"
import { requireSession } from "@/lib/session"
import { ensureDefaultBookingAvailabilityForAdmin } from "@/lib/services/bookings"

export default async function BookingAvailabilityPage() {
  const { user } = await requireSession(["admin"])
  const schedule = await ensureDefaultBookingAvailabilityForAdmin(user)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <BookingAvailabilityEditor initialSchedule={schedule} />
    </div>
  )
}
