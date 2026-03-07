import { and, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { project, projectMember, task, user } from "@/lib/db/schema"
import { createNotification } from "@/lib/notifications"
import type { SessionUser } from "@/lib/session"
import { canAccessProject, isAdmin } from "@/lib/services/access-control"
import { canManageProject, recalculateProjectProgress } from "@/lib/services/projects"

type CreateTaskInput = {
  projectId: string
  title: string
  description?: string
  type?: typeof task.$inferInsert.type
  priority?: typeof task.$inferInsert.priority
  assigneeId?: string
  status?: typeof task.$inferInsert.status
  dueDate?: Date
  estimatedHours?: number
}

type UpdateTaskInput = Partial<Omit<CreateTaskInput, "projectId">> & {
  status?: typeof task.$inferInsert.status
}

export async function listTasksForUser(currentUser: SessionUser, projectId?: string) {
  if (isAdmin(currentUser.role)) {
    const whereClause = projectId ? eq(task.projectId, projectId) : undefined
    return whereClause
      ? db.select().from(task).where(whereClause).orderBy(desc(task.updatedAt))
      : db.select().from(task).orderBy(desc(task.updatedAt))
  }

  if (currentUser.role === "developer") {
    const whereClause = projectId
      ? and(eq(task.projectId, projectId), eq(task.assigneeId, currentUser.id))
      : eq(task.assigneeId, currentUser.id)
    return db.select().from(task).where(whereClause).orderBy(desc(task.updatedAt))
  }

  return db
    .select()
    .from(task)
    .where(
      sql`exists (
        select 1 from ${projectMember}
        where ${projectMember.projectId} = ${task.projectId}
          and ${projectMember.userId} = ${currentUser.id}
      ) or exists (
        select 1 from ${project}
        where ${project.id} = ${task.projectId}
          and ${project.clientId} = ${currentUser.id}
      )`,
    )
    .orderBy(desc(task.updatedAt))
}

export async function listProjectTasksForUser(currentUser: SessionUser, projectId: string) {
  const hasAccess = await canAccessProject(currentUser, projectId)
  if (!hasAccess) {
    throw new Error("Forbidden")
  }

  return db
    .select()
    .from(task)
    .where(eq(task.projectId, projectId))
    .orderBy(desc(task.updatedAt))
}

async function validateTaskAssignee(projectId: string, assigneeId?: string) {
  if (!assigneeId) {
    return
  }

  const [member] = await db
    .select({
      role: user.role,
    })
    .from(projectMember)
    .innerJoin(user, eq(user.id, projectMember.userId))
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, assigneeId)))
    .limit(1)

  if (!member) {
    throw new Error("Assignee must be a member of this project")
  }

  if (member.role === "client") {
    throw new Error("Client members cannot be assigned tasks")
  }
}

export async function createTaskByManager(currentUser: SessionUser, input: CreateTaskInput) {
  const [targetProject] = await db
    .select({
      id: project.id,
      projectLeadId: project.projectLeadId,
    })
    .from(project)
    .where(eq(project.id, input.projectId))
    .limit(1)

  if (!targetProject) {
    throw new Error("Project not found")
  }

  const manager =
    isAdmin(currentUser.role) || targetProject.projectLeadId === currentUser.id
  if (!manager) {
    throw new Error("Forbidden: only admins or project lead can create tasks")
  }

  await validateTaskAssignee(input.projectId, input.assigneeId)

  const [created] = await db
    .insert(task)
    .values({
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? null,
      type: input.type ?? "feature",
      priority: input.priority ?? "medium",
      assigneeId: input.assigneeId ?? null,
      status: input.status ?? "todo",
      dueDate: input.dueDate ?? null,
      estimatedHours: input.estimatedHours ?? null,
      createdById: currentUser.id,
    })
    .$returningId()

  await recalculateProjectProgress(input.projectId)

  if (input.assigneeId) {
    const [assignee] = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, input.assigneeId))
      .limit(1)

    if (assignee) {
      await createNotification({
        userId: assignee.id,
        event: "task_assigned",
        title: "New task assigned",
        body: `${currentUser.name} assigned "${input.title}" to you.`,
        metadata: {
          taskId: created?.id,
          projectId: input.projectId,
        },
        email: {
          to: assignee.email,
          subject: `Task assigned: ${input.title}`,
          preview: `A task was assigned to you`,
          intro: `${currentUser.name} assigned a new task to you.`,
          lines: [`Task: ${input.title}`],
          ctaLabel: "Open my tasks",
          ctaUrl: "/mytask",
        },
      })
    }
  }

  return created?.id ?? null
}

export async function createTaskAsAdmin(currentUser: SessionUser, input: CreateTaskInput) {
  return createTaskByManager(currentUser, input)
}

