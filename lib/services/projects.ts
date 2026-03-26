import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm"
import { eachMonthOfInterval, endOfYear, format, startOfYear } from "date-fns"

import { db } from "@/lib/db"
import { project, projectMember, task, user } from "@/lib/db/schema"
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/lib/constants/domain"
import { createNotification } from "@/lib/notifications"
import type { ProjectAnalytics, ProjectAnalyticsQualityTone } from "@/lib/project-analytics/types"
import type { SessionUser } from "@/lib/session"
import { canAccessProject, isAdmin } from "@/lib/services/access-control"

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

function sanitizeProjectForUser<T extends { devLinks: string | null; credentials: string | null }>(
  currentUser: SessionUser,
  projectRecord: T,
) {
  if (currentUser.role !== "client") {
    return projectRecord
  }

  return {
    ...projectRecord,
    devLinks: null,
    credentials: null,
  }
}

type ProjectRecord = typeof project.$inferSelect

export type ClientProjectApiView = Pick<
  ProjectRecord,
  | "id"
  | "slug"
  | "name"
  | "description"
  | "status"
  | "startDate"
  | "endDate"
  | "completedAt"
  | "progressPercent"
  | "notes"
  | "createdAt"
  | "updatedAt"
>

export type ProjectApiView = ProjectRecord | ClientProjectApiView

function toProjectApiView(currentUser: SessionUser, projectRecord: ProjectRecord): ProjectApiView {
  if (currentUser.role !== "client") {
    return projectRecord
  }

  return {
    id: projectRecord.id,
    slug: projectRecord.slug,
    name: projectRecord.name,
    description: projectRecord.description,
    status: projectRecord.status,
    startDate: projectRecord.startDate,
    endDate: projectRecord.endDate,
    completedAt: projectRecord.completedAt,
    progressPercent: projectRecord.progressPercent,
    notes: projectRecord.notes,
    createdAt: projectRecord.createdAt,
    updatedAt: projectRecord.updatedAt,
  }
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

type CreateProjectProposalInput = {
  name: string
  notes?: string
}

async function getDefaultProposalLead() {
  const [adminLead] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(and(eq(user.role, "admin"), eq(user.isActive, true)))
    .orderBy(asc(user.createdAt), asc(user.name))
    .limit(1)

  if (!adminLead) {
    throw new Error("No active admin is available to receive this proposal")
  }

  return adminLead
}

export async function listProjectsForUser(currentUser: SessionUser) {
  const rows = await (async () => {
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
      .where(
        or(
          eq(project.clientId, currentUser.id),
          sql`exists (
            select 1 from ${projectMember}
            where ${projectMember.projectId} = ${project.id}
              and ${projectMember.userId} = ${currentUser.id}
              and ${projectMember.role} = 'client'
          )`,
        ),
      )
      .orderBy(desc(project.updatedAt))
  })()

  return rows.map((record) => sanitizeProjectForUser(currentUser, record))
}

export async function listProjectsForApi(currentUser: SessionUser) {
  const rows = await listProjectsForUser(currentUser)
  return rows.map((record) => toProjectApiView(currentUser, record))
}

export async function getProjectByIdForUser(projectId: string, currentUser: SessionUser) {
  if (isAdmin(currentUser.role)) {
    const [record] = await db.select().from(project).where(eq(project.id, projectId)).limit(1)
    return record ?? null
  }

  if (currentUser.role === "client") {
    const [record] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          or(
            eq(project.clientId, currentUser.id),
            sql`exists (
              select 1 from ${projectMember}
              where ${projectMember.projectId} = ${project.id}
                and ${projectMember.userId} = ${currentUser.id}
                and ${projectMember.role} = 'client'
            )`,
          ),
        ),
      )
      .limit(1)

    return record ? sanitizeProjectForUser(currentUser, record) : null
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

  return record ? sanitizeProjectForUser(currentUser, record) : null
}

export async function getProjectByIdForApi(projectId: string, currentUser: SessionUser) {
  const record = await getProjectByIdForUser(projectId, currentUser)
  return record ? toProjectApiView(currentUser, record) : null
}

export async function canManageProject(currentUser: SessionUser, projectId: string) {
  if (isAdmin(currentUser.role)) {
    return true
  }

  if (currentUser.role !== "developer") {
    return false
  }

  const [record] = await db
    .select({ projectLeadId: project.projectLeadId })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)

  if (!record) {
    return false
  }

  return record.projectLeadId === currentUser.id
}

