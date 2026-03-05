import { NextResponse } from "next/server"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { getDashboardOverview } from "@/lib/services/dashboard"

export async function GET() {
  try {
    const { user } = await requireApiSession()
    const overview = await getDashboardOverview(user)

    return NextResponse.json({
      data: overview,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
