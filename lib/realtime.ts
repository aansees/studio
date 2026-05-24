import z from "zod"
import type Redis from "ioredis"

import { createRedisSubscriber, redis } from "@/lib/redis"

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

const projectMessage = z.object({
  id: z.string(),
  sender: z.string(),
  senderRole: z.enum(["admin", "developer", "client"]),
  displayName: z.string(),
  text: z.string(),
  timestamp: z.number(),
  roomId: z.string(),
  projectId: z.string(),
  replyToMessageId: z.string().optional(),
})

const presence = z.object({
  displayName: z.string().optional(),
  username: z.string().optional(),
  avatar: z.string().url().optional(),
})

const destroy = z.object({
  isDestroyed: z.literal(true),
})

const eventValidators = {
  "chat.message": message,
  "chat.join": presence,
  "chat.leave": z.object({}).optional(),
  "chat.destroy": destroy,
  "projectChat.message": projectMessage,
  "projectChat.join": presence,
  "projectChat.leave": z.object({}).optional(),
  "projectChat.destroy": destroy,
}

export type MessageEvent = z.infer<typeof message>
export type MessageAttachmentEvent = z.infer<typeof attachment>
export type ProjectMessageEvent = z.infer<typeof projectMessage>
export type RealtimeEvents = {
  chat: {
    message: MessageEvent
    join: z.infer<typeof presence>
    leave?: Record<string, never>
    destroy: z.infer<typeof destroy>
  }
  projectChat: {
    message: ProjectMessageEvent
    join: z.infer<typeof presence>
    leave?: Record<string, never>
    destroy: z.infer<typeof destroy>
  }
}

type RealtimeEventName = keyof typeof eventValidators
type RealtimeEventData<T extends RealtimeEventName> = z.infer<
  (typeof eventValidators)[T]
>

export type RealtimePayload = {
  id: string
  event: string
  channel: string
  data: unknown
}

export type RealtimeSystemPayload =
  | {
      type: "connected"
      channel: string
    }
  | {
      type: "ping"
      timestamp: number
    }

type RealtimeState = {
  sequence: number
  history: Map<string, RealtimePayload[]>
  subscribers: Map<string, Set<(payload: RealtimePayload) => void>>
  redisSubscriber?: Redis | null
  redisSubscribedChannels: Set<string>
}

const globalRealtime = globalThis as typeof globalThis & {
  __agencyRealtime?: RealtimeState
}

const state =
  globalRealtime.__agencyRealtime ??
  (globalRealtime.__agencyRealtime = {
    sequence: 0,
    history: new Map(),
    subscribers: new Map(),
    redisSubscriber: undefined,
    redisSubscribedChannels: new Set(),
  })

const textEncoder = new TextEncoder()
const HISTORY_LIMIT = 500
const HISTORY_TTL_SECONDS = 60 * 60

function realtimeChannelKey(channel: string) {
  return `realtime:${channel}`
}

function realtimeStreamKey(channel: string) {
  return `realtime:stream:${channel}`
}

function createLocalEventId() {
  state.sequence += 1
  return `${Date.now()}-${state.sequence}`
}

function pushLocalHistory(payload: RealtimePayload) {
  const currentHistory = state.history.get(payload.channel) ?? []
  currentHistory.push(payload)
  state.history.set(payload.channel, currentHistory.slice(-HISTORY_LIMIT))
}

function publishLocal(payload: RealtimePayload) {
  const subscribers = state.subscribers.get(payload.channel)
  if (!subscribers) {
    return
  }

  for (const subscriber of subscribers) {
    subscriber(payload)
  }
}

function ensureRedisSubscriber() {
  if (!redis) {
    return null
  }

  if (state.redisSubscriber) {
    return state.redisSubscriber
  }

  const subscriber = createRedisSubscriber("realtime-fanout")
  if (!subscriber) {
    return null
  }

  subscriber.on("message", (_channel, rawMessage) => {
    try {
      publishLocal(JSON.parse(rawMessage) as RealtimePayload)
    } catch {
      // Ignore malformed pub/sub payloads.
    }
  })

  state.redisSubscriber = subscriber
  return subscriber
}

