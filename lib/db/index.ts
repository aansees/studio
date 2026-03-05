import mysql from "mysql2/promise"
import { drizzle } from "drizzle-orm/mysql2"

import { env } from "@/lib/env"
import { schema } from "@/lib/db/schema"

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined
  db: unknown
}

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    uri: env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60_000,
    enableKeepAlive: true,
  })

const createdDb = drizzle({ client: pool, schema, mode: "default" })

export const db = (globalForDb.db ?? createdDb) as typeof createdDb

if (env.NODE_ENV !== "production") {
  globalForDb.pool = pool
  globalForDb.db = db
}
