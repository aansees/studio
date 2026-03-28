import { NextResponse } from "next/server"

import { bookingAppConnectionSchema } from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import {
  createBookingAppConnectionAsAdmin,
  listBookingAppConnectionsForAdmin,
} from "@/lib/services/bookings"

export async function GET() {
  try {
    const { user } = await requireApiSession(["admin"])
    const data = await listBookingAppConnectionsForAdmin(user)
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const rawBody = await request.json()
    const connection = await createBookingAppConnectionAsAdmin(
      user,
      bookingAppConnectionSchema.parse(rawBody),
    )
    return NextResponse.json({ data: connection }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
