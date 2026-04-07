import { NextResponse } from "next/server"

import { clientBookingCreateSchema } from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import {
  createBookingForClient,
  listBookableEventTypesForClient,
} from "@/lib/services/bookings"

export async function GET() {
  try {
    const { user } = await requireApiSession(["client"])
    const data = await listBookableEventTypesForClient(user)
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireApiSession(["client"])
    const body = clientBookingCreateSchema.parse(await request.json())
    const booking = await createBookingForClient(user, body)
    return NextResponse.json({ data: booking }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
