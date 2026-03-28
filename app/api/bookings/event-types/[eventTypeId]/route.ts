import { NextResponse } from "next/server"

import { bookingEventTypeSchema } from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import {
  deleteBookingEventTypeAsAdmin,
  getBookingEventTypeForAdmin,
  updateBookingEventTypeAsAdmin,
} from "@/lib/services/bookings"

type RouteContext = {
  params: Promise<{ eventTypeId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireApiSession(["admin"])
    const { eventTypeId } = await context.params
    const data = await getBookingEventTypeForAdmin(user, eventTypeId)

    if (!data) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user } = await requireApiSession(["admin"])
    const { eventTypeId } = await context.params
    const rawBody = await request.json()
    await updateBookingEventTypeAsAdmin(
      user,
      eventTypeId,
      bookingEventTypeSchema.parse(rawBody),
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireApiSession(["admin"])
    const { eventTypeId } = await context.params
    await deleteBookingEventTypeAsAdmin(user, eventTypeId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
