import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { project, projectMember, task } from "@/lib/db/schema"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { canAccessProject } from "@/lib/services/access-control"
import { getProjectByIdForUser, updateProjectByManager } from "@/lib/services/projects"

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "ongoing", "on_hold", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  projectLeadId: z.string().optional(),
  notes: z.string().optional(),
  devLinks: z.string().optional(),
  credentials: z.string().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const { user } = await requireApiSession()
    const data = await getProjectByIdForUser(projectId, user)
    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const { user } = await requireApiSession()
    const body = updateProjectSchema.parse(await request.json())
    await updateProjectByManager(user, projectId, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const { user } = await requireApiSession(["admin"])
    const allowed = await canAccessProject(user, projectId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.delete(task).where(eq(task.projectId, projectId))
    await db.delete(projectMember).where(eq(projectMember.projectId, projectId))
    await db.delete(project).where(eq(project.id, projectId))

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
