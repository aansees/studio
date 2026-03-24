import { NextResponse } from "next/server"

import { env } from "@/lib/env"
import { errorResponse } from "@/lib/http"
import { applyRateLimit } from "@/lib/security/rate-limit"
import { requireApiSession } from "@/lib/session"
import {
  PROJECT_CHAT_PAGE_SIZE,
  canAccessProjectChat,
  createProjectChatMessage,
  getProjectChatMessages,
} from "@/lib/services/project-chat"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const { user } = await requireApiSession()
    const allowed = await canAccessProjectChat(user, projectId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const before = searchParams.get("before")
    const requestedLimit = Number(searchParams.get("limit") ?? PROJECT_CHAT_PAGE_SIZE)
    const limit = Math.max(
      1,
      Math.min(
        Number.isFinite(requestedLimit) ? requestedLimit : PROJECT_CHAT_PAGE_SIZE,
        PROJECT_CHAT_PAGE_SIZE,
      ),
    )

    const page = await getProjectChatMessages(projectId, {
      before,
      limit,
    })

    return NextResponse.json(page)
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
    const allowed = await canAccessProjectChat(user, projectId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rateLimit = await applyRateLimit({
      key: `rate:project-chat:post:${projectId}:${user.id}`,
      limit: 60,
      windowSeconds: 60,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please wait before sending again." },
        {
          status: 429,
          headers: {
            "retry-after": String(rateLimit.resetAfterSeconds),
            "x-ratelimit-remaining": String(rateLimit.remaining),
          },
        },
      )
    }

    const payload = (await request.json()) as {
      text?: string
      replyToMessageId?: string
    }

    const message = await createProjectChatMessage(user, projectId, {
      text: String(payload?.text ?? ""),
      replyToMessageId:
        typeof payload?.replyToMessageId === "string" &&
        payload.replyToMessageId.trim().length > 0
          ? payload.replyToMessageId.trim()
          : undefined,
    })

    return NextResponse.json(
      {
        message,
        queue: {
          redisEnabled:
            Boolean(env.UPSTASH_REDIS_REST_URL) &&
            Boolean(env.UPSTASH_REDIS_REST_TOKEN),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    return errorResponse(error)
  }
}
