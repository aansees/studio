import { BookingAvailabilityEditor } from "@/components/layout/dashboard/booking-availability-editor"
import { requireSession } from "@/lib/session"
import { listBookingAvailabilitySchedulesForAdmin } from "@/lib/services/bookings"

type PageProps = {
  searchParams?: Promise<{
    schedule?: string
  }>
}

export default async function BookingAvailabilityPage({ searchParams }: PageProps) {
  const { user } = await requireSession(["admin"])
  const schedules = await listBookingAvailabilitySchedulesForAdmin(user)
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const initialSelectedScheduleId =
    typeof resolvedSearchParams?.schedule === "string"
      ? resolvedSearchParams.schedule
      : null

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <BookingAvailabilityEditor
        initialSchedules={schedules}
        initialSelectedScheduleId={initialSelectedScheduleId}
      />
    </div>
  )
}
