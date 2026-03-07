import { NextResponse } from "next/server"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { loadTaskAttachmentBinary } from "@/lib/services/chat"
import { canUserChatOnTask } from "@/lib/services/tasks"

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
        "content-disposition": `inline; filename="${attachment.fileName ?? attachment.id}"`,
        "content-length": String(attachment.sizeBytes),
        "content-type": attachment.mimeType,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
