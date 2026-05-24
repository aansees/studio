import Redis from "ioredis"

import { env, isProduction } from "@/lib/env"

const globalRedis = globalThis as typeof globalThis & {
  __agencyRedis?: Redis | null
}

function createRedisClient(role: string) {
  if (!env.REDIS_URL) {
    return null
  }

  const client = new Redis(env.REDIS_URL, {
    connectionName: `agency:${role}`,
    enableReadyCheck: true,
    lazyConnect: false,
    maxRetriesPerRequest: 3,
  })

  client.on("error", (error) => {
    if (!isProduction) {
      console.error(`Redis ${role} error`, error)
    }
  })

  return client
}

export const redis =
  globalRedis.__agencyRedis === undefined
    ? (globalRedis.__agencyRedis = createRedisClient("commands"))
    : globalRedis.__agencyRedis

export function createRedisSubscriber(role = "subscriber") {
  return createRedisClient(role)
}
