"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  CornerUpLeftIcon,
  SendHorizonalIcon,
  SmileIcon,
  StickerIcon,
} from "lucide-react"

import { VoiceDictation } from "@/components/chat/voice-dictation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRealtime } from "@/lib/realtime-client"
import type { MessageEvent } from "@/lib/realtime"

type TaskChatPanelProps = {
  taskId: string
  roomId: string
  currentUserId: string
  initialMessages: MessageEvent[]
  canPost: boolean
}

const QUICK_EMOJIS = ["🙂", "🔥", "✅", "🚀", "🧠"]
const QUICK_REACTIONS = ["👍", "❤️", "🎯"]
const STICKER_TOKENS = [":sticker-hi:", ":sticker-great-job:", ":sticker-on-it:"]

type ReactionState = Record<string, Record<string, number>>

export function TaskChatPanel({
  taskId,
  roomId,
  currentUserId,
  initialMessages,
  canPost,
}: TaskChatPanelProps) {
  const [messages, setMessages] = useState<MessageEvent[]>(initialMessages)
  const [text, setText] = useState("")
  const [replyToMessageId, setReplyToMessageId] = useState<string | undefined>()
  const [pending, setPending] = useState(false)
  const [reactions, setReactions] = useState<ReactionState>({})

  const replyToMessage = useMemo(
    () => messages.find((item) => item.id === replyToMessageId),
    [messages, replyToMessageId],
  )

  useRealtime({
    channels: [roomId],
    events: ["chat.message"],
    onData: ({ data }) => {
      setMessages((prev) => {
        if (prev.some((item) => item.id === data.id)) {
          return prev
        }
        return [...prev, data]
      })
    },
  })

  async function sendMessage() {
    if (!canPost || !text.trim()) {
      return
    }

    setPending(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          replyToMessageId,
        }),
      })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error ?? "Failed to send message")
      }
      setText("")
      setReplyToMessageId(undefined)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message"
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  function onTranscript(message: string) {
    setText((prev) => {
      const trimmedPrev = prev.trim()
      if (!trimmedPrev) return message
      if (message.startsWith(trimmedPrev)) return message
      if (trimmedPrev.includes(message)) return trimmedPrev
      return `${trimmedPrev} ${message}`.trim()
    })
  }

  function addReaction(messageId: string, emoji: string) {
    setReactions((prev) => {
      const messageReactions = prev[messageId] ?? {}
      return {
        ...prev,
        [messageId]: {
          ...messageReactions,
          [emoji]: (messageReactions[emoji] ?? 0) + 1,
        },
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[380px] space-y-2 overflow-y-auto pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-3 text-sm ${
                message.sender === currentUserId ? "border-primary/30" : "border-border"
              }`}
            >
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{message.displayName}</span>
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>
              {message.replyToMessageId ? (
                <div className="mb-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  Reply to message #{message.replyToMessageId.slice(-6)}
                </div>
              ) : null}
              <div className="whitespace-pre-wrap">{message.text}</div>
              {canPost ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyToMessageId(message.id)}
                    className="h-7 px-2 text-xs"
                  >
                    <CornerUpLeftIcon className="size-3" />
                    Reply
                  </Button>
                  {QUICK_REACTIONS.map((emoji) => (
                    <Button
                      key={`${message.id}-${emoji}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => addReaction(message.id, emoji)}
                      className="h-7 px-2 text-xs"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(reactions[message.id] ?? {}).map(([emoji, count]) => (
                  <span
                    key={`${message.id}-reaction-${emoji}`}
                    className="rounded border px-2 py-0.5 text-xs"
                  >
                    {emoji} {count}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No messages yet.
            </div>
          ) : null}
        </div>

        {replyToMessage ? (
          <div className="rounded-lg border bg-muted/40 p-2 text-xs">
            Replying to: <span className="font-medium">{replyToMessage.displayName}</span>
            <div className="truncate text-muted-foreground">{replyToMessage.text}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessageId(undefined)}
              className="h-6 px-1 text-xs"
            >
              Cancel
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {QUICK_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => setText((prev) => `${prev} ${emoji}`.trim())}
              disabled={!canPost}
            >
              {emoji}
            </Button>
          ))}
          {STICKER_TOKENS.map((token) => (
            <Button
              key={token}
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => setText((prev) => `${prev} ${token}`.trim())}
              disabled={!canPost}
            >
              <StickerIcon className="size-3" />
              {token}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={canPost ? "Write a message..." : "View-only chat"}
            disabled={!canPost || pending}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void sendMessage()
              }
            }}
          />
          <Button onClick={() => void sendMessage()} disabled={!canPost || pending}>
            <SendHorizonalIcon />
          </Button>
          <Button variant="outline" disabled={!canPost}>
            <SmileIcon />
          </Button>
          <VoiceDictation disabled={!canPost || pending} onTranscript={onTranscript} />
        </div>
      </CardContent>
    </Card>
  )
}
