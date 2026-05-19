"use client"

import ProjectTasksTableView from "@/app/(app)/(auth)/dashboard/projects/[projectId]/_components/project_tasks_table"
import type { ProjectTaskRow } from "@/components/layout/dashboard/project-tasks-workspace"

export function ProjectTasksTable({ rows }: { rows: ProjectTaskRow[] }) {
  return <ProjectTasksTableView rows={rows} />
}
