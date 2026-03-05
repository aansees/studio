import { and, eq, or } from "drizzle-orm"

import { db } from "@/lib/db"
import { project, projectMember, task, user as userTable } from "@/lib/db/schema"
import type { SessionUser } from "@/lib/session"

type Role = SessionUser["role"]

export function isAdmin(role: Role) {
  return role === "admin"
}

export function isDeveloper(role: Role) {
  return role === "developer"
}

export function isClient(role: Role) {
  return role === "client"
}

export async function canAccessProject(user: SessionUser, projectId: string) {
  if (isAdmin(user.role)) {
    return true
  }

  const [membership] = await db
    .select({ projectId: projectMember.projectId })
    .from(projectMember)
    .where(
      and(eq(projectMember.projectId, projectId), eq(projectMember.userId, user.id)),
    )
    .limit(1)

  if (membership) {
    return true
  }

  const [ownedProject] = await db
    .select({ id: project.id })
    .from(project)
    .where(
      and(
        eq(project.id, projectId),
        or(eq(project.clientId, user.id), eq(project.projectLeadId, user.id)),
      ),
    )
    .limit(1)

  return Boolean(ownedProject)
}

export async function canAccessTask(user: SessionUser, taskId: string) {
  if (isAdmin(user.role)) {
    return true
  }

  const [taskWithProject] = await db
    .select({
      taskId: task.id,
      assigneeId: task.assigneeId,
      projectId: task.projectId,
    })
    .from(task)
    .where(eq(task.id, taskId))
    .limit(1)

  if (!taskWithProject) {
    return false
  }

  if (user.role === "developer") {
    if (taskWithProject.assigneeId === user.id) {
      return true
    }
    return canAccessProject(user, taskWithProject.projectId)
  }

  if (user.role === "client") {
    return canAccessProject(user, taskWithProject.projectId)
  }

  return false
}

export async function listUserIdsByRole(role: SessionUser["role"]) {
  const records = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.role, role))
  return records.map((record) => record.id)
}
