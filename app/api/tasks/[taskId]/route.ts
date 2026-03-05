import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { task } from "@/lib/db/schema"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { canAccessTask } from "@/lib/services/access-control"
import { updateTaskWithPermissions } from "@/lib/services/tasks"

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
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
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params
    const { user } = await requireApiSession()
    const allowed = await canAccessTask(user, taskId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [record] = await db.select().from(task).where(eq(task.id, taskId)).limit(1)
    if (!record) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    return NextResponse.json({ data: record })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params
    const { user } = await requireApiSession()
    const body = updateTaskSchema.parse(await request.json())
    await updateTaskWithPermissions(user, taskId, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params
    await requireApiSession(["admin"])
    await db.delete(task).where(eq(task.id, taskId))
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