function parseRedisStreamPayload(
  id: string,
  fields: string[],
): RealtimePayload | null {
  const payloadIndex = fields.indexOf("payload")
  if (payloadIndex === -1) {
    return null
  }

  const rawPayload = fields[payloadIndex + 1]
  if (!rawPayload) {
    return null
  }

  try {
    const payload = JSON.parse(rawPayload) as Omit<RealtimePayload, "id">
    return {
      ...payload,
      id,
    }
  } catch {
    return null
  }
}

export function encodeSsePayload(payload: RealtimePayload | RealtimeSystemPayload) {
  return textEncoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
}

export async function replayRealtimeHistory(
  channels: string[],
  lastAckByChannel: Map<string, string>,
  send: (payload: RealtimePayload) => void,
) {
  if (redis) {
    for (const channel of channels) {
      const lastAck = lastAckByChannel.get(channel)
      if (!lastAck) {
        continue
      }

      const entries = await redis.xrange(
        realtimeStreamKey(channel),
        `(${lastAck}`,
        "+",
      )

      for (const [id, fields] of entries) {
        const payload = parseRedisStreamPayload(id, fields)
        if (payload) {
          send(payload)
        }
      }
    }
    return
  }

  for (const channel of channels) {
    const lastAck = lastAckByChannel.get(channel)
    if (!lastAck) {
      continue
    }

    const history: RealtimePayload[] = state.history.get(channel) ?? []
    const lastAckIndex = history.findIndex((payload) => payload.id === lastAck)
    const missing = lastAckIndex === -1 ? [] : history.slice(lastAckIndex + 1)
    for (const payload of missing) {
      send(payload)
    }
  }
}

export async function subscribeRealtimeChannels(
  channels: string[],
  onPayload: (payload: RealtimePayload) => void,
) {
  for (const channel of channels) {
    const subscribers = state.subscribers.get(channel) ?? new Set()
    subscribers.add(onPayload)
    state.subscribers.set(channel, subscribers)
  }

  if (redis) {
    const subscriber = ensureRedisSubscriber()
    const missingChannels = channels
      .map((channel) => realtimeChannelKey(channel))
      .filter((channel) => !state.redisSubscribedChannels.has(channel))

    if (subscriber && missingChannels.length > 0) {
      await subscriber.subscribe(...missingChannels)
      for (const channel of missingChannels) {
        state.redisSubscribedChannels.add(channel)
      }
    }
  }

  return async () => {
    for (const channel of channels) {
      const subscribers = state.subscribers.get(channel)
      subscribers?.delete(onPayload)
      if (subscribers?.size === 0) {
        state.subscribers.delete(channel)

        if (redis && state.redisSubscriber) {
          const redisChannel = realtimeChannelKey(channel)
          await state.redisSubscriber.unsubscribe(redisChannel)
          state.redisSubscribedChannels.delete(redisChannel)
        }
      }
    }
  }
}

export const realtime = {
  channel(channel: string) {
    return {
      async emit<T extends RealtimeEventName>(
        event: T,
        data: RealtimeEventData<T>,
      ) {
        eventValidators[event].parse(data)

        if (redis) {
          const streamPayload = JSON.stringify({ event, channel, data })
          const id = await redis.xadd(
            realtimeStreamKey(channel),
            "MAXLEN",
            "~",
            HISTORY_LIMIT,
            "*",
            "payload",
            streamPayload,
          )
          if (!id) {
            throw new Error("Redis did not return a realtime stream id.")
          }
          const payload = { id, event, channel, data } satisfies RealtimePayload
          await redis
            .pipeline()
            .expire(realtimeStreamKey(channel), HISTORY_TTL_SECONDS)
            .publish(realtimeChannelKey(channel), JSON.stringify(payload))
            .exec()
          return
        }

        const payload = {
          id: createLocalEventId(),
          event,
          channel,
          data,
        } satisfies RealtimePayload

        pushLocalHistory(payload)
        publishLocal(payload)
      },
    }
  },
}
