import { BookingsAdminList } from "@/components/layout/dashboard/bookings-admin-list"
import { requireSession } from "@/lib/session"
import { listBookingsForAdmin } from "@/lib/services/bookings"

export default async function BookingsPage() {
  const { user } = await requireSession(["admin"])
  const data = await listBookingsForAdmin(user)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <BookingsAdminList rows={data.rows} summary={data.summary} />
    </div>
  )
}
