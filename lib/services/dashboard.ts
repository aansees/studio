import { inArray } from "drizzle-orm"

import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type ProjectPriority,
  type ProjectStatus,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/constants/domain"
import type {
  DashboardCardItem,
  DashboardOverview,
  DashboardProjectRow,
  DashboardStatusDatum,
  DashboardTaskRow,
} from "@/lib/dashboard/overview-types"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import type { SessionUser } from "@/lib/session"
import { listProjectsForUser } from "@/lib/services/projects"
import { listTasksForUser } from "@/lib/services/tasks"

function isTaskOverdue(taskRecord: { dueDate: Date | null; status: string }) {
  if (!taskRecord.dueDate) {
    return false
  }
  if (taskRecord.status === "done") {
    return false
  }
  return taskRecord.dueDate.getTime() < Date.now()
}

function normalizeTaskStatus(value: string): TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus) ? (value as TaskStatus) : "todo"
}

function normalizeTaskPriority(value: string): TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority) ? (value as TaskPriority) : "medium"
}

function normalizeProjectStatus(value: string): ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus)
    ? (value as ProjectStatus)
    : "draft"
}

function normalizeProjectPriority(value: string): ProjectPriority {
  return PROJECT_PRIORITIES.includes(value as ProjectPriority)
    ? (value as ProjectPriority)
    : "medium"
}

function createCardsForRole(
  role: SessionUser["role"],
  projects: Array<{ status: string }>,
  tasks: Array<{ status: string; dueDate: Date | null }>,
): DashboardCardItem[] {
  const totalProjects = projects.length
  const ongoingProjects = projects.filter((item) => item.status === "ongoing").length
  const completedProjects = projects.filter((item) => item.status === "completed").length
  const totalTasks = tasks.length
  const inProgressTasks = tasks.filter((item) => item.status === "in_progress").length
  const doneTasks = tasks.filter((item) => item.status === "done").length
  const overdueTasks = tasks.filter(isTaskOverdue).length

  if (role === "admin") {
    return [
      {
        id: "projects_total",
        title: "Total Projects",
        value: totalProjects,
        description: "Across all clients and teams",
      },
      {
        id: "projects_ongoing",
        title: "Ongoing Projects",
        value: ongoingProjects,
        description: "Currently in delivery",
        tone: "positive",
      },
      {
        id: "tasks_total",
        title: "Total Tasks",
        value: totalTasks,
        description: "All tracked project tasks",
      },
      {
        id: "tasks_overdue",
        title: "Overdue Tasks",
        value: overdueTasks,
        description: "Need immediate attention",
        tone: overdueTasks > 0 ? "warning" : "positive",
      },
    ]
  }

  if (role === "developer") {
    return [
      {
        id: "tasks_assigned",
        title: "Assigned Tasks",
        value: totalTasks,
        description: "Tasks assigned to you",
      },
      {
        id: "tasks_in_progress",
        title: "In Progress",
        value: inProgressTasks,
        description: "Tasks currently in progress",
        tone: "positive",
      },
      {
        id: "tasks_done",
        title: "Completed",
        value: doneTasks,
        description: "Tasks finished by you",
        tone: "positive",
      },
      {
        id: "tasks_overdue",
        title: "Overdue",
        value: overdueTasks,
        description: "Assigned tasks past due date",
        tone: overdueTasks > 0 ? "warning" : "positive",
      },
    ]
  }

  return [
    {
      id: "projects_total",
      title: "My Projects",
      value: totalProjects,
      description: "Projects visible to your account",
    },
    {
      id: "projects_ongoing",
      title: "Ongoing",
      value: ongoingProjects,
      description: "Projects currently in progress",
      tone: "positive",
    },
    {
      id: "projects_completed",
      title: "Completed",
      value: completedProjects,
      description: "Projects delivered",
      tone: "positive",
    },
    {
      id: "tasks_overdue",
      title: "Overdue Tasks",
      value: overdueTasks,
      description: "Pending tasks in your projects",
      tone: overdueTasks > 0 ? "warning" : "positive",
    },
  ]
}

export async function getDashboardOverview(currentUser: SessionUser): Promise<DashboardOverview> {
  const [projects, tasks] = await Promise.all([
    listProjectsForUser(currentUser),
    listTasksForUser(currentUser),
  ])

  const projectNameById = new Map(projects.map((item) => [item.id, item.name]))

  const assigneeIds = Array.from(
    new Set(
      tasks
        .map((item) => item.assigneeId)
        .filter((item): item is string => typeof item === "string" && item.length > 0),
    ),
  )

  const assigneeNameById = new Map<string, string>()
  if (assigneeIds.length > 0 && currentUser.role !== "client") {
    const assignees = await db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(inArray(user.id, assigneeIds))

    for (const assignee of assignees) {
      assigneeNameById.set(assignee.id, assignee.name)
    }
  }

  const recentTasks: DashboardTaskRow[] = tasks.slice(0, 25).map((item) => {
    const assigneeLabel =
      currentUser.role === "client"
        ? item.assigneeId
          ? "Assigned developer"
          : "Unassigned"
        : item.assigneeId
          ? assigneeNameById.get(item.assigneeId) ?? "Unknown"
          : "Unassigned"

    return {
      id: item.id,
      title: item.title,
      projectId: item.projectId,
      projectName: projectNameById.get(item.projectId) ?? "Unknown project",
      assigneeLabel,
      status: normalizeTaskStatus(item.status),
      priority: normalizeTaskPriority(item.priority),
      dueDate: item.dueDate ? item.dueDate.toISOString() : null,
    }
  })

  const recentProjects: DashboardProjectRow[] = projects.slice(0, 12).map((item) => ({
    id: item.id,
    name: item.name,
    status: normalizeProjectStatus(item.status),
    priority: normalizeProjectPriority(item.priority),
    progressPercent: item.progressPercent,
    endDate: item.endDate ? item.endDate.toISOString() : null,
  }))

  const statusChart: DashboardStatusDatum[] = TASK_STATUSES.map((status) => ({
    status,
    count: tasks.filter((item) => item.status === status).length,
  }))

  return {
    role: currentUser.role,
    cards: createCardsForRole(currentUser.role, projects, tasks),
    statusChart,
    recentTasks,
    recentProjects,
  }
}
