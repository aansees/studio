import { redis } from "@/lib/redis"

type RateLimitInput = {
  key: string
  limit: number
  windowSeconds: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAfterSeconds: number
}

type LocalCounter = {
  count: number
  expiresAt: number
}

const globalRateState = globalThis as typeof globalThis & {
  __localRateLimits?: Map<string, LocalCounter>
}

function getLocalStore() {
  if (!globalRateState.__localRateLimits) {
    globalRateState.__localRateLimits = new Map<string, LocalCounter>()
  }
  return globalRateState.__localRateLimits
}

function checkLocalRateLimit({ key, limit, windowSeconds }: RateLimitInput): RateLimitResult {
  const now = Date.now()
  const store = getLocalStore()
  const existing = store.get(key)

  if (!existing || existing.expiresAt <= now) {
    store.set(key, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    })
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAfterSeconds: windowSeconds,
    }
  }

  existing.count += 1
  store.set(key, existing)

  const remaining = Math.max(0, limit - existing.count)
  return {
    allowed: existing.count <= limit,
    remaining,
    resetAfterSeconds: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)),
  }
}

export async function applyRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  if (!redis) {
    return checkLocalRateLimit(input)
  }

  const count = await redis.incr(input.key)
  if (count === 1) {
    await redis.expire(input.key, input.windowSeconds)
  }

  const remaining = Math.max(0, input.limit - count)
  return {
    allowed: count <= input.limit,
    remaining,
    resetAfterSeconds: input.windowSeconds,
  }
}