export async function listProjectMembersForUser(currentUser: SessionUser, projectId: string) {
  const canAccess = await canAccessProject(currentUser, projectId)
  if (!canAccess) {
    throw new Error("Forbidden")
  }

  return db
    .select({
      userId: projectMember.userId,
      projectRole: projectMember.role,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      isActive: user.isActive,
    })
    .from(projectMember)
      .innerJoin(user, eq(user.id, projectMember.userId))
      .where(eq(projectMember.projectId, projectId))
      .orderBy(asc(user.name))
}

export async function listAssignableUsersForProjectManager(
  currentUser: SessionUser,
  projectId: string,
) {
  const manager = await canManageProject(currentUser, projectId)
  if (!manager) {
    throw new Error("Forbidden: only admins or project lead can assign users")
  }

  if (isAdmin(currentUser.role)) {
    return db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      })
      .from(user)
      .where(or(eq(user.role, "admin"), eq(user.role, "developer"), eq(user.role, "client")))
      .orderBy(asc(user.name))
  }

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })
    .from(user)
    .where(eq(user.role, "developer"))
    .orderBy(asc(user.name))
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
  const normalizedTeamMemberIds = Array.from(
    new Set(
      (input.teamMemberIds ?? [])
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .filter((value) => value !== leadId && value !== input.clientId),
    ),
  )
  const requestedIds = Array.from(
    new Set([leadId, ...normalizedTeamMemberIds, ...(input.clientId ? [input.clientId] : [])]),
  )
  const requestedUsers =
    requestedIds.length > 0
      ? await db
          .select({
            id: user.id,
            role: user.role,
          })
          .from(user)
          .where(inArray(user.id, requestedIds))
      : []
  const roleByUserId = new Map(requestedUsers.map((member) => [member.id, member.role]))

  if (requestedUsers.length !== requestedIds.length) {
    throw new Error("One or more selected users do not exist")
  }

  const leadRole = roleByUserId.get(leadId)
  if (leadRole !== "admin" && leadRole !== "developer") {
    throw new Error("Project lead must be an admin or developer")
  }

  if (input.clientId) {
    const clientRole = roleByUserId.get(input.clientId)
    if (clientRole !== "client") {
      throw new Error("Selected client must have client role")
    }
  }

  for (const memberId of normalizedTeamMemberIds) {
    if (roleByUserId.get(memberId) !== "developer") {
      throw new Error("Team members must have developer role")
    }
  }

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

  const memberIds = new Set<string>([leadId, ...normalizedTeamMemberIds])
  if (input.clientId) {
    memberIds.add(input.clientId)
  }

  if (memberIds.size > 0) {
    await db.insert(projectMember).values(
      Array.from(memberIds).map((memberId) => ({
        projectId,
        userId: memberId,
        role:
          memberId === input.clientId
            ? "client"
            : roleByUserId.get(memberId) === "admin"
              ? "admin"
              : "developer",
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

export async function createProjectProposalAsClient(
  currentUser: SessionUser,
  input: CreateProjectProposalInput,
) {
  if (currentUser.role !== "client") {
    throw new Error("Only clients can submit project proposals")
  }

  const adminLead = await getDefaultProposalLead()
  const slug = `${toSlug(input.name)}-${Date.now().toString(36)}`

  const [created] = await db
    .insert(project)
    .values({
      slug,
      name: input.name,
      description: null,
      status: "draft",
      priority: "medium",
      startDate: null,
      endDate: null,
      projectLeadId: adminLead.id,
      clientId: currentUser.id,
      notes: input.notes ?? null,
      devLinks: null,
      credentials: null,
      createdById: currentUser.id,
    })
    .$returningId()

  const projectId = created?.id
  if (!projectId) {
    throw new Error("Unable to create project proposal")
  }

  await db.insert(projectMember).values([
    {
      projectId,
      userId: adminLead.id,
      role: "admin",
    },
    {
      projectId,
      userId: currentUser.id,
      role: "client",
    },
  ])

  return projectId
}

export async function updateProjectByManager(
  currentUser: SessionUser,
  projectId: string,
  updates: Partial<CreateProjectInput>,
) {
  const [existing] = await db
    .select({
      id: project.id,
      status: project.status,
      clientId: project.clientId,
      name: project.name,
      projectLeadId: project.projectLeadId,
    })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)

  if (!existing) {
    throw new Error("Project not found")
  }

  const isProjectManager =
    isAdmin(currentUser.role) ||
    (currentUser.role === "developer" &&
      existing.projectLeadId === currentUser.id)
  if (!isProjectManager) {
    throw new Error("Forbidden: only admins or project lead can update project")
  }

  const canChangeOwnership = isAdmin(currentUser.role)
  let nextProjectLead:
    | {
        id: string
        role: typeof user.$inferSelect.role
      }
    | undefined

  if (
    canChangeOwnership &&
    updates.projectLeadId &&
    updates.projectLeadId !== existing.projectLeadId
  ) {
    ;[nextProjectLead] = await db
      .select({
        id: user.id,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, updates.projectLeadId))
      .limit(1)

    if (!nextProjectLead) {
      throw new Error("Selected project lead does not exist")
    }

    if (nextProjectLead.role === "client") {
      throw new Error("Project lead must be an admin or developer")
    }
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
      projectLeadId: canChangeOwnership ? updates.projectLeadId : undefined,
      clientId: canChangeOwnership ? updates.clientId : undefined,
      notes: updates.notes,
      devLinks: updates.devLinks,
      credentials: updates.credentials,
      completedAt:
        updates.status === "completed"
          ? new Date()
          : updates.status
            ? null
            : undefined,
      updatedAt: new Date(),
    })
    .where(eq(project.id, projectId))

  if (nextProjectLead) {
    const [existingLeadMembership] = await db
      .select({ userId: projectMember.userId })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, nextProjectLead.id),
        ),
      )
      .limit(1)

    if (!existingLeadMembership) {
      await db.insert(projectMember).values({
        projectId,
        userId: nextProjectLead.id,
        role: nextProjectLead.role === "admin" ? "admin" : "developer",
      })
    }
  }

  if (existing.status !== "completed" && updates.status === "completed") {
    const clientMemberIds = await db
      .select({ userId: projectMember.userId })
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.role, "client")))

    const clientIds = Array.from(
      new Set([
        ...clientMemberIds.map((member) => member.userId),
        ...(existing.clientId ? [existing.clientId] : []),
      ]),
    )

    if (clientIds.length > 0) {
      const clients = await db
        .select({
          id: user.id,
          email: user.email,
        })
        .from(user)
        .where(inArray(user.id, clientIds))

      await Promise.all(
        clients.map((client) =>
          createNotification({
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
          }),
        ),
      )
    }
  }
}

