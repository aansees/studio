import { inArray } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { task } from "@/lib/db/schema"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { bulkDeleteTasksAsAdmin } from "@/lib/services/tasks"

const bulkStatusSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  status: z.enum(["todo", "in_progress", "review", "blocked", "done"]),
})

const bulkDeleteSchema = z.object({
  taskIds: z.array(z.string()).min(1),
})

export async function PATCH(request: Request) {
  try {
    await requireApiSession(["admin"])
    const body = bulkStatusSchema.parse(await request.json())

    await db
      .update(task)
      .set({
        status: body.status,
        completedAt: body.status === "done" ? new Date() : null,
        startedAt: body.status === "in_progress" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(inArray(task.id, body.taskIds))

    return NextResponse.json({ success: true })
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
