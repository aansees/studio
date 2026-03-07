"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MicIcon, SquareIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type VoiceDictationProps = {
  disabled?: boolean
  onAudioReady: (file: File) => void
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function resolveMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return ""
  }

  const preferredTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ]

  return preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? ""
}

export function VoiceDictation({ disabled, onAudioReady }: VoiceDictationProps) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const mimeType = useMemo(() => resolveMimeType(), [])

  useEffect(() => {
    if (!isRecording) {
      return
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRecording])

  useEffect(() => {
    return () => {
      recorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  async function startRecording() {
    if (disabled) {
      return
    }

    if (!mimeType) {
      setError("This browser does not support compressed audio recording.")
      return
    }

    try {
      setError(null)
      setElapsedSeconds(0)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      })

      recorderRef.current = recorder
      streamRef.current = stream

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      })

      recorder.addEventListener("stop", () => {
        const extension = mimeType.includes("ogg") ? "ogg" : "webm"
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const file = new File(
          [blob],
          `voice-note-${Date.now()}.${extension}`,
          { type: mimeType },
        )

        if (file.size > 0) {
          onAudioReady(file)
        }

        stream.getTracks().forEach((track) => track.stop())
        recorderRef.current = null
        streamRef.current = null
        chunksRef.current = []
        setIsRecording(false)
        setElapsedSeconds(0)
      })

      recorder.start(250)
      setIsRecording(true)
    } catch (startError) {
      const message =
        startError instanceof Error
          ? startError.message
          : "Unable to start recording"
      setError(message)
      setIsRecording(false)
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="rounded-full border-red-500/30 text-red-500"
          onClick={stopRecording}
        >
          <SquareIcon className="size-3.5 fill-current" />
        </Button>
        <span className="text-xs text-muted-foreground">
          Recording {formatDuration(elapsedSeconds)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        onClick={() => void startRecording()}
        disabled={disabled}
      >
        <MicIcon className="size-4" />
      </Button>
      {error ? (
        <span className="max-w-44 truncate text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  )
}
