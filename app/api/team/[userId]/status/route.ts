import { NextResponse } from "next/server"
import { z } from "zod"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { setUserActiveStateAsAdmin } from "@/lib/services/team"

const statusSchema = z.object({
  isActive: z.boolean(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { user } = await requireApiSession(["admin"])
    const { userId } = await params
    const body = statusSchema.parse(await request.json())

    await setUserActiveStateAsAdmin(user, userId, body.isActive)

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
