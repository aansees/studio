import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("Agency Studio"),
  DATABASE_URL: z.string(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET must be at least 16 chars"),
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  CHAT_AUTO_FLUSH_INTERVAL_MS: z.coerce.number().int().min(1000).default(5000),
  CHAT_FLUSH_BATCH_SIZE: z.coerce.number().int().min(10).max(2000).default(500),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NAME: z.string().optional(),
  PASSKEY_RP_ID: z.string().optional(),
  PASSKEY_RP_NAME: z.string().optional(),
  PASSKEY_ORIGIN: z.string().url().optional(),
  NEXT_PUBLIC_ELEVENLABS_AGENT_ID: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n")
  throw new Error(`Invalid environment variables:\n${message}`)
}

export const env = parsed.data

export const isProduction = env.NODE_ENV === "production"
