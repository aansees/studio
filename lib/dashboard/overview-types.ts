import type { ProjectPriority, ProjectStatus, TaskPriority, TaskStatus } from "@/lib/constants/domain"
import type { UserRole } from "@/lib/constants/rbac"

export type DashboardCardTone = "neutral" | "positive" | "warning"

export type DashboardCardItem = {
  id: string
  title: string
  value: number
  description: string
  tone?: DashboardCardTone
}

export type DashboardStatusDatum = {
  status: TaskStatus
  count: number
}

export type DashboardTaskRow = {
  id: string
  title: string
  projectId: string
  projectName: string
  assigneeLabel: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
}

export type DashboardProjectRow = {
  id: string
  name: string
  status: ProjectStatus
  priority: ProjectPriority
  progressPercent: number
  endDate: string | null
}

export type DashboardOverview = {
  role: UserRole
  cards: DashboardCardItem[]
  statusChart: DashboardStatusDatum[]
  recentTasks: DashboardTaskRow[]
  recentProjects: DashboardProjectRow[]
}
