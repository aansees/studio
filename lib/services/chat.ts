import { createHash } from "crypto"
import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { taskChatMessage } from "@/lib/db/schema"
import { env } from "@/lib/env"
import { redis } from "@/lib/redis"
import { type MessageEvent, realtime } from "@/lib/realtime"

const DIRTY_ROOMS_KEY = "chat:dirty-rooms"
const ROOM_TTL_SECONDS = 60 * 60
const FLUSH_MIN_AGE_MS = 30 * 60 * 1000
const FLUSH_MAX_AGE_MS = 60 * 60 * 1000

function normalizeRole(value: string): MessageEvent["senderRole"] {
  if (value === "admin" || value === "developer" || value === "client") {
    return value
  }
  return "developer"
}

function roomPendingListKey(roomId: string) {
  return `chat:pending:${roomId}`
}

export function buildTaskRoomId(taskId: string) {
  const fingerprint = createHash("sha256")
    .update(`${env.BETTER_AUTH_SECRET}:${taskId}`)
    .digest("hex")
    .slice(0, 16)

  return `task:${taskId}:${fingerprint}`
}

export async function enqueueChatMessage(message: MessageEvent) {
  if (redis) {
    const listKey = roomPendingListKey(message.roomId)
    await redis.rpush(listKey, JSON.stringify(message))
    await redis.expire(listKey, ROOM_TTL_SECONDS)
    await redis.zadd(DIRTY_ROOMS_KEY, {
      member: message.roomId,
      score: Date.now(),
    })
  } else {
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
  }

  await realtime.channel(message.roomId).emit("chat.message", message)
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

  const dbMessages = rows.reverse().map((row) => ({
    id: row.id,
    roomId: row.roomId,
    sender: row.sender,
    senderRole: normalizeRole(row.senderRole),
    displayName: row.displayName,
    text: row.text,
    taskId: row.taskId,
    timestamp: row.timestamp.getTime(),
    replyToMessageId: row.replyToMessageId ?? undefined,
  }))

  if (!redis) {
    return dbMessages
  }

  const pendingRaw = await redis.lrange<string>(
    roomPendingListKey(buildTaskRoomId(taskId)),
    0,
    limit - 1,
  )

  const pendingMessages = (pendingRaw ?? [])
    .map((item) => {
      try {
        return JSON.parse(item) as MessageEvent
      } catch {
        return null
      }
    })
    .filter((item): item is MessageEvent => item !== null)

  const merged = [...dbMessages, ...pendingMessages]
  const uniqueById = new Map<string, MessageEvent>()
  for (const message of merged) {
    uniqueById.set(message.id, message)
  }

  return Array.from(uniqueById.values()).sort((a, b) => a.timestamp - b.timestamp)
}

async function flushSingleRoom(roomId: string, maxBatchSize: number) {
  if (!redis) return 0

  const listKey = roomPendingListKey(roomId)
  const rawPayloads = await redis.lrange<string>(listKey, 0, maxBatchSize - 1)
  if (!rawPayloads || rawPayloads.length === 0) {
    await redis.zrem(DIRTY_ROOMS_KEY, roomId)
    return 0
  }

  const rowsToInsert = rawPayloads
    .map((item) => {
      try {
        return JSON.parse(item) as MessageEvent
      } catch {
        return null
      }
    })
    .filter((item): item is MessageEvent => item !== null)
    .map((item) => ({
      id: item.id,
      roomId: item.roomId,
      taskId: item.taskId,
      senderId: item.sender,
      senderRole: item.senderRole,
      displayName: item.displayName,
      text: item.text,
      replyToMessageId: item.replyToMessageId ?? null,
      reactions: null,
      createdAt: new Date(item.timestamp),
    }))

  if (rowsToInsert.length > 0) {
    await db.insert(taskChatMessage).values(rowsToInsert)
  }

  await redis.ltrim(listKey, rawPayloads.length, -1)

  const remaining = (await redis.llen(listKey)) ?? 0
  if (remaining > 0) {
    await redis.zadd(DIRTY_ROOMS_KEY, { member: roomId, score: Date.now() })
  } else {
    await redis.zrem(DIRTY_ROOMS_KEY, roomId)
  }

  return rowsToInsert.length
}

type FlushOptions = {
  maxRooms?: number
  maxBatchSize?: number
}

export async function flushDueChatMessages({
  maxRooms = 25,
  maxBatchSize = 500,
}: FlushOptions = {}) {
  if (!redis) {
    return { rooms: 0, messages: 0 }
  }

  const now = Date.now()
  const dueThreshold = now - FLUSH_MIN_AGE_MS
  const staleThreshold = now - FLUSH_MAX_AGE_MS

  const dueRooms = await redis.zrange<string[]>(
    DIRTY_ROOMS_KEY,
    0,
    dueThreshold,
    { byScore: true, offset: 0, count: maxRooms },
  )

  const forcedRooms = await redis.zrange<string[]>(
    DIRTY_ROOMS_KEY,
    0,
    staleThreshold,
    { byScore: true, offset: 0, count: maxRooms },
  )

  const rooms = Array.from(new Set([...(forcedRooms ?? []), ...(dueRooms ?? [])]))

  let persistedMessages = 0
  for (const roomId of rooms) {
    const inserted = await flushSingleRoom(roomId, maxBatchSize)
    persistedMessages += inserted
  }

  return {
    rooms: rooms.length,
    messages: persistedMessages,
  }
}

export async function loadTaskMessageFromDb(messageId: string, taskId: string) {
  const [message] = await db
    .select()
    .from(taskChatMessage)
    .where(and(eq(taskChatMessage.id, messageId), eq(taskChatMessage.taskId, taskId)))
    .limit(1)
  return message ?? null
}
