export const PROJECT_STATUSES = [
  "draft",
  "ongoing",
  "on_hold",
  "completed",
  "cancelled",
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_PRIORITIES = ["low", "medium", "high", "urgent"] as const

export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number]

export const TASK_TYPES = [
  "feature",
  "bug",
  "improvement",
  "research",
  "support",
] as const

export type TaskType = (typeof TASK_TYPES)[number]

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "review",
  "blocked",
  "done",
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const

export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const NOTIFICATION_EVENTS = [
  "account_created",
  "promoted_to_developer",
  "added_to_project",
  "task_assigned",
  "task_completed",
  "project_completed",
] as const

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number]
