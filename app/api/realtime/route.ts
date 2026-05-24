import { auth } from "@/lib/auth"
import {
  encodeSsePayload,
  replayRealtimeHistory,
  subscribeRealtimeChannels,
  type RealtimePayload,
} from "@/lib/realtime"
import { buildTaskRoomId } from "@/lib/services/chat"
import { buildProjectRoomId, canAccessProjectChat } from "@/lib/services/project-chat"
import { canUserChatOnTask } from "@/lib/services/tasks"
import { normalizeSessionUser, type SessionUser } from "@/lib/session"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type ParsedChatChannel =
  | {
      kind: "task"
      id: string
    }
  | {
      kind: "project"
      id: string
    }

function parseChatChannel(channel: string): ParsedChatChannel | null {
  const [kind, id, fingerprint, ...rest] = channel.split(":")
  if (rest.length > 0 || !id || !fingerprint) {
    return null
  }

  if (kind === "task") {
    return { kind, id }
  }

  if (kind === "project") {
    return { kind, id }
  }

  return null
}

async function canAccessRealtimeChannel(user: SessionUser, channel: string) {
  const parsed = parseChatChannel(channel)
  if (!parsed) {
    return false
  }

  if (parsed.kind === "task") {
    return (
      channel === buildTaskRoomId(parsed.id) &&
      (await canUserChatOnTask(user, parsed.id))
    )
  }

  return (
    channel === buildProjectRoomId(parsed.id) &&
    (await canAccessProjectChat(user, parsed.id))
  )
}

function getRequestedChannels(request: Request) {
  const { searchParams } = new URL(request.url)
  return [...new Set(searchParams.getAll("channel").filter(Boolean))]
}

function getLastAckByChannel(request: Request, channels: string[]) {
  const { searchParams } = new URL(request.url)
  const lastAckByChannel = new Map<string, string>()

  for (const channel of channels) {
    const lastAck = searchParams.get(`last_ack_${channel}`)
    if (lastAck) {
      lastAckByChannel.set(channel, lastAck)
    }
  }

  return lastAckByChannel
}

export async function GET(request: Request) {
  const channels = getRequestedChannels(request)
  if (channels.length === 0) {
    return new Response("No channels requested", { status: 400 })
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const user = normalizeSessionUser(session.user as Record<string, unknown>)
  if (!user.isActive) {
    return new Response("Account disabled", { status: 403 })
  }

  for (const channel of channels) {
    if (!(await canAccessRealtimeChannel(user, channel))) {
      return new Response("Forbidden", { status: 403 })
    }
  }

  const lastAckByChannel = getLastAckByChannel(request, channels)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let isClosed = false
      const subscription: {
        unsubscribe?: () => Promise<void>
      } = {}

      const send = (payload: RealtimePayload) => {
        if (isClosed) {
          return
        }

        try {
          controller.enqueue(encodeSsePayload(payload))
        } catch {
          isClosed = true
        }
      }

      const keepAlive = setInterval(() => {
        if (!isClosed) {
          try {
            controller.enqueue(
              encodeSsePayload({
                type: "ping",
                timestamp: Date.now(),
              }),
            )
          } catch {
            isClosed = true
          }
        }
      }, 25_000)

      const close = async () => {
        if (isClosed) {
          return
        }

        isClosed = true
        clearInterval(keepAlive)
        request.signal.removeEventListener("abort", close)
        await subscription.unsubscribe?.()

        try {
          controller.close()
        } catch {
          // Already closed by the runtime.
        }
      }

      request.signal.addEventListener("abort", close)

      for (const channel of channels) {
        controller.enqueue(encodeSsePayload({ type: "connected", channel }))
      }

      subscription.unsubscribe = await subscribeRealtimeChannels(channels, send)
      await replayRealtimeHistory(channels, lastAckByChannel, send)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
