import { InferRealtimeEvents, Realtime } from "@upstash/realtime"
import z from "zod"

import { redis } from "@/lib/redis"

const attachment = z.object({
  id: z.string(),
  kind: z.enum(["image", "audio"]),
  fileName: z.string().optional(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  url: z.string(),
  durationMs: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
})

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
  attachments: z.array(attachment).default([]),
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
export type MessageAttachmentEvent = z.infer<typeof attachment>
