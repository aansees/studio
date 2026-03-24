import { createHash } from "crypto"
import { and, desc, eq, inArray, lt, or } from "drizzle-orm"

import { db } from "@/lib/db"
import { project, projectChatMessage, projectMember } from "@/lib/db/schema"
import { env } from "@/lib/env"
import { redis } from "@/lib/redis"
import { type ProjectMessageEvent, realtime } from "@/lib/realtime"
import type { SessionUser } from "@/lib/session"
import { isAdmin } from "@/lib/services/access-control"

const PROJECT_CHAT_DIRTY_ROOMS_KEY = "project-chat:dirty-rooms"
const PROJECT_CHAT_MAX_PENDING_MESSAGES = 50
const PROJECT_CHAT_MAX_PENDING_BYTES = 20 * 1024 * 1024
const PROJECT_CHAT_MAX_PENDING_AGE_MS = 5 * 60 * 1000
const PROJECT_CHAT_LOCK_TTL_SECONDS = 30

export const PROJECT_CHAT_PAGE_SIZE = 10

type ProjectChatCursor = {
  id: string
  timestamp: number
}

type ProjectChatRoomMeta = {
  count: number
  bytes: number
  oldestTimestamp: number
  updatedAt: number
}

function normalizeRole(value: string): ProjectMessageEvent["senderRole"] {
  if (value === "admin" || value === "developer" || value === "client") {
    return value
  }

  return "developer"
}

function roomPendingListKey(roomId: string) {
  return `project-chat:pending:${roomId}`
}

function roomMetaKey(roomId: string) {
  return `project-chat:meta:${roomId}`
}

function roomFlushLockKey(roomId: string) {
  return `project-chat:flush-lock:${roomId}`
}

function compareProjectMessages(
  left: Pick<ProjectMessageEvent, "id" | "timestamp">,
  right: Pick<ProjectMessageEvent, "id" | "timestamp">,
) {
  if (left.timestamp !== right.timestamp) {
    return left.timestamp - right.timestamp
  }

  return left.id.localeCompare(right.id)
}

function isBeforeCursor(
  message: Pick<ProjectMessageEvent, "id" | "timestamp">,
  cursor: ProjectChatCursor,
) {
  return compareProjectMessages(message, cursor) < 0
}

function encodeProjectChatCursor(
  message: Pick<ProjectMessageEvent, "id" | "timestamp">,
) {
  return `${message.timestamp}:${message.id}`
}

function decodeProjectChatCursor(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const separatorIndex = value.indexOf(":")
  if (separatorIndex === -1) {
    return null
  }

  const timestamp = Number(value.slice(0, separatorIndex))
  const id = value.slice(separatorIndex + 1).trim()

  if (!Number.isFinite(timestamp) || id.length === 0) {
    return null
  }

  return {
    id,
    timestamp,
  } satisfies ProjectChatCursor
}

