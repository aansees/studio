import { NextResponse } from "next/server"

import { publicBookingSlotQuerySchema } from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import {
  getRequestIp,
  requireApiRateLimit,
} from "@/lib/security/api-rate-limit"
import { listAvailableBookingSlotsForPublic } from "@/lib/services/bookings"

export async function GET(request: Request) {
  try {
    await requireApiRateLimit({
      key: `bookings:public:slots:${getRequestIp(request)}`,
      limit: 30,
      windowSeconds: 60,
    })
    const url = new URL(request.url)
    const query = publicBookingSlotQuerySchema.parse({
      eventTypeId: url.searchParams.get("eventTypeId") ?? "",
      durationMinutes: url.searchParams.get("durationMinutes") ?? undefined,
      fromDate: url.searchParams.get("fromDate") ?? undefined,
      days: url.searchParams.get("days") ?? undefined,
    })

    const data = await listAvailableBookingSlotsForPublic(query)
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}
