import { NextResponse } from "next/server"

import { bookingAvailabilitySchema } from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import {
  listBookingAvailabilitySchedulesForAdmin,
  updateBookingAvailabilityForAdmin,
} from "@/lib/services/bookings"

export async function GET() {
  try {
    const { user } = await requireApiSession(["admin"])
    const schedules = await listBookingAvailabilitySchedulesForAdmin(user)
    return NextResponse.json({ data: schedules })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const rawBody = await request.json()
    const schedule = await updateBookingAvailabilityForAdmin(
      user,
      bookingAvailabilitySchema.parse(rawBody),
    )

    return NextResponse.json({ data: schedule })
  } catch (error) {
    return errorResponse(error)
  }
}
