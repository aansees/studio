import { NextResponse } from "next/server"
import { z } from "zod"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { createTaskAsAdmin, listTasksForUser } from "@/lib/services/tasks"

const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(["feature", "bug", "improvement", "research", "support"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().optional(),
  assigneeIds: z.array(z.string().min(1)).optional(),
  status: z.enum(["todo", "in_progress", "review", "blocked", "done"]).optional(),
  dueDate: z.coerce.date().optional(),
})

export async function GET(request: Request) {
  try {
    const { user } = await requireApiSession()
    if (user.role === "client") {
      return NextResponse.json({ data: [] })
    }

    const url = new URL(request.url)
    const projectId = url.searchParams.get("projectId") ?? undefined
    const tasks = await listTasksForUser(user, projectId)
    return NextResponse.json({ data: tasks })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const body = createTaskSchema.parse(await request.json())
    const taskId = await createTaskAsAdmin(user, body)
    return NextResponse.json({ taskId }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
