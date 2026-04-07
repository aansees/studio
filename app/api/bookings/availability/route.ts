import { NextResponse } from "next/server"

import {
  bookingAvailabilityCreateSchema,
  bookingAvailabilityDeleteSchema,
  bookingAvailabilitySchema,
} from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import {
  createBookingAvailabilityScheduleForAdmin,
  deleteBookingAvailabilityScheduleForAdmin,
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

export async function POST(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const rawBody = await request.json()
    const schedule = await createBookingAvailabilityScheduleForAdmin(
      user,
      bookingAvailabilityCreateSchema.parse(rawBody),
    )

    return NextResponse.json({ data: schedule }, { status: 201 })
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

export async function DELETE(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const rawBody = await request.json()
    const { scheduleId } = bookingAvailabilityDeleteSchema.parse(rawBody)

    await deleteBookingAvailabilityScheduleForAdmin(user, scheduleId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