export async function updateProjectAsAdmin(
  currentUser: SessionUser,
  projectId: string,
  updates: Partial<CreateProjectInput>,
) {
  return updateProjectByManager(currentUser, projectId, updates)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function asRatio(count: number, total: number) {
  return total === 0 ? 0 : count / total
}

function asPercent(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100)
}

function qualityToneFromScore(score: number): ProjectAnalyticsQualityTone {
  if (score >= 80) return "strong"
  if (score >= 65) return "stable"
  if (score >= 45) return "watch"
  return "risk"
}

function buildQualitySummary({
  total,
  featureCount,
  improvementCount,
  bugCount,
  supportCount,
  overdueCount,
  blockedCount,
  completedCount,
}: {
  total: number
  featureCount: number
  improvementCount: number
  bugCount: number
  supportCount: number
  overdueCount: number
  blockedCount: number
  completedCount: number
}) {
  if (total === 0) {
    return {
      headline: "No delivery signal yet",
      summary:
        "This project does not have task data yet. Create and assign tasks before relying on analytics.",
    }
  }

  const featureRatio = asRatio(featureCount, total)
  const buildRatio = asRatio(featureCount + improvementCount, total)
  const bugRatio = asRatio(bugCount, total)
  const supportRatio = asRatio(supportCount, total)
  const overdueRate = asRatio(overdueCount, total)
  const blockedRate = asRatio(blockedCount, total)
  const completionRate = asRatio(completedCount, total)

  if (bugRatio > featureRatio && bugRatio >= 0.25) {
    return {
      headline: "Bug pressure is higher than new delivery",
      summary: `Bug fixes account for ${Math.round(
        bugRatio * 100,
      )}% of the workload. When bug work stays higher than feature output, it usually points to implementation debt or unstable requirements.`,
    }
  }

  if (overdueRate >= 0.2 || blockedRate >= 0.15) {
    return {
      headline: "Delivery risk is rising",
      summary: `${Math.round(
        overdueRate * 100,
      )}% of tasks are overdue and ${Math.round(
        blockedRate * 100,
      )}% are blocked. That combination usually slows velocity before quality visibly drops.`,
    }
  }

  if (supportRatio + bugRatio >= 0.5 && completionRate < 0.65) {
    return {
      headline: "The team is operating reactively",
      summary: `Support and bug work represent ${Math.round(
        (supportRatio + bugRatio) * 100,
      )}% of the project. The project is spending more effort on recovery than on net-new delivery.`,
    }
  }

  if (buildRatio >= 0.5 && completionRate >= 0.7) {
    return {
      headline: "Execution quality looks healthy",
      summary:
        "Feature and improvement work still dominate the backlog, and the team is closing tasks at a healthy pace.",
    }
  }

  return {
    headline: "Delivery is stable but needs monitoring",
    summary:
      "The workload is balanced enough to move forward, but the mix of task types and open work should still be reviewed regularly.",
  }
}

