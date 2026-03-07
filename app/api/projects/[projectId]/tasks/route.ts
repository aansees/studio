import { NextResponse } from "next/server"
import { z } from "zod"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { canAccessProject } from "@/lib/services/access-control"
import { createTaskByManager, listProjectTasksForUser } from "@/lib/services/tasks"

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(["feature", "bug", "improvement", "research", "support"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "blocked", "done"]).optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.number().int().min(1).optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const { user } = await requireApiSession()
    const allowed = await canAccessProject(user, projectId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const tasks = await listProjectTasksForUser(user, projectId)
    return NextResponse.json({ data: tasks })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const { user } = await requireApiSession()
    const body = createTaskSchema.parse(await request.json())
    const taskId = await createTaskByManager(user, { ...body, projectId })
    return NextResponse.json({ taskId }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
