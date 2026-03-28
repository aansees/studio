import { NextResponse } from "next/server"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { listBookingsForAdmin } from "@/lib/services/bookings"

export async function GET() {
  try {
    const { user } = await requireApiSession(["admin"])
    const data = await listBookingsForAdmin(user)
    return NextResponse.json(data)
  } catch (error) {
    return errorResponse(error)
  }
}
