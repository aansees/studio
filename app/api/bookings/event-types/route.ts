import { NextResponse } from "next/server"

import { bookingEventTypeSchema } from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import {
  createBookingEventTypeAsAdmin,
  listBookingEventTypesForAdmin,
} from "@/lib/services/bookings"

export async function GET() {
  try {
    const { user } = await requireApiSession(["admin"])
    const data = await listBookingEventTypesForAdmin(user)
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const rawBody = await request.json()
    const eventTypeId = await createBookingEventTypeAsAdmin(
      user,
      bookingEventTypeSchema.parse(rawBody),
    )

    return NextResponse.json({ eventTypeId }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