function deserializeProjectMessage(value: unknown): ProjectMessageEvent | null {
  try {
    if (!value) {
      return null
    }

    const payload =
      typeof value === "string"
        ? (JSON.parse(value) as ProjectMessageEvent)
        : (value as ProjectMessageEvent)

    if (
      typeof payload.id !== "string" ||
      typeof payload.projectId !== "string" ||
      typeof payload.roomId !== "string" ||
      typeof payload.sender !== "string" ||
      typeof payload.displayName !== "string" ||
      typeof payload.text !== "string" ||
      typeof payload.timestamp !== "number"
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

function parseRoomMeta(value: Record<string, unknown> | null | undefined) {
  return {
    count: Number(value?.count ?? 0),
    bytes: Number(value?.bytes ?? 0),
    oldestTimestamp: Number(value?.oldestTimestamp ?? 0),
    updatedAt: Number(value?.updatedAt ?? 0),
  } satisfies ProjectChatRoomMeta
}

function shouldFlushRoom(meta: ProjectChatRoomMeta, now = Date.now()) {
  if (meta.count <= 0 || meta.oldestTimestamp <= 0) {
    return false
  }

  return (
    meta.count >= PROJECT_CHAT_MAX_PENDING_MESSAGES ||
    meta.bytes >= PROJECT_CHAT_MAX_PENDING_BYTES ||
    now - meta.oldestTimestamp >= PROJECT_CHAT_MAX_PENDING_AGE_MS
  )
}

async function loadRoomMeta(roomId: string) {
  if (!redis) {
    return {
      count: 0,
      bytes: 0,
      oldestTimestamp: 0,
      updatedAt: 0,
    } satisfies ProjectChatRoomMeta
  }

  const raw = await redis.hgetall<Record<string, unknown>>(roomMetaKey(roomId))
  return parseRoomMeta(raw)
}

async function loadPendingProjectMessages(roomId: string) {
  if (!redis) {
    return [] as ProjectMessageEvent[]
  }

  const rawMessages = await redis.lrange<unknown[]>(roomPendingListKey(roomId), 0, -1)
  return (rawMessages ?? [])
    .map((value) => deserializeProjectMessage(value))
    .filter((value): value is ProjectMessageEvent => value !== null)
    .sort(compareProjectMessages)
}

async function insertProjectMessages(messages: ProjectMessageEvent[]) {
  if (messages.length === 0) {
    return 0
  }

  const existingRows = await db
    .select({ id: projectChatMessage.id })
    .from(projectChatMessage)
    .where(inArray(projectChatMessage.id, messages.map((message) => message.id)))

  const existingIds = new Set(existingRows.map((row) => row.id))
  const rowsToInsert = messages
    .filter((message) => !existingIds.has(message.id))
    .map((message) => ({
      id: message.id,
      roomId: message.roomId,
      projectId: message.projectId,
      senderId: message.sender,
      senderRole: message.senderRole,
      displayName: message.displayName,
      text: message.text,
      replyToMessageId: message.replyToMessageId ?? null,
      createdAtMs: message.timestamp,
      createdAt: new Date(message.timestamp),
    }))

  if (rowsToInsert.length === 0) {
    return 0
  }

  await db.insert(projectChatMessage).values(rowsToInsert)
  return rowsToInsert.length
}

async function acquireRoomFlushLock(roomId: string) {
  if (!redis) {
    return true
  }

  const result = await redis.set(roomFlushLockKey(roomId), "1", {
    ex: PROJECT_CHAT_LOCK_TTL_SECONDS,
    nx: true,
  })

  return result === "OK"
}

async function releaseRoomFlushLock(roomId: string) {
  if (!redis) {
    return
  }

  await redis.del(roomFlushLockKey(roomId))
}

export function buildProjectRoomId(projectId: string) {
  const fingerprint = createHash("sha256")
    .update(`${env.BETTER_AUTH_SECRET}:project:${projectId}`)
    .digest("hex")
    .slice(0, 16)

  return `project:${projectId}:${fingerprint}`
}

export async function canAccessProjectChat(
  currentUser: SessionUser,
  projectId: string,
) {
  const [existingProject] = await db
    .select({
      id: project.id,
      clientId: project.clientId,
      projectLeadId: project.projectLeadId,
    })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)

  if (!existingProject) {
    return false
  }

  if (isAdmin(currentUser.role)) {
    return true
  }

  if (currentUser.role === "developer") {
    return existingProject.projectLeadId === currentUser.id
  }

  if (currentUser.role === "client") {
    if (existingProject.clientId === currentUser.id) {
      return true
    }

    const [membership] = await db
      .select({ userId: projectMember.userId })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, currentUser.id),
          eq(projectMember.role, "client"),
        ),
      )
      .limit(1)

    return Boolean(membership)
  }

  return false
}

