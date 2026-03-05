import { NextResponse } from "next/server"
import { z } from "zod"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { createProjectAsAdmin, listProjectsForUser } from "@/lib/services/projects"

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["draft", "ongoing", "on_hold", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  projectLeadId: z.string().optional(),
  clientId: z.string().optional(),
  teamMemberIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
  devLinks: z.string().optional(),
  credentials: z.string().optional(),
})

export async function GET() {
  try {
    const { user } = await requireApiSession()
    const projects = await listProjectsForUser(user)
    return NextResponse.json({ data: projects })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const body = createProjectSchema.parse(await request.json())
    const projectId = await createProjectAsAdmin(user, body)
    return NextResponse.json({ projectId }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
