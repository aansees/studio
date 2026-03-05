import { and, desc, eq, inArray, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { project, projectMember, task, user } from "@/lib/db/schema"
import { createNotification } from "@/lib/notifications"
import type { SessionUser } from "@/lib/session"
import { isAdmin } from "@/lib/services/access-control"

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

type CreateProjectInput = {
  name: string
  description?: string
  status?: typeof project.$inferInsert.status
  priority?: typeof project.$inferInsert.priority
  startDate?: Date
  endDate?: Date
  projectLeadId?: string
  clientId?: string
  teamMemberIds?: string[]
  notes?: string
  devLinks?: string
  credentials?: string
}

export async function listProjectsForUser(currentUser: SessionUser) {
  if (isAdmin(currentUser.role)) {
    return db
      .select()
      .from(project)
      .orderBy(desc(project.updatedAt))
  }

  if (currentUser.role === "developer") {
    const memberships = await db
      .select({ projectId: projectMember.projectId })
      .from(projectMember)
      .where(eq(projectMember.userId, currentUser.id))

    const memberProjectIds = memberships.map((record) => record.projectId)
    if (memberProjectIds.length === 0) {
      return db
        .select()
        .from(project)
        .where(eq(project.projectLeadId, currentUser.id))
        .orderBy(desc(project.updatedAt))
    }

    return db
      .select()
      .from(project)
      .where(
        or(
          inArray(project.id, memberProjectIds),
          eq(project.projectLeadId, currentUser.id),
        ),
      )
      .orderBy(desc(project.updatedAt))
  }

  return db
    .select()
    .from(project)
    .where(eq(project.clientId, currentUser.id))
    .orderBy(desc(project.updatedAt))
}

export async function getProjectByIdForUser(projectId: string, currentUser: SessionUser) {
  if (isAdmin(currentUser.role)) {
    const [record] = await db.select().from(project).where(eq(project.id, projectId)).limit(1)
    return record ?? null
  }

  const [record] = await db
    .select()
    .from(project)
    .where(
      and(
        eq(project.id, projectId),
        or(
          eq(project.clientId, currentUser.id),
          eq(project.projectLeadId, currentUser.id),
          sql`exists (
            select 1 from ${projectMember}
            where ${projectMember.projectId} = ${project.id}
              and ${projectMember.userId} = ${currentUser.id}
          )`,
        ),
      ),
    )
    .limit(1)

  return record ?? null
}

export async function createProjectAsAdmin(
  currentUser: SessionUser,
  input: CreateProjectInput,
) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can create projects")
  }

  const slug = `${toSlug(input.name)}-${Date.now().toString(36)}`
  const leadId = input.projectLeadId ?? currentUser.id

  const [created] = await db
    .insert(project)
    .values({
      slug,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "draft",
      priority: input.priority ?? "medium",
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      projectLeadId: leadId,
      clientId: input.clientId ?? null,
      notes: input.notes ?? null,
      devLinks: input.devLinks ?? null,
      credentials: input.credentials ?? null,
      createdById: currentUser.id,
    })
    .$returningId()

  const projectId = created?.id
  if (!projectId) {
    throw new Error("Unable to create project")
  }

  const memberIds = new Set<string>([leadId, ...(input.teamMemberIds ?? [])])
  if (input.clientId) {
    memberIds.add(input.clientId)
  }

  if (memberIds.size > 0) {
    await db.insert(projectMember).values(
      Array.from(memberIds).map((memberId) => ({
        projectId,
        userId: memberId,
        role: memberId === input.clientId ? "client" : "developer",
      })),
    )
  }

  const members = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(inArray(user.id, Array.from(memberIds)))

  await Promise.all(
    members.map((member) =>
      createNotification({
        userId: member.id,
        event: "added_to_project",
        title: "You were added to a project",
        body: `${currentUser.name} added you to ${input.name}.`,
        metadata: { projectId, projectName: input.name },
        email: {
          to: member.email,
          subject: `Added to project: ${input.name}`,
          preview: `You were added to ${input.name}`,
          intro: `You were added to project "${input.name}".`,
          lines: [
            `Project lead: ${leadId === currentUser.id ? currentUser.name : "Assigned lead"}`,
          ],
          ctaLabel: "Open dashboard",
          ctaUrl: "/dashboard",
        },
      }),
    ),
  )

  return projectId
}