export async function enqueueProjectChatMessage(message: ProjectMessageEvent) {
  if (!redis) {
    await insertProjectMessages([message])
    await realtime.channel(message.roomId).emit("projectChat.message", message)
    return message
  }

  const serialized = JSON.stringify(message)
  const serializedBytes = Buffer.byteLength(serialized, "utf8")
  const now = Date.now()
  const currentMeta = await loadRoomMeta(message.roomId)
  const nextMeta = {
    count: currentMeta.count + 1,
    bytes: currentMeta.bytes + serializedBytes,
    oldestTimestamp:
      currentMeta.oldestTimestamp > 0
        ? currentMeta.oldestTimestamp
        : message.timestamp,
    updatedAt: now,
  } satisfies ProjectChatRoomMeta

  await redis
    .pipeline()
    .rpush(roomPendingListKey(message.roomId), serialized)
    .hset(roomMetaKey(message.roomId), {
      count: nextMeta.count,
      bytes: nextMeta.bytes,
      oldestTimestamp: nextMeta.oldestTimestamp,
      updatedAt: nextMeta.updatedAt,
    })
    .zadd(PROJECT_CHAT_DIRTY_ROOMS_KEY, {
      score: nextMeta.oldestTimestamp,
      member: message.roomId,
    })
    .expire(roomPendingListKey(message.roomId), 60 * 60)
    .expire(roomMetaKey(message.roomId), 60 * 60)
    .exec()

  await realtime.channel(message.roomId).emit("projectChat.message", message)

  if (shouldFlushRoom(nextMeta, now)) {
    await flushProjectChatRoom(message.roomId)
  }

  return message
}

export async function flushProjectChatRoom(roomId: string) {
  if (!redis) {
    return { roomId, messages: 0 }
  }

  const lockAcquired = await acquireRoomFlushLock(roomId)
  if (!lockAcquired) {
    return { roomId, messages: 0 }
  }

  try {
    const pendingMessages = await loadPendingProjectMessages(roomId)
    if (pendingMessages.length === 0) {
      await Promise.all([
        redis.del(roomMetaKey(roomId)),
        redis.zrem(PROJECT_CHAT_DIRTY_ROOMS_KEY, roomId),
      ])

      return { roomId, messages: 0 }
    }

    const insertedMessages = await insertProjectMessages(pendingMessages)

    await Promise.all([
      redis.del(roomPendingListKey(roomId)),
      redis.del(roomMetaKey(roomId)),
      redis.zrem(PROJECT_CHAT_DIRTY_ROOMS_KEY, roomId),
    ])

    return {
      roomId,
      messages: insertedMessages,
    }
  } finally {
    await releaseRoomFlushLock(roomId)
  }
}

export async function maybeFlushProjectChatRoom(roomId: string) {
  if (!redis) {
    return { roomId, messages: 0, flushed: false }
  }

  const meta = await loadRoomMeta(roomId)
  if (!shouldFlushRoom(meta)) {
    return { roomId, messages: 0, flushed: false }
  }

  const result = await flushProjectChatRoom(roomId)
  return {
    ...result,
    flushed: result.messages > 0,
  }
}

export async function flushDueProjectChatRooms() {
  if (!redis) {
    return { rooms: 0, messages: 0 }
  }

  const roomIds = await redis.zrange<string[]>(PROJECT_CHAT_DIRTY_ROOMS_KEY, 0, -1)
  if (!roomIds || roomIds.length === 0) {
    return { rooms: 0, messages: 0 }
  }

  let flushedRooms = 0
  let persistedMessages = 0

  for (const roomId of roomIds) {
    const meta = await loadRoomMeta(roomId)
    if (!shouldFlushRoom(meta)) {
      continue
    }

    const result = await flushProjectChatRoom(roomId)
    if (result.messages > 0) {
      flushedRooms += 1
      persistedMessages += result.messages
    }
  }

  return {
    rooms: flushedRooms,
    messages: persistedMessages,
  }
}

async function projectChatMessageExists(projectId: string, messageId: string) {
  const [existingMessage] = await db
    .select({ id: projectChatMessage.id })
    .from(projectChatMessage)
    .where(
      and(
        eq(projectChatMessage.projectId, projectId),
        eq(projectChatMessage.id, messageId),
      ),
    )
    .limit(1)

  if (existingMessage) {
    return true
  }

  const pendingMessages = await loadPendingProjectMessages(buildProjectRoomId(projectId))
  return pendingMessages.some((message) => message.id === messageId)
}

