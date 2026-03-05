import { APIError } from "better-auth/api"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { isUserRole, type UserRole } from "@/lib/constants/rbac"

export type SessionUser = {
  id: string
  name: string
  email: string
  image?: string | null
  role: UserRole
  isActive: boolean
}

export async function getServerSession() {
  const headerStore = await headers()
  return auth.api.getSession({
    headers: headerStore,
  })
}

export function normalizeSessionUser(user: Record<string, unknown>): SessionUser {
  const role = typeof user.role === "string" && isUserRole(user.role) ? user.role : "client"
  const isActive = user.isActive !== false

  return {
    id: String(user.id),
    name: String(user.name ?? "User"),
    email: String(user.email ?? ""),
    image: typeof user.image === "string" ? user.image : null,
    role,
    isActive,
  }
}

export async function requireSession(allowedRoles?: UserRole[]) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  const user = normalizeSessionUser(session.user as Record<string, unknown>)
  if (!user.isActive) {
    throw new APIError("UNAUTHORIZED", {
      message: "Your account has been disabled.",
    })
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/dashboard")
  }

  return { session, user }
}

export async function requireApiSession(allowedRoles?: UserRole[]) {
  const session = await getServerSession()

  if (!session?.user) {
    throw new APIError("UNAUTHORIZED", {
      message: "Unauthorized",
    })
  }

  const user = normalizeSessionUser(session.user as Record<string, unknown>)
  if (!user.isActive) {
    throw new APIError("FORBIDDEN", {
      message: "Account disabled",
    })
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new APIError("FORBIDDEN", {
      message: "Insufficient role permissions",
    })
  }

  return { session, user }
}
