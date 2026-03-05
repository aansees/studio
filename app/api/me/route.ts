import { NextResponse } from "next/server"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"

export async function GET() {
  try {
    const { user } = await requireApiSession()
    return NextResponse.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}
