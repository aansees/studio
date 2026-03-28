import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { passkey } from "@better-auth/passkey"
import { twoFactor } from "better-auth/plugins"

import { db } from "@/lib/db"
import { authSchema } from "@/lib/db/schema"
import { env } from "@/lib/env"
import { sendAppMail } from "@/lib/email/mailer"

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  }
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  }
}

const baseURL =
  env.BETTER_AUTH_URL ??
  env.NEXT_PUBLIC_BETTER_AUTH_URL ??
  "http://localhost:3000"

export const auth = betterAuth({
  appName: env.APP_NAME,
  baseURL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: authSchema,
    camelCase: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendAppMail({
        to: user.email,
        subject: "Reset your password",
        preview: "Reset password request",
        title: "Reset your password",
        intro: "We received a request to reset your password.",
        lines: [
          "If this was you, open the link below and choose a new password.",
          "If this was not you, you can safely ignore this email.",
        ],
        ctaLabel: "Reset password",
        ctaUrl: url,
      })
    },
  },
  socialProviders,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: Object.keys(socialProviders),
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "UTC",
      },
      bookingPageTitle: {
        type: "string",
        required: false,
      },
      bookingPageDescription: {
        type: "string",
        required: false,
      },
      bookingEnabled: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: "client",
        input: false,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
    },
  },
  plugins: [
    twoFactor({
      issuer: env.APP_NAME,
    }),
    passkey({
      rpID: env.PASSKEY_RP_ID ?? "localhost",
      rpName: env.PASSKEY_RP_NAME ?? env.APP_NAME,
      origin: env.PASSKEY_ORIGIN ?? baseURL,
    }),
  ],
})
