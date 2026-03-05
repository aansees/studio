import { NextResponse } from "next/server"
import { z } from "zod"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { createDeveloperAsAdmin, listTeamAsAdmin } from "@/lib/services/team"

const createDeveloperSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function GET() {
  try {
    const { user } = await requireApiSession(["admin"])
    const team = await listTeamAsAdmin(user)
    return NextResponse.json({ data: team })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const body = createDeveloperSchema.parse(await request.json())
    const developerId = await createDeveloperAsAdmin(user, body)
    return NextResponse.json({ developerId }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