export async function createProjectChatMessage(
  currentUser: SessionUser,
  projectId: string,
  input: {
    text: string
    replyToMessageId?: string
  },
) {
  const text = input.text.trim().slice(0, 4000)
  if (text.length === 0) {
    throw new Error("Message cannot be empty")
  }

  if (input.replyToMessageId) {
    const replyExists = await projectChatMessageExists(projectId, input.replyToMessageId)
    if (!replyExists) {
      throw new Error("Reply target not found")
    }
  }

  const message: ProjectMessageEvent = {
    id: crypto.randomUUID(),
    sender: currentUser.id,
    senderRole: currentUser.role,
    displayName: currentUser.name,
    text,
    timestamp: Date.now(),
    roomId: buildProjectRoomId(projectId),
    projectId,
    replyToMessageId: input.replyToMessageId,
  }

  return enqueueProjectChatMessage(message)
}

function mapProjectChatRow(
  row: {
    id: string
    roomId: string
    sender: string
    senderRole: string
    displayName: string
    text: string
    timestamp: number
    projectId: string
    replyToMessageId: string | null
  },
) {
  return {
    id: row.id,
    roomId: row.roomId,
    sender: row.sender,
    senderRole: normalizeRole(row.senderRole),
    displayName: row.displayName,
    text: row.text,
    timestamp: row.timestamp,
    projectId: row.projectId,
    replyToMessageId: row.replyToMessageId ?? undefined,
  } satisfies ProjectMessageEvent
}

export async function getProjectChatMessages(
  projectId: string,
  options?: {
    limit?: number
    before?: string | null
  },
) {
  const limit = Math.max(1, Math.min(options?.limit ?? PROJECT_CHAT_PAGE_SIZE, PROJECT_CHAT_PAGE_SIZE))
  const before = decodeProjectChatCursor(options?.before)
  const roomId = buildProjectRoomId(projectId)

  await maybeFlushProjectChatRoom(roomId)

  const pendingMessages = await loadPendingProjectMessages(roomId)
  const pendingRelevant = before
    ? pendingMessages.filter((message) => isBeforeCursor(message, before))
    : pendingMessages

  const dbLimit = limit + pendingRelevant.length

  const dbRows = await db
    .select({
      id: projectChatMessage.id,
      roomId: projectChatMessage.roomId,
      sender: projectChatMessage.senderId,
      senderRole: projectChatMessage.senderRole,
      displayName: projectChatMessage.displayName,
      text: projectChatMessage.text,
      timestamp: projectChatMessage.createdAtMs,
      projectId: projectChatMessage.projectId,
      replyToMessageId: projectChatMessage.replyToMessageId,
    })
    .from(projectChatMessage)
    .where(
      before
        ? and(
            eq(projectChatMessage.projectId, projectId),
            or(
              lt(projectChatMessage.createdAtMs, before.timestamp),
              and(
                eq(projectChatMessage.createdAtMs, before.timestamp),
                lt(projectChatMessage.id, before.id),
              ),
            ),
          )
        : eq(projectChatMessage.projectId, projectId),
    )
    .orderBy(desc(projectChatMessage.createdAtMs), desc(projectChatMessage.id))
    .limit(dbLimit + 1)

  const dbHasOverflow = dbRows.length > dbLimit
  const dbRelevant = dbRows
    .slice(0, dbLimit)
    .map((row) => mapProjectChatRow(row))
    .reverse()

  const deduped = new Map<string, ProjectMessageEvent>()
  for (const message of [...dbRelevant, ...pendingRelevant]) {
    deduped.set(message.id, message)
  }

  const combined = Array.from(deduped.values()).sort(compareProjectMessages)
  const messages = combined.slice(-limit)
  const hasMore = dbHasOverflow || combined.length > limit

  return {
    messages,
    hasMore,
    nextCursor:
      hasMore && messages.length > 0
        ? encodeProjectChatCursor(messages[0])
        : null,
  }
}
