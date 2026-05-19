import { NextResponse } from "next/server"
import { z } from "zod"

import { errorResponse } from "@/lib/http"
import {
  getRequestIp,
  requireApiRateLimit,
} from "@/lib/security/api-rate-limit"
import {
  cancelBookingByManageToken,
  getBookingByManageToken,
  rescheduleBookingByManageToken,
} from "@/lib/services/bookings"

const rescheduleSchema = z.object({
  startsAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(5).max(8 * 60).nullish(),
  reason: z.string().trim().max(1000).nullish(),
})

const cancelSchema = z.object({
  reason: z.string().trim().max(1000).nullish(),
})

type RouteContext = {
  params: Promise<{ token: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params
    await requireApiRateLimit({
      key: `bookings:manage:view:${getRequestIp(request)}:${token}`,
      limit: 20,
      windowSeconds: 60,
    })
    const data = await getBookingByManageToken(token)
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params
    await requireApiRateLimit({
      key: `bookings:manage:reschedule:${getRequestIp(request)}:${token}`,
      limit: 5,
      windowSeconds: 15 * 60,
    })
    const body = rescheduleSchema.parse(await request.json())
    const data = await rescheduleBookingByManageToken({ token, ...body })
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params
    await requireApiRateLimit({
      key: `bookings:manage:cancel:${getRequestIp(request)}:${token}`,
      limit: 5,
      windowSeconds: 15 * 60,
    })
    const body = cancelSchema.parse(await request.json().catch(() => ({})))
    const data = await cancelBookingByManageToken({ token, ...body })
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}
