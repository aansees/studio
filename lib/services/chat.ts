import { createHash } from "crypto"
import { and, asc, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { taskChatAttachment, taskChatMessage } from "@/lib/db/schema"
import { env } from "@/lib/env"
import {
  type MessageAttachmentEvent,
  type MessageEvent,
  realtime,
} from "@/lib/realtime"

export type PersistedChatAttachmentInput = {
  id?: string
  kind: "image" | "audio"
  fileName?: string
  mimeType: string
  sizeBytes: number
  binary: Buffer
  durationMs?: number
  width?: number
  height?: number
}

function normalizeRole(value: string): MessageEvent["senderRole"] {
  if (value === "admin" || value === "developer" || value === "client") {
    return value
  }
  return "developer"
}

function buildAttachmentUrl(taskId: string, attachmentId: string) {
  return `/api/tasks/${taskId}/chat/attachments/${attachmentId}`
}

function mapAttachmentRow(
  row: {
    id: string
    taskId: string
    kind: "image" | "audio"
    fileName: string | null
    mimeType: string
    sizeBytes: number
    durationMs: number | null
    width: number | null
    height: number | null
  },
): MessageAttachmentEvent {
  return {
    id: row.id,
    kind: row.kind as "image" | "audio",
    fileName: row.fileName ?? undefined,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    url: buildAttachmentUrl(row.taskId, row.id),
    durationMs: row.durationMs ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
  }
}

function extractDatabaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined
  }

  const directCode =
    "code" in error && typeof error.code === "string" ? error.code : undefined
  if (directCode) {
    return directCode
  }

  const cause =
    "cause" in error && error.cause && typeof error.cause === "object"
      ? error.cause
      : undefined

  return cause && "code" in cause && typeof cause.code === "string"
    ? cause.code
    : undefined
}

function isMissingChatAttachmentSchemaError(error: unknown) {
  const code = extractDatabaseErrorCode(error)
  return code === "ER_NO_SUCH_TABLE" || code === "ER_BAD_FIELD_ERROR"
}

async function insertAttachments(
  taskId: string,
  messageId: string,
  attachments: PersistedChatAttachmentInput[],
) {
  if (attachments.length === 0) {
    return [] as MessageAttachmentEvent[]
  }

  const rows = attachments.map((attachment) => {
    const id = attachment.id ?? crypto.randomUUID()

    return {
      id,
      messageId,
      taskId,
      kind: attachment.kind,
      fileName: attachment.fileName ?? null,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      durationMs: attachment.durationMs ?? null,
      width: attachment.width ?? null,
      height: attachment.height ?? null,
      storageKey: `task:${taskId}:message:${messageId}:attachment:${id}`,
      binary: attachment.binary,
    }
  })

  try {
    await db.insert(taskChatAttachment).values(rows)
  } catch (error) {
    if (isMissingChatAttachmentSchemaError(error)) {
      throw new Error(
        "Chat attachment storage is not ready. Apply the latest database migration before sending files.",
      )
    }

    throw error
  }

  return rows.map((row) =>
    mapAttachmentRow({
      ...row,
      fileName: row.fileName,
      durationMs: row.durationMs,
      width: row.width,
      height: row.height,
    }),
  )
}

export function buildTaskRoomId(taskId: string) {
  const fingerprint = createHash("sha256")
    .update(`${env.BETTER_AUTH_SECRET}:${taskId}`)
    .digest("hex")
    .slice(0, 16)

  return `task:${taskId}:${fingerprint}`
}

export async function enqueueChatMessage(
  message: MessageEvent,
  attachments: PersistedChatAttachmentInput[] = [],
) {
  await db.insert(taskChatMessage).values({
    id: message.id,
    roomId: message.roomId,
    taskId: message.taskId,
    senderId: message.sender,
    senderRole: message.senderRole,
    displayName: message.displayName,
    text: message.text,
    replyToMessageId: message.replyToMessageId ?? null,
    reactions: null,
    createdAt: new Date(message.timestamp),
  })

  const persistedAttachments = await insertAttachments(
    message.taskId,
    message.id,
    attachments,
  )

  const emittedMessage: MessageEvent = {
    ...message,
    attachments: persistedAttachments,
  }

  await realtime.channel(message.roomId).emit("chat.message", emittedMessage)

  return emittedMessage
}

