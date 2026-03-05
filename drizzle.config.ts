import { defineConfig } from "drizzle-kit"
 
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Drizzle")
}

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
})
