import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { notification } from "@/lib/db/schema"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  try {
    const { user } = await requireApiSession()
    const { notificationId } = await params

    await db
      .update(notification)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notification.id, notificationId),
          eq(notification.userId, user.id),
        ),
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