export async function getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
  const [existingProject] = await db
    .select({
      id: project.id,
      startDate: project.startDate,
      endDate: project.endDate,
      projectLeadId: project.projectLeadId,
    })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)

  if (!existingProject) {
    throw new Error("Project not found")
  }

  const [projectTasks, projectMembers] = await Promise.all([
    db
      .select({
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: task.status,
        assigneeId: task.assigneeId,
        createdById: task.createdById,
        dueDate: task.dueDate,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })
      .from(task)
      .where(eq(task.projectId, projectId))
      .orderBy(asc(task.createdAt)),
    db
      .select({
        userId: projectMember.userId,
        role: projectMember.role,
        name: user.name,
        image: user.image,
      })
      .from(projectMember)
      .innerJoin(user, eq(user.id, projectMember.userId))
      .where(eq(projectMember.projectId, projectId))
      .orderBy(asc(user.name)),
  ])

  const creatorIds = Array.from(
    new Set(projectTasks.map((taskItem) => taskItem.createdById)),
  )
  const creators =
    creatorIds.length > 0
      ? await db
          .select({
            id: user.id,
            name: user.name,
            image: user.image,
            role: user.role,
          })
          .from(user)
          .where(inArray(user.id, creatorIds))
      : []

  const memberById = new Map(
    projectMembers.map((member) => [
      member.userId,
      {
        name: member.name,
        image: member.image ?? null,
        role: member.role,
      },
    ]),
  )
  const creatorById = new Map(
    creators.map((creator) => [
      creator.id,
      {
        name: creator.name,
        image: creator.image ?? null,
        role: creator.role,
      },
    ]),
  )
  const now = new Date()

  const statusCounts = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, 0]),
  ) as Record<TaskStatus, number>
  const typeCounts = Object.fromEntries(
    TASK_TYPES.map((type) => [type, 0]),
  ) as Record<TaskType, number>
  const priorityCounts = Object.fromEntries(
    TASK_PRIORITIES.map((priority) => [priority, 0]),
  ) as Record<TaskPriority, number>

  let overdueCount = 0
  let unassignedCount = 0

  const assigneeMap = new Map<
    string,
    ProjectAnalytics["assigneeBreakdown"][number]
  >(
    projectMembers
      .filter((member) => member.role !== "client")
      .map((member) => [
        member.userId,
        {
          assigneeId: member.userId,
          name: member.name,
          image: member.image ?? null,
          role: member.role,
          total: 0,
          completed: 0,
          inProgress: 0,
          review: 0,
          blocked: 0,
          overdue: 0,
          featureCount: 0,
          bugCount: 0,
          researchCount: 0,
          improvementCount: 0,
          supportCount: 0,
          completionRate: 0,
          activeLoad: 0,
        },
      ]),
  )

  const creatorMap = new Map<
    string,
    ProjectAnalytics["creatorBreakdown"][number]
  >(
    creators.map((creator) => [
      creator.id,
      {
        creatorId: creator.id,
        name: creator.name,
        image: creator.image ?? null,
        total: 0,
        share: 0,
      },
    ]),
  )

  for (const taskItem of projectTasks) {
    const taskStatus = TASK_STATUSES.includes(taskItem.status as TaskStatus)
      ? (taskItem.status as TaskStatus)
      : "todo"
    const taskType = TASK_TYPES.includes(taskItem.type as TaskType)
      ? (taskItem.type as TaskType)
      : "feature"
    const taskPriority = TASK_PRIORITIES.includes(
      taskItem.priority as TaskPriority,
    )
      ? (taskItem.priority as TaskPriority)
      : "medium"

    statusCounts[taskStatus] += 1
    typeCounts[taskType] += 1
    priorityCounts[taskPriority] += 1

    const isOverdue =
      Boolean(taskItem.dueDate) &&
      taskStatus !== "done" &&
      new Date(taskItem.dueDate as Date).getTime() < now.getTime()

    if (isOverdue) {
      overdueCount += 1
    }

    if (!taskItem.assigneeId) {
      unassignedCount += 1
    }

    if (taskItem.assigneeId) {
      const fallbackMember = creatorById.get(taskItem.assigneeId) ?? {
        name: "Unknown assignee",
        image: null,
        role: "developer",
      }
      const existingAssignee =
        assigneeMap.get(taskItem.assigneeId) ?? {
          assigneeId: taskItem.assigneeId,
          name: fallbackMember.name,
          image: fallbackMember.image,
          role: fallbackMember.role,
          total: 0,
          completed: 0,
          inProgress: 0,
          review: 0,
          blocked: 0,
          overdue: 0,
          featureCount: 0,
          bugCount: 0,
          researchCount: 0,
          improvementCount: 0,
          supportCount: 0,
          completionRate: 0,
          activeLoad: 0,
        }

      existingAssignee.total += 1
      if (taskStatus === "done") existingAssignee.completed += 1
      if (taskStatus === "in_progress") existingAssignee.inProgress += 1
      if (taskStatus === "review") existingAssignee.review += 1
      if (taskStatus === "blocked") existingAssignee.blocked += 1
      if (isOverdue) existingAssignee.overdue += 1

      if (taskType === "feature") existingAssignee.featureCount += 1
      if (taskType === "bug") existingAssignee.bugCount += 1
      if (taskType === "research") existingAssignee.researchCount += 1
      if (taskType === "improvement") existingAssignee.improvementCount += 1
      if (taskType === "support") existingAssignee.supportCount += 1

      assigneeMap.set(taskItem.assigneeId, existingAssignee)
    }

    const fallbackCreator = memberById.get(taskItem.createdById) ?? {
      name: "Unknown owner",
      image: null,
      role: "admin",
    }
    const existingCreator =
      creatorMap.get(taskItem.createdById) ?? {
        creatorId: taskItem.createdById,
        name: fallbackCreator.name,
        image: fallbackCreator.image,
        total: 0,
        share: 0,
      }
    existingCreator.total += 1
    creatorMap.set(taskItem.createdById, existingCreator)
  }

  const total = projectTasks.length
  const completed = statusCounts.done
  const inProgress = statusCounts.in_progress
  const review = statusCounts.review
  const blocked = statusCounts.blocked
  const todo = statusCounts.todo
  const open = total - completed
  const maintenanceRatio = asRatio(typeCounts.bug + typeCounts.support, total)
  const completionRate = asPercent(completed, total)

  const currentYearStart = startOfYear(now)
  const currentYearEnd = endOfYear(now)
  const currentMonthIndex = now.getMonth()
  const monthlyThroughput = eachMonthOfInterval({
    start: currentYearStart,
    end: currentYearEnd,
  }).map((monthStart, index) => {
    const monthKey = format(monthStart, "yyyy-MM")
    const createdInMonth = projectTasks.filter(
      (taskItem) => format(taskItem.createdAt, "yyyy-MM") === monthKey,
    ).length
    const completedInMonth = projectTasks.filter(
      (taskItem) =>
        Boolean(taskItem.completedAt) &&
        format(taskItem.completedAt as Date, "yyyy-MM") === monthKey,
    ).length

    return {
      key: monthKey,
      label: format(monthStart, "MMM"),
      created: createdInMonth,
      completed: completedInMonth,
      active: index === currentMonthIndex,
    }
  })

  const qualitySummary = buildQualitySummary({
    total,
    featureCount: typeCounts.feature,
    improvementCount: typeCounts.improvement,
    bugCount: typeCounts.bug,
    supportCount: typeCounts.support,
    overdueCount,
    blockedCount: blocked,
    completedCount: completed,
  })

  const qualityScore = clamp(
    Math.round(
      100 -
        asRatio(typeCounts.bug, total) * 40 -
        maintenanceRatio * 15 -
        asRatio(overdueCount, total) * 25 -
        asRatio(blocked, total) * 15 -
        (1 - asRatio(completed, total)) * 20,
    ),
    0,
    100,
  )

  const openTimelineItems = projectTasks
    .filter((taskItem) => taskItem.status !== "done")
    .map((taskItem) => {
      const anchorDate =
        taskItem.dueDate ?? taskItem.startedAt ?? taskItem.createdAt
      const isOverdue =
        Boolean(taskItem.dueDate) &&
        new Date(taskItem.dueDate as Date).getTime() < now.getTime()

      return {
        id: taskItem.id,
        href: `/projects/${projectId}/tasks/${taskItem.id}`,
        title: taskItem.title,
        sortDate: anchorDate,
        dateLabel: format(anchorDate, "MMMM d"),
        meta: isOverdue
          ? "Overdue task"
          : taskItem.status === "in_progress"
            ? "In progress"
            : taskItem.status === "review"
              ? "In review"
              : "Planned",
        state: isOverdue
          ? "late"
          : taskItem.status === "in_progress"
            ? "active"
            : "planned",
      } as const
    })
    .sort((left, right) => left.sortDate.getTime() - right.sortDate.getTime())
    .slice(0, 3)

  const completedTimelineItems = projectTasks
    .filter((taskItem) => taskItem.status === "done" && taskItem.completedAt)
    .map((taskItem) => ({
      id: taskItem.id,
      href: `/projects/${projectId}/tasks/${taskItem.id}`,
      title: taskItem.title,
      sortDate: taskItem.completedAt as Date,
      dateLabel: format(taskItem.completedAt as Date, "MMMM d"),
      meta: "Completed milestone",
      state: "completed" as const,
    }))
    .sort((left, right) => right.sortDate.getTime() - left.sortDate.getTime())
    .slice(0, 2)

  const timeline = [...openTimelineItems, ...completedTimelineItems]
    .sort((left, right) => left.sortDate.getTime() - right.sortDate.getTime())
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      href: item.href,
      title: item.title,
      dateLabel: item.dateLabel,
      meta: item.meta,
      state: item.state,
    }))

  const assigneeBreakdown = Array.from(assigneeMap.values())
    .map((item) => ({
      ...item,
      completionRate: asPercent(item.completed, item.total),
      activeLoad: item.total - item.completed,
    }))
    .sort((left, right) => {
      if (right.total !== left.total) {
        return right.total - left.total
      }
      return right.completionRate - left.completionRate
    })

  const creatorBreakdown = Array.from(creatorMap.values())
    .map((item) => ({
      ...item,
      share: asPercent(item.total, total),
    }))
    .sort((left, right) => right.total - left.total)

  return {
    summary: {
      total,
      completed,
      overdue: overdueCount,
      todo,
      inProgress,
      review,
      blocked,
      open,
      unassigned: unassignedCount,
      completionRate,
      maintenanceRatio: Math.round(maintenanceRatio * 100),
    },
    throughputEvents: projectTasks.map((taskItem) => ({
      createdAt: taskItem.createdAt.toISOString(),
      completedAt: taskItem.completedAt
        ? new Date(taskItem.completedAt).toISOString()
        : null,
    })),
    monthlyThroughput,
    statusBreakdown: TASK_STATUSES.map((status) => ({
      status,
      count: statusCounts[status],
      ratio: asRatio(statusCounts[status], total),
    })),
    typeBreakdown: TASK_TYPES.map((type) => ({
      type,
      count: typeCounts[type],
      ratio: asRatio(typeCounts[type], total),
    })),
    priorityBreakdown: TASK_PRIORITIES.map((priority) => ({
      priority,
      count: priorityCounts[priority],
      ratio: asRatio(priorityCounts[priority], total),
    })),
    assigneeBreakdown,
    creatorBreakdown,
    quality: {
      score: qualityScore,
      tone: qualityToneFromScore(qualityScore),
      headline: qualitySummary.headline,
      summary: qualitySummary.summary,
      bugRatio: asRatio(typeCounts.bug, total),
      maintenanceRatio,
      overdueRate: asRatio(overdueCount, total),
      blockedRate: asRatio(blocked, total),
      completionRate: asRatio(completed, total),
    },
    timeline,
    teamSummary: {
      members: projectMembers.length,
      developers: projectMembers.filter((member) => member.role !== "client")
        .length,
      clients: projectMembers.filter((member) => member.role === "client")
        .length,
      activeAssignees: assigneeBreakdown.filter((member) => member.total > 0)
        .length,
    },
  }
}

