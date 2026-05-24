"use client"

import { createAuthClient } from "better-auth/react"
import { twoFactorClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"

const baseURL =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  plugins: [twoFactorClient(), passkeyClient()],
})
