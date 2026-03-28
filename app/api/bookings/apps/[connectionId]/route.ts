import { NextResponse } from "next/server"

import { bookingAppConnectionSchema } from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import {
  deleteBookingAppConnectionAsAdmin,
  updateBookingAppConnectionAsAdmin,
} from "@/lib/services/bookings"

type RouteContext = {
  params: Promise<{ connectionId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user } = await requireApiSession(["admin"])
    const { connectionId } = await context.params
    const rawBody = await request.json()
    const connection = await updateBookingAppConnectionAsAdmin(
      user,
      connectionId,
      bookingAppConnectionSchema.parse(rawBody),
    )

    return NextResponse.json({ data: connection })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireApiSession(["admin"])
    const { connectionId } = await context.params
    await deleteBookingAppConnectionAsAdmin(user, connectionId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