export async function getTaskChatMessages(taskId: string, limit = 100) {
  const rows = await db
    .select({
      id: taskChatMessage.id,
      roomId: taskChatMessage.roomId,
      sender: taskChatMessage.senderId,
      senderRole: taskChatMessage.senderRole,
      displayName: taskChatMessage.displayName,
      text: taskChatMessage.text,
      timestamp: taskChatMessage.createdAt,
      taskId: taskChatMessage.taskId,
      replyToMessageId: taskChatMessage.replyToMessageId,
    })
    .from(taskChatMessage)
    .where(eq(taskChatMessage.taskId, taskId))
    .orderBy(desc(taskChatMessage.createdAt))
    .limit(limit)

  const orderedRows = rows.reverse()
  if (orderedRows.length === 0) {
    return []
  }

  let attachments: Array<{
    id: string
    messageId: string
    taskId: string
    kind: "image" | "audio"
    fileName: string | null
    mimeType: string
    sizeBytes: number
    durationMs: number | null
    width: number | null
    height: number | null
    createdAt: Date
  }> = []

  try {
    attachments = await db
      .select({
        id: taskChatAttachment.id,
        messageId: taskChatAttachment.messageId,
        taskId: taskChatAttachment.taskId,
        kind: taskChatAttachment.kind,
        fileName: taskChatAttachment.fileName,
        mimeType: taskChatAttachment.mimeType,
        sizeBytes: taskChatAttachment.sizeBytes,
        durationMs: taskChatAttachment.durationMs,
        width: taskChatAttachment.width,
        height: taskChatAttachment.height,
        createdAt: taskChatAttachment.createdAt,
      })
      .from(taskChatAttachment)
      .where(
        and(
          eq(taskChatAttachment.taskId, taskId),
          inArray(
            taskChatAttachment.messageId,
            orderedRows.map((row) => row.id),
          ),
        ),
      )
      .orderBy(asc(taskChatAttachment.createdAt))
      .then((rows) =>
        rows.map((row) => ({
          ...row,
          kind: row.kind as "image" | "audio",
        })),
      )
  } catch (error) {
    if (!isMissingChatAttachmentSchemaError(error)) {
      throw error
    }
  }

  const attachmentsByMessageId = new Map<string, MessageAttachmentEvent[]>()
  for (const attachment of attachments) {
    const existing = attachmentsByMessageId.get(attachment.messageId) ?? []
    existing.push(
      mapAttachmentRow({
        ...attachment,
        kind: attachment.kind as "image" | "audio",
      }),
    )
    attachmentsByMessageId.set(attachment.messageId, existing)
  }

  return orderedRows.map((row) => ({
    id: row.id,
    roomId: row.roomId,
    sender: row.sender,
    senderRole: normalizeRole(row.senderRole),
    displayName: row.displayName,
    text: row.text,
    taskId: row.taskId,
    timestamp: row.timestamp.getTime(),
    replyToMessageId: row.replyToMessageId ?? undefined,
    attachments: attachmentsByMessageId.get(row.id) ?? [],
  }))
}

export async function loadTaskMessageFromDb(messageId: string, taskId: string) {
  const [message] = await db
    .select()
    .from(taskChatMessage)
    .where(and(eq(taskChatMessage.id, messageId), eq(taskChatMessage.taskId, taskId)))
    .limit(1)
  return message ?? null
}

export async function loadTaskAttachmentBinary(taskId: string, attachmentId: string) {
  let attachment:
    | {
        id: string
        mimeType: string
        fileName: string | null
        binary: Buffer
        sizeBytes: number
      }
    | undefined

  try {
    ;[attachment] = await db
      .select({
        id: taskChatAttachment.id,
        mimeType: taskChatAttachment.mimeType,
        fileName: taskChatAttachment.fileName,
        binary: taskChatAttachment.binary,
        sizeBytes: taskChatAttachment.sizeBytes,
      })
      .from(taskChatAttachment)
      .where(
        and(
          eq(taskChatAttachment.taskId, taskId),
          eq(taskChatAttachment.id, attachmentId),
        ),
      )
      .limit(1)
  } catch (error) {
    if (isMissingChatAttachmentSchemaError(error)) {
      return null
    }

    throw error
  }

  return attachment ?? null
}
