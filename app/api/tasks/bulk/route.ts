import { NextResponse } from "next/server"
import { z } from "zod"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import {
  bulkDeleteTasksAsAdmin,
  bulkUpdateTaskStatusAsAdmin,
} from "@/lib/services/tasks"

const bulkStatusSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  status: z.enum(["todo", "in_progress", "review", "blocked", "done"]),
})

const bulkDeleteSchema = z.object({
  taskIds: z.array(z.string()).min(1),
})

export async function PATCH(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const body = bulkStatusSchema.parse(await request.json())
    const updated = await bulkUpdateTaskStatusAsAdmin(user, body.taskIds, body.status)
    return NextResponse.json({ success: true, updated })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const body = bulkDeleteSchema.parse(await request.json())
    const deleted = await bulkDeleteTasksAsAdmin(user, body.taskIds)
    return NextResponse.json({ deleted })
  } catch (error) {
    return errorResponse(error)
  }
}
