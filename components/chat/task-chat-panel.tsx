"use client"

import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  CornerUpLeftIcon,
  ImagePlusIcon,
  SendHorizonalIcon,
  SmilePlusIcon,
  XIcon,
} from "lucide-react"

import { VoiceDictation } from "@/components/chat/voice-dictation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import type { UserRole } from "@/lib/constants/rbac"
import { useRealtime } from "@/lib/realtime-client"
import type { MessageAttachmentEvent, MessageEvent } from "@/lib/realtime"
import { cn } from "@/lib/utils"

type TaskChatPanelProps = {
  taskId: string
  roomId: string
  currentUserId: string
  viewerRole: UserRole
  initialMessages: MessageEvent[]
  canPost: boolean
}

type ComposerAttachment = {
  id: string
  file: File
  kind: "image" | "audio"
  previewUrl: string
}

function formatChatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp))
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function TaskChatPanel({
  taskId,
  roomId,
  currentUserId,
  viewerRole,
  initialMessages,
  canPost,
}: TaskChatPanelProps) {
  const [messages, setMessages] = useState<MessageEvent[]>(initialMessages)
  const [text, setText] = useState("")
  const [replyToMessageId, setReplyToMessageId] = useState<string | undefined>()
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>(
    [],
  )
  const [pending, setPending] = useState(false)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const composerAttachmentsRef = useRef<ComposerAttachment[]>([])

  const replyToMessage = useMemo(
    () => messages.find((item) => item.id === replyToMessageId),
    [messages, replyToMessageId],
  )

  useEffect(() => {
    composerAttachmentsRef.current = composerAttachments
  }, [composerAttachments])

  useEffect(() => {
    return () => {
      for (const attachment of composerAttachmentsRef.current) {
        URL.revokeObjectURL(attachment.previewUrl)
      }
    }
  }, [])

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) {
      return
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  useRealtime({
    channels: [roomId],
    events: ["chat.message"],
    onData: ({ data: incomingMessage }) => {
      setMessages((previous) => {
        if (previous.some((item) => item.id === incomingMessage.id)) {
          return previous
        }

        return [...previous, incomingMessage]
      })
    },
  })

  function getVisibleSenderName(message: MessageEvent) {
    if (viewerRole === "client" && message.senderRole === "developer") {
      return "Assigned developer"
    }

    return message.displayName
  }

  function clearComposerAttachments() {
    setComposerAttachments((current) => {
      for (const attachment of current) {
        URL.revokeObjectURL(attachment.previewUrl)
      }

      return []
    })
  }

  function removeComposerAttachment(attachmentId: string) {
    setComposerAttachments((current) => {
      const nextAttachments = current.filter((item) => item.id !== attachmentId)
      const removedAttachment = current.find((item) => item.id === attachmentId)

      if (removedAttachment) {
        URL.revokeObjectURL(removedAttachment.previewUrl)
      }

      return nextAttachments
    })
  }

  function addEmoji(emoji: string) {
    setText((current) => `${current}${emoji}`)
  }

  function registerImageFiles(fileList: FileList | null) {
    if (!fileList) {
      return
    }

    const imageFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    )

    if (imageFiles.length === 0) {
      return
    }

    setComposerAttachments((current) => {
      const existingImages = current.filter((item) => item.kind === "image")
      const nextTotal = existingImages.length + imageFiles.length

      if (nextTotal > 5) {
        toast.error("You can attach up to 5 images per message.")
        return current
      }

      return [
        ...current,
        ...imageFiles.map((file) => ({
          id: crypto.randomUUID(),
          file,
          kind: "image" as const,
          previewUrl: URL.createObjectURL(file),
        })),
      ]
    })
  }

  function registerAudioFile(file: File) {
    setComposerAttachments((current) => {
      const existingAudio = current.find((item) => item.kind === "audio")

      if (existingAudio) {
        URL.revokeObjectURL(existingAudio.previewUrl)
      }

      const withoutAudio = current.filter((item) => item.kind !== "audio")

      return [
        ...withoutAudio,
        {
          id: crypto.randomUUID(),
          file,
          kind: "audio",
          previewUrl: URL.createObjectURL(file),
        },
      ]
    })
  }

  async function sendMessage() {
    const trimmedText = text.trim()
    if (!canPost || pending) {
      return
    }

    if (trimmedText.length === 0 && composerAttachments.length === 0) {
      return
    }

    setPending(true)

    try {
      const formData = new FormData()
      formData.set("text", trimmedText)

      if (replyToMessageId) {
        formData.set("replyToMessageId", replyToMessageId)
      }

      for (const attachment of composerAttachments) {
        formData.append("attachments", attachment.file)
      }

      const response = await fetch(`/api/tasks/${taskId}/chat/messages`, {
        method: "POST",
        body: formData,
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to send message")
      }

      if (payload?.message) {
        setMessages((previous) => {
          if (previous.some((item) => item.id === payload.message.id)) {
            return previous
          }

          return [...previous, payload.message as MessageEvent]
        })
      }

      setText("")
      setReplyToMessageId(undefined)
      clearComposerAttachments()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message"
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  function renderAttachments(attachments: MessageAttachmentEvent[]) {
    if (attachments.length === 0) {
      return null
    }

    const imageAttachments = attachments.filter((item) => item.kind === "image")
    const audioAttachments = attachments.filter((item) => item.kind === "audio")

    return (
      <div className="space-y-3">
        {imageAttachments.length > 0 ? (
          <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
            {imageAttachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-2xl"
              >
                <Image
                  src={attachment.url}
                  alt={attachment.fileName ?? "Chat image"}
                  width={attachment.width ?? 1280}
                  height={attachment.height ?? 720}
                  unoptimized
                  className="h-auto w-full rounded-2xl object-cover"
                />
              </a>
            ))}
          </div>
        ) : null}
        {audioAttachments.map((attachment) => (
          <audio
            key={attachment.id}
            controls
            preload="metadata"
            className="h-11 w-full max-w-sm"
            src={attachment.url}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-[520px] flex-1 flex-col gap-4">
      <div className="text-sm font-medium">Task Chat</div>

      <div
        ref={scrollerRef}
        className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pr-2"
      >
        {messages.length === 0 ? (
          <div className="pt-6 text-sm text-muted-foreground">
            No messages yet.
          </div>
        ) : null}

        {messages.map((message) => {
          const ownMessage = message.sender === currentUserId
          const visibleName = getVisibleSenderName(message)
          const repliedMessage = message.replyToMessageId
            ? messages.find((item) => item.id === message.replyToMessageId)
            : undefined

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                ownMessage ? "justify-end" : "justify-start",
              )}
            >
              {!ownMessage ? (
                <Avatar size="sm" className="mt-0.5">
                  <AvatarFallback>{initials(visibleName)}</AvatarFallback>
                </Avatar>
              ) : null}

              <div
                className={cn(
                  "max-w-3xl min-w-0 space-y-2",
                  ownMessage && "text-right",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs text-muted-foreground",
                    ownMessage && "justify-end",
                  )}
                >
                  <span className="font-medium text-foreground/80">
                    {visibleName}
                  </span>
                  <span>{formatChatTime(message.timestamp)}</span>
                </div>

                {repliedMessage ? (
                  <button
                    type="button"
                    onClick={() => setReplyToMessageId(repliedMessage.id)}
                    className={cn(
                      "line-clamp-2 text-left text-xs text-muted-foreground",
                      ownMessage && "ml-auto text-right",
                    )}
                  >
                    Replying to {getVisibleSenderName(repliedMessage)}:{" "}
                    {repliedMessage.text || "Attachment"}
                  </button>
                ) : null}

                {message.text ? (
                  <div className="whitespace-pre-wrap text-sm leading-7">
                    {message.text}
                  </div>
                ) : null}

                {renderAttachments(message.attachments ?? [])}

                {canPost ? (
                  <div
                    className={cn(
                      "flex items-center gap-2 text-xs text-muted-foreground",
                      ownMessage && "justify-end",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setReplyToMessageId(message.id)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      <CornerUpLeftIcon className="size-3.5" />
                      Reply
                    </button>
                  </div>
                ) : null}
              </div>

              {ownMessage ? (
                <Avatar size="sm" className="mt-0.5">
                  <AvatarFallback>{initials(visibleName)}</AvatarFallback>
                </Avatar>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="pb-1">
        <div className="rounded-[30px] border bg-background/92 p-3 shadow-sm backdrop-blur-sm">
          {replyToMessage ? (
            <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">
                  Replying to {getVisibleSenderName(replyToMessage)}
                </div>
                <div className="truncate">
                  {replyToMessage.text || "Attachment message"}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="rounded-full"
                onClick={() => setReplyToMessageId(undefined)}
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          ) : null}

          {composerAttachments.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-3">
              {composerAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative overflow-hidden rounded-2xl bg-muted/40"
                >
                  {attachment.kind === "image" ? (
                    <Image
                      src={attachment.previewUrl}
                      alt={attachment.file.name}
                      width={192}
                      height={192}
                      unoptimized
                      className="h-24 w-24 object-cover"
                    />
                  ) : (
                    <div className="flex min-w-56 items-center gap-3 px-3 py-3">
                      <audio
                        controls
                        preload="metadata"
                        className="h-10 w-full"
                        src={attachment.previewUrl}
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    className="absolute top-2 right-2 rounded-full bg-background/90"
                    onClick={() => removeComposerAttachment(attachment.id)}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={canPost ? "Write a message..." : "View-only chat"}
            disabled={!canPost || pending}
            className="min-h-28 resize-none border-0 bg-transparent px-1 py-1 text-sm shadow-none focus-visible:ring-0"
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                void sendMessage()
              }
            }}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  registerImageFiles(event.target.files)
                  event.currentTarget.value = ""
                }}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={() => imageInputRef.current?.click()}
                disabled={!canPost || pending}
              >
                <ImagePlusIcon className="size-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    disabled={!canPost || pending}
                  >
                    <SmilePlusIcon className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none">
                  <Picker
                    data={data}
                    theme="auto"
                    previewPosition="none"
                    onEmojiSelect={(emoji: { native: string }) => addEmoji(emoji.native)}
                  />
                </PopoverContent>
              </Popover>

              <VoiceDictation
                disabled={!canPost || pending}
                onAudioReady={registerAudioFile}
              />
            </div>

            <Button
              type="button"
              size="icon-lg"
              className="rounded-full"
              onClick={() => void sendMessage()}
              disabled={
                !canPost ||
                pending ||
                (text.trim().length === 0 && composerAttachments.length === 0)
              }
            >
              <SendHorizonalIcon className="size-4.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
