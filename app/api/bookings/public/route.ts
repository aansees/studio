import { NextResponse } from "next/server"

import { publicBookingCreateSchema } from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import {
  getRequestIp,
  requireApiRateLimit,
} from "@/lib/security/api-rate-limit"
import {
  createBookingForGuest,
  listBookableEventTypesForPublic,
} from "@/lib/services/bookings"

export async function GET(request: Request) {
  try {
    await requireApiRateLimit({
      key: `bookings:public:list:${getRequestIp(request)}`,
      limit: 30,
      windowSeconds: 60,
    })
    const data = await listBookableEventTypesForPublic()
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = publicBookingCreateSchema.parse(await request.json())
    await requireApiRateLimit({
      key: `bookings:public:create:${getRequestIp(request)}:${body.attendeeEmail.toLowerCase()}`,
      limit: 3,
      windowSeconds: 15 * 60,
    })
    const booking = await createBookingForGuest(body)
    return NextResponse.json({ data: booking }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
