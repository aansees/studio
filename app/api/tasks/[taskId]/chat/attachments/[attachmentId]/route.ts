import { NextResponse } from "next/server"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { sanitizeAttachmentFileName } from "@/lib/services/chat-attachments"
import { loadTaskAttachmentBinary } from "@/lib/services/chat"
import { canUserChatOnTask } from "@/lib/services/tasks"

function encodeRfc5987Value(value: string) {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function buildInlineContentDisposition(fileName: string) {
  const safeFileName = sanitizeAttachmentFileName(fileName, "attachment")
    .replace(/[^\x20-\x7E]+/g, "_")
    .replace(/["\\]/g, "_")

  return `inline; filename="${safeFileName}"; filename*=UTF-8''${encodeRfc5987Value(
    safeFileName,
  )}`
}

export async function GET(
  _request: Request,
  context: { params: Promise<unknown> },
) {
  try {
    const { taskId, attachmentId } = (await context.params) as {
      taskId: string
      attachmentId: string
    }
    const { user } = await requireApiSession()
    const allowed = await canUserChatOnTask(user, taskId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const attachment = await loadTaskAttachmentBinary(taskId, attachmentId)
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(attachment.binary), {
      status: 200,
      headers: {
        "cache-control": "private, max-age=31536000, immutable",
        "content-disposition": buildInlineContentDisposition(
          attachment.fileName ?? attachment.id,
        ),
        "content-length": String(attachment.sizeBytes),
        "content-type": attachment.mimeType,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