export async function updateTaskWithPermissions(
  currentUser: SessionUser,
  taskId: string,
  updates: UpdateTaskInput,
) {
  const [existing] = await db.select().from(task).where(eq(task.id, taskId)).limit(1)
  if (!existing) {
    throw new Error("Task not found")
  }

  const manager = await canManageProject(currentUser, existing.projectId)

  if (manager) {
    await validateTaskAssignee(existing.projectId, updates.assigneeId)

    await db
      .update(task)
      .set({
        title: updates.title,
        description: updates.description,
        type: updates.type,
        priority: updates.priority,
        assigneeId: updates.assigneeId,
        status: updates.status,
        dueDate: updates.dueDate,
        estimatedHours: updates.estimatedHours,
        startedAt:
          updates.status === "in_progress" && !existing.startedAt ? new Date() : undefined,
        completedAt: updates.status === "done" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(task.id, taskId))

    if (updates.status === "done") {
      const admins = await db
        .select({ id: user.id, email: user.email, name: user.name })
        .from(user)
        .where(eq(user.role, "admin"))

      await Promise.all(
        admins.map((adminUser) =>
          createNotification({
            userId: adminUser.id,
            event: "task_completed",
            title: "Task completed",
            body: `"${existing.title}" was marked as done.`,
            metadata: { taskId, completedBy: currentUser.id },
            email: {
              to: adminUser.email,
              subject: `Task completed: ${existing.title}`,
              preview: "A task has been completed",
              intro: `"${existing.title}" was marked complete.`,
            },
          }),
        ),
      )
    }

    await recalculateProjectProgress(existing.projectId)

    return
  }

  if (currentUser.role === "developer") {
    if (existing.assigneeId !== currentUser.id) {
      throw new Error("Developers can only update their own assigned tasks")
    }

    await db
      .update(task)
      .set({
        status: updates.status ?? existing.status,
        startedAt:
          updates.status === "in_progress" && !existing.startedAt ? new Date() : existing.startedAt,
        completedAt: updates.status === "done" ? new Date() : existing.completedAt,
        updatedAt: new Date(),
      })
      .where(eq(task.id, taskId))

    if (updates.status === "done") {
      const admins = await db
        .select({ id: user.id, email: user.email })
        .from(user)
        .where(eq(user.role, "admin"))

      await Promise.all(
        admins.map((adminUser) =>
          createNotification({
            userId: adminUser.id,
            event: "task_completed",
            title: "Task completed",
            body: `"${existing.title}" was marked done by ${currentUser.name}.`,
            metadata: { taskId, completedBy: currentUser.id },
            email: {
              to: adminUser.email,
              subject: `Task completed: ${existing.title}`,
              preview: "A task has been completed",
              intro: `${currentUser.name} marked "${existing.title}" as complete.`,
            },
          }),
        ),
      )
    }

    await recalculateProjectProgress(existing.projectId)

    return
  }

  throw new Error("Clients cannot edit tasks")
}

export async function bulkDeleteTasksAsAdmin(currentUser: SessionUser, taskIds: string[]) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can delete tasks")
  }
  if (taskIds.length === 0) return 0
  const existingTasks = await db
    .select({ id: task.id, projectId: task.projectId })
    .from(task)
    .where(inArray(task.id, taskIds))
  const result = await db.delete(task).where(inArray(task.id, taskIds))
  const affectedProjectIds = Array.from(new Set(existingTasks.map((item) => item.projectId)))
  await Promise.all(affectedProjectIds.map((projectId) => recalculateProjectProgress(projectId)))
  if ("rowsAffected" in result && typeof result.rowsAffected === "number") {
    return result.rowsAffected
  }
  return taskIds.length
}

export async function canUserChatOnTask(currentUser: SessionUser, taskId: string) {
  if (isAdmin(currentUser.role)) {
    return true
  }

  const [existing] = await db.select().from(task).where(eq(task.id, taskId)).limit(1)
  if (!existing) {
    return false
  }

  if (currentUser.role === "developer") {
    if (existing.assigneeId === currentUser.id) {
      return true
    }
    return canManageProject(currentUser, existing.projectId)
  }

  if (currentUser.role === "client") {
    return canAccessProject(currentUser, existing.projectId)
  }

  return false
}

export async function projectTaskSummary(projectId: string) {
  const [summary] = await db
    .select({
      total: sql<number>`count(*)`,
      done: sql<number>`sum(case when ${task.status} = 'done' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when ${task.status} = 'in_progress' then 1 else 0 end)`,
      overdue: sql<number>`sum(case when ${task.dueDate} < now() and ${task.status} != 'done' then 1 else 0 end)`,
    })
    .from(task)
    .where(eq(task.projectId, projectId))

  return {
    total: Number(summary?.total ?? 0),
    done: Number(summary?.done ?? 0),
    inProgress: Number(summary?.inProgress ?? 0),
    overdue: Number(summary?.overdue ?? 0),
  }
}

export async function reassignTaskAsAdmin(
  currentUser: SessionUser,
  taskId: string,
  newAssigneeId: string,
) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can reassign task")
  }

  const [existing] = await db.select().from(task).where(eq(task.id, taskId)).limit(1)
  if (!existing) {
    throw new Error("Task not found")
  }

  await db
    .update(task)
    .set({
      assigneeId: newAssigneeId,
      updatedAt: new Date(),
    })
    .where(eq(task.id, taskId))
}
