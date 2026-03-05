import { NextResponse } from "next/server"
import { z } from "zod"

import { errorResponse } from "@/lib/http"
import { applyRateLimit } from "@/lib/security/rate-limit"
import { requireApiSession } from "@/lib/session"
import { buildTaskRoomId, enqueueChatMessage, getTaskChatMessages } from "@/lib/services/chat"
import { canUserChatOnTask } from "@/lib/services/tasks"

const createMessageSchema = z.object({
  text: z.string().min(1).max(4000),
  replyToMessageId: z.string().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params
    const { user } = await requireApiSession()
    const allowed = await canUserChatOnTask(user, taskId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const messages = await getTaskChatMessages(taskId)
    return NextResponse.json({ data: messages })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params
    const { user } = await requireApiSession()
    const allowed = await canUserChatOnTask(user, taskId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rateLimit = await applyRateLimit({
      key: `rate:chat:post:${user.id}`,
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

    const body = createMessageSchema.parse(await request.json())
    const messageText = body.text.trim()
    if (messageText.length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    if (body.replyToMessageId) {
      const recentMessages = await getTaskChatMessages(taskId, 500)
      const replyExists = recentMessages.some((message) => message.id === body.replyToMessageId)
      if (!replyExists) {
        return NextResponse.json({ error: "Reply target not found" }, { status: 400 })
      }
    }

    const messageId = crypto.randomUUID()
    const payload = {
      id: messageId,
      sender: user.id,
      senderRole: user.role,
      displayName: user.name,
      text: messageText,
      timestamp: Date.now(),
      roomId: buildTaskRoomId(taskId),
      taskId,
      replyToMessageId: body.replyToMessageId,
    }

    await enqueueChatMessage(payload)
    return NextResponse.json({ messageId }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
