"use client"

import { useRef, useState } from "react"
import { MicIcon, MicOffIcon } from "lucide-react"
import { useConversation } from "@elevenlabs/react"

import { Button } from "@/components/ui/button"

type VoiceDictationProps = {
  disabled?: boolean
  onTranscript: (message: string) => void
}

export function VoiceDictation({ disabled, onTranscript }: VoiceDictationProps) {
  const [error, setError] = useState<string | null>(null)
  const lastMessageRef = useRef("")
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

  const conversation = useConversation({
    onMessage: ({ role, message }) => {
      if (role !== "user") return
      const normalized = message.trim()
      if (!normalized) return
      if (lastMessageRef.current === normalized) return
      lastMessageRef.current = normalized
      onTranscript(normalized)
    },
    onError: (message) => {
      setError(message)
    },
  })

  const isConnected = conversation.status === "connected"
  const isConnecting = conversation.status === "connecting"

  async function start() {
    if (!agentId) {
      setError("Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID to enable voice dictation.")
      return
    }

    setError(null)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      await conversation.startSession({
        agentId,
        connectionType: "webrtc",
      })
    } catch (startError) {
      const message =
        startError instanceof Error ? startError.message : "Unable to start dictation"
      setError(message)
    }
  }

  async function stop() {
    setError(null)
    try {
      await conversation.endSession()
    } catch (stopError) {
      const message =
        stopError instanceof Error ? stopError.message : "Unable to stop dictation"
      setError(message)
    }
  }

  if (isConnected) {
    return (
      <Button variant="destructive" onClick={() => void stop()} disabled={disabled}>
        <MicOffIcon />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => void start()}
        disabled={disabled || isConnecting}
      >
        <MicIcon />
      </Button>
      {error ? <span className="max-w-52 truncate text-xs text-destructive">{error}</span> : null}
    </div>
  )
}
