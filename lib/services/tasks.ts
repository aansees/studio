import { and, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { project, projectMember, task, taskAssignment, user } from "@/lib/db/schema"
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
  assigneeIds?: string[]
  status?: typeof task.$inferInsert.status
  dueDate?: Date
}

type UpdateTaskInput = Partial<Omit<CreateTaskInput, "projectId">> & {
  status?: typeof task.$inferInsert.status
}

function normalizeAssigneeIds(input: {
  assigneeId?: string
  assigneeIds?: string[]
}) {
  const values = [
    ...(input.assigneeIds ?? []),
    ...(input.assigneeId ? [input.assigneeId] : []),
  ]

  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
  )
}

async function attachTaskAssignments<T extends { id: string; assigneeId: string | null }>(
  tasks: T[],
) {
  if (tasks.length === 0) {
    return tasks.map((taskItem) => ({
      ...taskItem,
      assigneeIds: taskItem.assigneeId ? [taskItem.assigneeId] : [],
      assignedUsers: [],
    }))
  }

  const taskIds = tasks.map((taskItem) => taskItem.id)
  const assignments = await db
    .select({
      taskId: taskAssignment.taskId,
      userId: taskAssignment.userId,
      name: user.name,
      image: user.image,
      role: user.role,
    })
    .from(taskAssignment)
    .innerJoin(user, eq(user.id, taskAssignment.userId))
    .where(inArray(taskAssignment.taskId, taskIds))

  const assignmentsByTaskId = new Map<
    string,
    Array<{
      id: string
      name: string
      image: string | null
      role: string
    }>
  >()

  for (const assignment of assignments) {
    const existing = assignmentsByTaskId.get(assignment.taskId) ?? []
    existing.push({
      id: assignment.userId,
      name: assignment.name,
      image: assignment.image,
      role: assignment.role,
    })
    assignmentsByTaskId.set(assignment.taskId, existing)
  }

  return tasks.map((taskItem) => {
    const assignedUsers = assignmentsByTaskId.get(taskItem.id) ?? []
    const assigneeIds = assignedUsers.map((assignment) => assignment.id)

    return {
      ...taskItem,
      assigneeIds,
      assignedUsers,
      assigneeId:
        taskItem.assigneeId ??
        assignedUsers[0]?.id ??
        null,
    }
  })
}

export async function listTasksForUser(currentUser: SessionUser, projectId?: string) {
  const rows = await (async () => {
  if (isAdmin(currentUser.role)) {
    const whereClause = projectId ? eq(task.projectId, projectId) : undefined
    return whereClause
      ? db.select().from(task).where(whereClause).orderBy(desc(task.updatedAt))
      : db.select().from(task).orderBy(desc(task.updatedAt))
  }

  if (currentUser.role === "developer") {
    return db
      .select()
      .from(task)
      .where(
        projectId
          ? and(
              eq(task.projectId, projectId),
              sql`exists (
                select 1 from ${taskAssignment}
                where ${taskAssignment.taskId} = ${task.id}
                  and ${taskAssignment.userId} = ${currentUser.id}
              )`,
            )
          : sql`exists (
              select 1 from ${taskAssignment}
              where ${taskAssignment.taskId} = ${task.id}
                and ${taskAssignment.userId} = ${currentUser.id}
            )`,
      )
      .orderBy(desc(task.updatedAt))
  }

  return []
  })()

  return attachTaskAssignments(rows)
}

export async function listProjectTasksForUser(currentUser: SessionUser, projectId: string) {
  if (currentUser.role === "client") {
    throw new Error("Forbidden")
  }

  const hasAccess = await canAccessProject(currentUser, projectId)
  if (!hasAccess) {
    throw new Error("Forbidden")
  }

  const rows = await db
    .select()
    .from(task)
    .where(eq(task.projectId, projectId))
    .orderBy(desc(task.updatedAt))

  return attachTaskAssignments(rows)
}

async function validateTaskAssignees(projectId: string, assigneeIds: string[]) {
  if (assigneeIds.length === 0) {
    return []
  }

  const members = await db
    .select({
      userId: projectMember.userId,
      role: user.role,
    })
    .from(projectMember)
    .innerJoin(user, eq(user.id, projectMember.userId))
    .where(
      and(
        eq(projectMember.projectId, projectId),
        inArray(projectMember.userId, assigneeIds),
      ),
    )

  if (members.length !== assigneeIds.length) {
    throw new Error("All assignees must be members of this project")
  }

  if (members.some((member) => member.role === "client")) {
    throw new Error("Client members cannot be assigned tasks")
  }

  return assigneeIds
}

async function syncTaskAssignments(taskId: string, assigneeIds: string[]) {
  await db.delete(taskAssignment).where(eq(taskAssignment.taskId, taskId))

  if (assigneeIds.length === 0) {
    return
  }

  await db.insert(taskAssignment).values(
    assigneeIds.map((userId) => ({
      taskId,
      userId,
    })),
  )
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

  const assigneeIds = await validateTaskAssignees(
    input.projectId,
    normalizeAssigneeIds(input),
  )

  const [created] = await db
    .insert(task)
    .values({
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? null,
      type: input.type ?? "feature",
      priority: input.priority ?? "medium",
      assigneeId: assigneeIds[0] ?? null,
      status: input.status ?? "todo",
      dueDate: input.dueDate ?? null,
      createdById: currentUser.id,
    })
    .$returningId()

  if (created?.id) {
    await syncTaskAssignments(created.id, assigneeIds)
  }

  await recalculateProjectProgress(input.projectId)

  if (assigneeIds.length > 0) {
    const assignees = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(inArray(user.id, assigneeIds))

    await Promise.all(
      assignees.map((assignee) =>
        createNotification({
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
        }),
      ),
    )
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
    const shouldUpdateAssignments =
      "assigneeIds" in updates || "assigneeId" in updates
    const nextAssigneeIds = shouldUpdateAssignments
      ? await validateTaskAssignees(existing.projectId, normalizeAssigneeIds(updates))
      : undefined

    await db
      .update(task)
      .set({
        title: updates.title,
        description: updates.description,
        type: updates.type,
        priority: updates.priority,
        assigneeId: nextAssigneeIds ? nextAssigneeIds[0] ?? null : undefined,
        status: updates.status,
        dueDate: updates.dueDate,
        startedAt:
          updates.status === "in_progress" && !existing.startedAt ? new Date() : undefined,
        completedAt: updates.status === "done" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(task.id, taskId))

    if (nextAssigneeIds) {
      await syncTaskAssignments(taskId, nextAssigneeIds)
    }

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
    const [assignment] = await db
      .select({ userId: taskAssignment.userId })
      .from(taskAssignment)
      .where(
        and(eq(taskAssignment.taskId, taskId), eq(taskAssignment.userId, currentUser.id)),
      )
      .limit(1)

    if (!assignment && existing.assigneeId !== currentUser.id) {
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
    const [assignment] = await db
      .select({ userId: taskAssignment.userId })
      .from(taskAssignment)
      .where(
        and(eq(taskAssignment.taskId, taskId), eq(taskAssignment.userId, currentUser.id)),
      )
      .limit(1)

    if (assignment || existing.assigneeId === currentUser.id) {
      return true
    }
    return canManageProject(currentUser, existing.projectId)
  }

  if (currentUser.role === "client") {
    return false
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

  await syncTaskAssignments(taskId, [newAssigneeId])
}
