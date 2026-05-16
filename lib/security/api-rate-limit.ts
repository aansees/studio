import { applyRateLimit } from "@/lib/security/rate-limit"
import { tooManyRequests } from "@/lib/errors"

type RequireApiRateLimitInput = {
  key: string
  limit: number
  windowSeconds: number
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

export async function requireApiRateLimit(input: RequireApiRateLimitInput) {
  const result = await applyRateLimit(input)
  if (!result.allowed) {
    throw tooManyRequests()
  }
}
