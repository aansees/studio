import { and, desc, eq, isNull } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { notification } from "@/lib/db/schema"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"

export async function GET(request: Request) {
  try {
    const { user } = await requireApiSession()
    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get("unread") === "true"

    const whereClause = unreadOnly
      ? and(eq(notification.userId, user.id), isNull(notification.readAt))
      : eq(notification.userId, user.id)

    const data = await db
      .select()
      .from(notification)
      .where(whereClause)
      .orderBy(desc(notification.createdAt))
      .limit(100)

    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error)
  }
}
