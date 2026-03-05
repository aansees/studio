import { InferRealtimeEvents, Realtime } from "@upstash/realtime"
import z from "zod"

import { redis } from "@/lib/redis"

const message = z.object({
  id: z.string(),
  sender: z.string(),
  senderRole: z.enum(["admin", "developer", "client"]),
  displayName: z.string(),
  text: z.string(),
  timestamp: z.number(),
  roomId: z.string(),
  taskId: z.string(),
  replyToMessageId: z.string().optional(),
})

const presence = z.object({
  displayName: z.string().optional(),
  username: z.string().optional(),
  avatar: z.string().url().optional(),
})

const schema = {
  chat: {
    message,
    join: presence,
    leave: z.object({}).optional(),
    destroy: z.object({
      isDestroyed: z.literal(true),
    }),
  },
}

export const realtime = new Realtime({
  schema,
  redis: redis ?? undefined,
  history: {
    maxLength: 500,
    expireAfterSecs: 3600,
  },
})

export type RealtimeEvents = InferRealtimeEvents<typeof realtime>
export type MessageEvent = z.infer<typeof message>
