"use client"

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import type { MessageEvent, ProjectMessageEvent } from "@/lib/realtime"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

type RealtimeEventData<E extends string> = E extends "chat.message"
  ? MessageEvent
  : E extends "projectChat.message"
    ? ProjectMessageEvent
    : unknown

type RealtimeEnvelope<E extends string = string, D = RealtimeEventData<E>> = {
  id: string
  event: E
  channel: string
  data: D
}

type Subscription = {
  channels: Set<string>
  events: Set<string>
  onData?: (payload: RealtimeEnvelope) => void
}

type RealtimeContextValue = {
  status: ConnectionStatus
  register: (id: string, subscription: Subscription) => void
  unregister: (id: string) => void
}

type RealtimeProviderProps = {
  children: ReactNode
  api?: {
    url?: string
    withCredentials?: boolean
  }
  maxReconnectAttempts?: number
}

type UseRealtimeOpts<E extends string> = {
  events?: readonly E[]
  onData?: (payload: RealtimeEnvelope<E>) => void
  channels?: readonly (string | undefined)[]
  enabled?: boolean
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

function stableKey(values: readonly (string | undefined)[] | undefined) {
  return (values ?? []).filter(Boolean).join("\u001f")
}

function readStableKey(key: string) {
  return key.length === 0 ? [] : key.split("\u001f")
}

export function RealtimeProvider({
  children,
  api,
  maxReconnectAttempts = 5,
}: RealtimeProviderProps) {
  const apiUrl = api?.url ?? "/api/realtime"
  const withCredentials = api?.withCredentials ?? false
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [subscriptions, setSubscriptions] = useState<Map<string, Subscription>>(
    () => new Map(),
  )
  const subscriptionsRef = useRef(subscriptions)
  const lastAckRef = useRef(new Map<string, string>())

  useEffect(() => {
    subscriptionsRef.current = subscriptions
  }, [subscriptions])

  useEffect(() => {
    const channelSet = new Set<string>()
    for (const subscription of subscriptions.values()) {
      for (const channel of subscription.channels) {
        channelSet.add(channel)
      }
    }

    const channels = Array.from(channelSet)
    if (channels.length === 0) {
      const statusTimer = window.setTimeout(() => setStatus("disconnected"), 0)
      return () => window.clearTimeout(statusTimer)
    }

    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let closed = false
    let attempts = 0

    const connect = () => {
      if (closed) {
        return
      }

      const params = new URLSearchParams()
      for (const channel of channels) {
        params.append("channel", channel)
        const lastAck = lastAckRef.current.get(channel)
        if (lastAck) {
          params.set(`last_ack_${channel}`, lastAck)
        }
      }

      setStatus("connecting")
      eventSource = new EventSource(`${apiUrl}?${params.toString()}`, {
        withCredentials,
      })

      eventSource.onopen = () => {
        attempts = 0
        setStatus("connected")
      }

      eventSource.onmessage = (event) => {
        let payload:
          | RealtimeEnvelope
          | { type: "connected" | "ping"; channel?: string; timestamp?: number }

        try {
          payload = JSON.parse(event.data)
        } catch {
          return
        }

        if ("type" in payload) {
          return
        }

        lastAckRef.current.set(payload.channel, payload.id)

        for (const subscription of subscriptionsRef.current.values()) {
          if (
            subscription.channels.has(payload.channel) &&
            subscription.events.has(payload.event)
          ) {
            subscription.onData?.(payload)
          }
        }
      }

      eventSource.onerror = () => {
        eventSource?.close()
        setStatus("disconnected")

        if (closed) {
          return
        }

        attempts += 1
        if (attempts > maxReconnectAttempts) {
          setStatus("error")
          return
        }

        reconnectTimer = setTimeout(connect, Math.min(1000 * attempts, 5000))
      }
    }

    connect()

    return () => {
      closed = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      eventSource?.close()
    }
  }, [apiUrl, maxReconnectAttempts, subscriptions, withCredentials])

  const register = useCallback((id: string, subscription: Subscription) => {
    setSubscriptions((current) => {
      const next = new Map(current)
      next.set(id, subscription)
      return next
    })
  }, [])

  const unregister = useCallback((id: string) => {
    setSubscriptions((current) => {
      const next = new Map(current)
      next.delete(id)
      return next
    })
  }, [])

  const value = useMemo<RealtimeContextValue>(
    () => ({
      status,
      register,
      unregister,
    }),
    [register, status, unregister],
  )

  return createElement(RealtimeContext.Provider, { value }, children)
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error("useRealtime must be used within RealtimeProvider")
  }
  return context
}

export function createRealtime() {
  return {
    useRealtime,
  }
}

export function useRealtime<const E extends string>({
  channels,
  enabled = true,
  events,
  onData,
}: UseRealtimeOpts<E>) {
  const { register, status, unregister } = useRealtimeContext()
  const idRef = useRef<string | null>(null)
  const onDataRef = useRef(onData)
  const channelsKey = stableKey(channels)
  const eventsKey = stableKey(events)

  useEffect(() => {
    onDataRef.current = onData
  }, [onData])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const filteredChannels = readStableKey(channelsKey)
    const filteredEvents = readStableKey(eventsKey) as E[]

    if (filteredChannels.length === 0 || filteredEvents.length === 0) {
      return
    }

    const id = crypto.randomUUID()
    idRef.current = id

    register(id, {
      channels: new Set(filteredChannels),
      events: new Set(filteredEvents),
      onData(payload) {
        onDataRef.current?.(payload as RealtimeEnvelope<E>)
      },
    })

    return () => {
      unregister(id)
      idRef.current = null
    }
  }, [channelsKey, enabled, eventsKey, register, unregister])

  return { status }
}
