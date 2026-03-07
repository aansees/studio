import { NextResponse } from "next/server"

import { errorResponse } from "@/lib/http"
import { applyRateLimit } from "@/lib/security/rate-limit"
import { requireApiSession } from "@/lib/session"
import { prepareChatAttachments } from "@/lib/services/chat-attachments"
import { buildTaskRoomId, enqueueChatMessage, getTaskChatMessages } from "@/lib/services/chat"
import { canUserChatOnTask } from "@/lib/services/tasks"

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

    const formData = await request.formData()
    const rawText = String(formData.get("text") ?? "")
    const messageText = rawText.trim().slice(0, 4000)
    const rawReplyToMessageId = formData.get("replyToMessageId")
    const replyToMessageId =
      typeof rawReplyToMessageId === "string" && rawReplyToMessageId.trim().length > 0
        ? rawReplyToMessageId.trim()
        : undefined
    const attachmentFiles = formData
      .getAll("attachments")
      .filter((item): item is File => item instanceof File)

    const attachments = await prepareChatAttachments(attachmentFiles)

    if (messageText.length === 0 && attachments.length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty without attachments" },
        { status: 400 },
      )
    }

    if (replyToMessageId) {
      const recentMessages = await getTaskChatMessages(taskId, 500)
      const replyExists = recentMessages.some((message) => message.id === replyToMessageId)
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
      replyToMessageId,
      attachments: [],
    }

    const message = await enqueueChatMessage(payload, attachments)
    return NextResponse.json({ messageId, message }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