export async function updateProjectAsAdmin(
  currentUser: SessionUser,
  projectId: string,
  updates: Partial<CreateProjectInput> & { progressPercent?: number },
) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can update project")
  }

  const [existing] = await db
    .select({
      id: project.id,
      status: project.status,
      clientId: project.clientId,
      name: project.name,
    })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)

  if (!existing) {
    throw new Error("Project not found")
  }

  await db
    .update(project)
    .set({
      name: updates.name,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      startDate: updates.startDate,
      endDate: updates.endDate,
      projectLeadId: updates.projectLeadId,
      clientId: updates.clientId,
      notes: updates.notes,
      devLinks: updates.devLinks,
      credentials: updates.credentials,
      progressPercent: updates.progressPercent,
      completedAt: updates.status === "completed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(project.id, projectId))

  if (existing.status !== "completed" && updates.status === "completed" && existing.clientId) {
    const [client] = await db
      .select({
        id: user.id,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, existing.clientId))
      .limit(1)

    if (client) {
      await createNotification({
        userId: client.id,
        event: "project_completed",
        title: "Project completed",
        body: `"${existing.name}" has been marked as completed.`,
        metadata: { projectId: existing.id },
        email: {
          to: client.email,
          subject: `Project completed: ${existing.name}`,
          preview: "Your project is complete",
          intro: `Your project "${existing.name}" has been marked complete.`,
          ctaLabel: "View project",
          ctaUrl: `/projects/${existing.id}`,
        },
      })
    }
  }
}

export async function getProjectAnalytics(projectId: string) {
  const [summary] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${task.status} = 'done' then 1 else 0 end)`,
      overdue: sql<number>`sum(case when ${task.dueDate} < now() and ${task.status} != 'done' then 1 else 0 end)`,
    })
    .from(task)
    .where(eq(task.projectId, projectId))

  const assigneeBreakdown = await db
    .select({
      assigneeId: task.assigneeId,
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${task.status} = 'done' then 1 else 0 end)`,
    })
    .from(task)
    .where(eq(task.projectId, projectId))
    .groupBy(task.assigneeId)

  return {
    summary: {
      total: Number(summary?.total ?? 0),
      completed: Number(summary?.completed ?? 0),
      overdue: Number(summary?.overdue ?? 0),
    },
    assigneeBreakdown: assigneeBreakdown.map((item) => ({
      assigneeId: item.assigneeId,
      total: Number(item.total ?? 0),
      completed: Number(item.completed ?? 0),
    })),
  }
}

export async function updateProjectMembersAsAdmin(
  currentUser: SessionUser,
  projectId: string,
  memberIds: string[],
  clientId?: string,
) {
  if (!isAdmin(currentUser.role)) {
    throw new Error("Only admins can update members")
  }

  const [existingProject] = await db
    .select({
      id: project.id,
      projectLeadId: project.projectLeadId,
      name: project.name,
    })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)

  if (!existingProject) {
    throw new Error("Project not found")
  }

  const existingMembers = await db
    .select({ userId: projectMember.userId })
    .from(projectMember)
    .where(eq(projectMember.projectId, projectId))

  const nextMembers = new Set<string>([existingProject.projectLeadId, ...memberIds])
  if (clientId) {
    nextMembers.add(clientId)
  }

  await db.delete(projectMember).where(eq(projectMember.projectId, projectId))

  if (nextMembers.size > 0) {
    await db.insert(projectMember).values(
      Array.from(nextMembers).map((userId) => ({
        projectId,
        userId,
        role: userId === clientId ? "client" : "developer",
      })),
    )
  }

  const previousSet = new Set(existingMembers.map((member) => member.userId))
  const newlyAddedUserIds = Array.from(nextMembers).filter((id) => !previousSet.has(id))

  if (newlyAddedUserIds.length > 0) {
    const users = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(inArray(user.id, newlyAddedUserIds))

    await Promise.all(
      users.map((member) =>
        createNotification({
          userId: member.id,
          event: "added_to_project",
          title: "You were added to a project",
          body: `${currentUser.name} added you to ${existingProject.name}.`,
          metadata: {
            projectId,
            projectName: existingProject.name,
          },
          email: {
            to: member.email,
            subject: `Added to project: ${existingProject.name}`,
            preview: "You were added to a project",
            intro: `You were added to "${existingProject.name}".`,
            ctaLabel: "Open dashboard",
            ctaUrl: "/dashboard",
          },
        }),
      ),
    )
  }
}