export async function recalculateProjectProgress(projectId: string) {
  const [summary] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${task.status} = 'done' then 1 else 0 end)`,
    })
    .from(task)
    .where(eq(task.projectId, projectId))

  const total = Number(summary?.total ?? 0)
  const completed = Number(summary?.completed ?? 0)
  const progressPercent =
    total === 0 ? 0 : Math.max(0, Math.min(100, Math.round((completed / total) * 100)))

  await db
    .update(project)
    .set({
      progressPercent,
      updatedAt: new Date(),
    })
    .where(eq(project.id, projectId))

  return progressPercent
}

export async function updateProjectMembersAsAdmin(
  currentUser: SessionUser,
  projectId: string,
  memberIds: string[],
  clientIds: string[] = [],
) {
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

  const manager =
    isAdmin(currentUser.role) ||
    (currentUser.role === "developer" &&
      existingProject.projectLeadId === currentUser.id)
  if (!manager) {
    throw new Error("Forbidden: only admins or project lead can update members")
  }

  const existingMembers = await db
    .select({
      userId: projectMember.userId,
      role: projectMember.role,
    })
    .from(projectMember)
    .where(eq(projectMember.projectId, projectId))

  const canManageClients = isAdmin(currentUser.role)
  const existingClientIds = existingMembers
    .filter((member) => member.role === "client")
    .map((member) => member.userId)
  const normalizedClientIds = canManageClients
    ? Array.from(new Set(clientIds))
    : existingClientIds

  if (!canManageClients && clientIds.length > 0) {
    throw new Error("Only admins can manage project clients")
  }

  const requestedIds = Array.from(
    new Set([...memberIds, ...normalizedClientIds]),
  )
  if (requestedIds.length > 0) {
    const requestedUsers = await db
      .select({
        id: user.id,
        role: user.role,
      })
      .from(user)
      .where(inArray(user.id, requestedIds))

    const roleByUserId = new Map(requestedUsers.map((item) => [item.id, item.role]))
    for (const memberId of memberIds) {
      const role = roleByUserId.get(memberId)
      if (!role) {
        throw new Error("One or more selected members do not exist")
      }
      if (role !== "developer") {
        throw new Error("Only developer members can be added to project team")
      }
    }

    for (const clientId of normalizedClientIds) {
      const role = roleByUserId.get(clientId)
      if (!role) {
        throw new Error("One or more selected clients do not exist")
      }
      if (role !== "client") {
        throw new Error("Selected clients must have client role")
      }
    }
  }
  const nextMembers = new Set<string>([existingProject.projectLeadId, ...memberIds])
  normalizedClientIds.forEach((clientId) => nextMembers.add(clientId))

  const memberRoleRecords =
    nextMembers.size > 0
      ? await db
          .select({
            id: user.id,
            role: user.role,
          })
      .from(user)
      .where(inArray(user.id, Array.from(nextMembers)))
      : []
  const roleByUserId = new Map(memberRoleRecords.map((item) => [item.id, item.role]))

  await db.delete(projectMember).where(eq(projectMember.projectId, projectId))

  if (nextMembers.size > 0) {
    await db.insert(projectMember).values(
      Array.from(nextMembers).map((userId) => ({
        projectId,
        userId,
        role: normalizedClientIds.includes(userId)
          ? "client"
          : roleByUserId.get(userId) === "admin"
            ? "admin"
            : "developer",
      })),
    )
  }

  await db
    .update(project)
    .set({
      clientId: normalizedClientIds[0] ?? null,
      updatedAt: new Date(),
    })
    .where(eq(project.id, projectId))

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

export async function updateProjectMembersByManager(
  currentUser: SessionUser,
  projectId: string,
  memberIds: string[],
  clientIds: string[] = [],
) {
  return updateProjectMembersAsAdmin(currentUser, projectId, memberIds, clientIds)
}
