import { NextResponse } from "next/server"
import { z } from "zod"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { setUserRoleAsAdmin } from "@/lib/services/team"

const roleSchema = z.object({
  role: z.enum(["developer", "client"]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { user } = await requireApiSession(["admin"])
    const { userId } = await params
    const body = roleSchema.parse(await request.json())
    await setUserRoleAsAdmin(user, userId, body.role)
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
