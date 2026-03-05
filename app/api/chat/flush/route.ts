import { NextResponse } from "next/server"

import { env } from "@/lib/env"
import { errorResponse } from "@/lib/http"
import { flushDueChatMessages } from "@/lib/services/chat"

function isAuthorized(request: Request) {
  if (env.NODE_ENV === "production" && !env.CHAT_FLUSH_API_KEY) {
    return false
  }
  if (!env.CHAT_FLUSH_API_KEY) {
    return true
  }
  const authHeader = request.headers.get("authorization")
  return authHeader === `Bearer ${env.CHAT_FLUSH_API_KEY}`
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await flushDueChatMessages()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return errorResponse(error)
  }
}
