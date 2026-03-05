import { and, eq, or } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { createNotification } from "@/lib/notifications"
import type { SessionUser } from "@/lib/session"
import { isAdmin } from "@/lib/services/access-control"

type CreateDeveloperInput = {
  name: string
  email: string
  password: string
}

export async function listTeamAsAdmin(currentUser: SessionUser) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can list team")
  }

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })
    .from(user)
}

export async function createDeveloperAsAdmin(
  currentUser: SessionUser,
  input: CreateDeveloperInput,
) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can create developer accounts")
  }

  const existing = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, input.email))
    .limit(1)

  if (existing[0]) {
    throw new Error("User with this email already exists")
  }

  await auth.api.signUpEmail({
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
    },
  })

  const [created] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
    })
    .from(user)
    .where(eq(user.email, input.email))
    .limit(1)

  if (!created) {
    throw new Error("Could not create account")
  }

  await db
    .update(user)
    .set({
      role: "developer",
      updatedAt: new Date(),
    })
    .where(eq(user.id, created.id))

  await createNotification({
    userId: created.id,
    event: "promoted_to_developer",
    title: "You were added as a developer",
    body: `${currentUser.name} created your developer account.`,
    metadata: { promotedBy: currentUser.id },
    email: {
      to: created.email,
      subject: "Your developer account is ready",
      preview: "Your role has been set to Developer",
      intro: "Your account is now configured as a developer account.",
      lines: [
        "You can now access assigned projects and update the status of your tasks.",
      ],
      ctaLabel: "Open dashboard",
      ctaUrl: "/dashboard",
    },
  })

  return created.id
}

export async function promoteUserToDeveloperAsAdmin(
  currentUser: SessionUser,
  targetUserId: string,
) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can change roles")
  }

  const [target] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1)

  if (!target) {
    throw new Error("User not found")
  }

  await db
    .update(user)
    .set({
      role: "developer",
      updatedAt: new Date(),
    })
    .where(eq(user.id, targetUserId))

  await createNotification({
    userId: target.id,
    event: "promoted_to_developer",
    title: "Your role is now Developer",
    body: `${currentUser.name} upgraded your role.`,
    metadata: { promotedBy: currentUser.id },
    email: {
      to: target.email,
      subject: "Role updated to Developer",
      preview: "Your account role has been updated",
      intro: "Your account role has been changed to Developer.",
      ctaLabel: "Open dashboard",
      ctaUrl: "/dashboard",
    },
  })
}

export async function setUserRoleAsAdmin(
  currentUser: SessionUser,
  targetUserId: string,
  role: SessionUser["role"],
) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can set roles")
  }
  if (role === "admin") {
    throw new Error("Admin role cannot be granted from web")
  }

  await db
    .update(user)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, targetUserId))
}

export async function searchUsersForAssignment(currentUser: SessionUser, query?: string) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can search users")
  }

  const where =
    query && query.trim().length > 0
      ? and(
          or(
            eq(user.role, "developer"),
            eq(user.role, "client"),
            eq(user.role, "admin"),
          ),
          or(eq(user.email, query), eq(user.name, query)),
        )
      : or(eq(user.role, "developer"), eq(user.role, "client"), eq(user.role, "admin"))

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })
    .from(user)
    .where(where)
}
