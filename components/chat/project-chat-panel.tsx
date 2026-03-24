"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CornerUpLeftIcon,
  SendHorizonalIcon,
  SmilePlusIcon,
  XIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useRealtime } from "@/lib/realtime-client";
import type { ProjectMessageEvent } from "@/lib/realtime";
import { cn } from "@/lib/utils";

type ProjectChatPanelProps = {
  projectId: string;
  roomId: string;
  currentUserId: string;
  initialPage: {
    messages: ProjectMessageEvent[];
    hasMore: boolean;
    nextCursor: string | null;
  };
  canPost: boolean;
};

function compareProjectMessages(
  left: Pick<ProjectMessageEvent, "id" | "timestamp">,
  right: Pick<ProjectMessageEvent, "id" | "timestamp">,
) {
  if (left.timestamp !== right.timestamp) {
    return left.timestamp - right.timestamp;
  }

  return left.id.localeCompare(right.id);
}

function mergeMessages(messages: ProjectMessageEvent[]) {
  const deduped = new Map<string, ProjectMessageEvent>();
  for (const message of messages) {
    deduped.set(message.id, message);
  }

  return Array.from(deduped.values()).sort(compareProjectMessages);
}

function formatChatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProjectChatPanel({
  projectId,
  roomId,
  currentUserId,
  initialPage,
  canPost,
}: ProjectChatPanelProps) {
  const [messages, setMessages] = useState<ProjectMessageEvent[]>(
    initialPage.messages,
  );
  const [text, setText] = useState("");
  const [replyToMessageId, setReplyToMessageId] = useState<
    string | undefined
  >();
  const [pending, setPending] = useState(false);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialPage.nextCursor,
  );
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [showTopLoader, setShowTopLoader] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const loadingDelayRef = useRef<number | null>(null);

  const replyToMessage = useMemo(
    () => messages.find((item) => item.id === replyToMessageId),
    [messages, replyToMessageId],
  );

  function clearLoadingDelay() {
    if (loadingDelayRef.current) {
      window.clearTimeout(loadingDelayRef.current);
      loadingDelayRef.current = null;
    }
  }

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior,
    });
  }

  useEffect(() => {
    scrollToBottom();

    return () => {
      clearLoadingDelay();
    };
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }

    const loadOlderMessages = async () => {
      if (!hasMore || !nextCursor || loadingOlder) {
        return;
      }

      const previousScrollHeight = node.scrollHeight;
      const previousScrollTop = node.scrollTop;

      setLoadingOlder(true);
      clearLoadingDelay();
      loadingDelayRef.current = window.setTimeout(() => {
        setShowTopLoader(true);
      }, 180);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/chat/messages?before=${encodeURIComponent(nextCursor)}&limit=10`,
          {
            cache: "no-store",
          },
        );
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          messages?: ProjectMessageEvent[];
          hasMore?: boolean;
          nextCursor?: string | null;
        } | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to load older messages");
        }

        const olderMessages = Array.isArray(payload?.messages)
          ? payload.messages
          : [];

        setMessages((current) => mergeMessages([...olderMessages, ...current]));
        setHasMore(Boolean(payload?.hasMore));
        setNextCursor(
          typeof payload?.nextCursor === "string" ||
            payload?.nextCursor === null
            ? payload.nextCursor
            : null,
        );

        window.requestAnimationFrame(() => {
          const target = scrollerRef.current;
          if (!target) {
            return;
          }

          const nextScrollHeight = target.scrollHeight;
          target.scrollTop =
            nextScrollHeight - previousScrollHeight + previousScrollTop;
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load older messages",
        );
      } finally {
        clearLoadingDelay();
        setShowTopLoader(false);
        setLoadingOlder(false);
      }
    };

    const handleScroll = () => {
      const distanceFromBottom =
        node.scrollHeight - node.scrollTop - node.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 120;

      if (node.scrollTop <= 96 && hasMore && !loadingOlder) {
        void loadOlderMessages();
      }
    };

    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingOlder, nextCursor, projectId]);

  useRealtime({
    channels: [roomId],
    events: ["projectChat.message"],
    onData: ({ data: incomingMessage }) => {
      setMessages((previous) => {
        if (previous.some((item) => item.id === incomingMessage.id)) {
          return previous;
        }

        return mergeMessages([...previous, incomingMessage]);
      });

      if (shouldStickToBottomRef.current) {
        window.requestAnimationFrame(() => {
          scrollToBottom("smooth");
        });
      }
    },
  });

  function addEmoji(emoji: string) {
    setText((current) => `${current}${emoji}`);
  }

  async function sendMessage() {
    const trimmedText = text.trim();
    if (!canPost || pending || trimmedText.length === 0) {
      return;
    }

    setPending(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/chat/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text: trimmedText,
          replyToMessageId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        message?: ProjectMessageEvent;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to send message");
      }

      const createdMessage = payload?.message;
      if (createdMessage) {
        setMessages((previous) => mergeMessages([...previous, createdMessage]));
      }

      setText("");
      setReplyToMessageId(undefined);
      shouldStickToBottomRef.current = true;
      window.requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[560px] flex-1 flex-col gap-4">
      <div
        ref={scrollerRef}
        className="relative flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pr-2"
      >
        {showTopLoader && (
          <div className="sticky top-0 z-10 flex min-h-8 items-center justify-center">
            <div className="rounded-full border bg-background/95 px-3 py-1 shadow-sm backdrop-blur">
              <Spinner className="size-4" />
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="pt-6 text-sm text-muted-foreground">
            No messages yet.
          </div>
        ) : null}

        {messages.map((message) => {
          const ownMessage = message.sender === currentUserId;
          const repliedMessage = message.replyToMessageId
            ? messages.find((item) => item.id === message.replyToMessageId)
            : undefined;

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
                  <AvatarFallback>
                    {initials(message.displayName)}
                  </AvatarFallback>
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
                    {message.displayName}
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
                    Replying to {repliedMessage.displayName}:{" "}
                    {repliedMessage.text || "Message"}
                  </button>
                ) : null}

                <div className="whitespace-pre-wrap text-sm leading-7">
                  {message.text}
                </div>

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
                  <AvatarFallback>
                    {initials(message.displayName)}
                  </AvatarFallback>
                </Avatar>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="pb-1">
        <div className="rounded-[30px] border bg-background/92 p-3 shadow-sm backdrop-blur-sm">
          {replyToMessage ? (
            <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">
                  Replying to {replyToMessage.displayName}
                </div>
                <div className="truncate">{replyToMessage.text}</div>
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

          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={canPost ? "Write a message..." : "View-only chat"}
            disabled={!canPost || pending}
            className="min-h-28 resize-none border-0 bg-transparent px-1 py-1 text-sm shadow-none focus-visible:ring-0"
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void sendMessage();
              }
            }}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
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
                  onEmojiSelect={(emoji: { native: string }) =>
                    addEmoji(emoji.native)
                  }
                />
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              size="icon-lg"
              className="rounded-full"
              onClick={() => void sendMessage()}
              disabled={!canPost || pending || text.trim().length === 0}
            >
              <SendHorizonalIcon className="size-4.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
