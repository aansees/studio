import { NextResponse } from "next/server"

import { clientBookingSlotQuerySchema } from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { listAvailableBookingSlotsForClient } from "@/lib/services/bookings"

export async function GET(request: Request) {
  try {
    const { user } = await requireApiSession(["client"])
    const url = new URL(request.url)
    const query = clientBookingSlotQuerySchema.parse({
      eventTypeId: url.searchParams.get("eventTypeId") ?? "",
      durationMinutes: url.searchParams.get("durationMinutes") ?? undefined,
      fromDate: url.searchParams.get("fromDate") ?? undefined,
      days: url.searchParams.get("days") ?? undefined,
    })

    const data = await listAvailableBookingSlotsForClient(user, query)
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}
