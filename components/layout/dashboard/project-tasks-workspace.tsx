"use client"

import { startOfWeek } from "date-fns"
import { useMemo, useState } from "react"
import { CalendarDaysIcon, ListIcon } from "lucide-react"

import { ProjectTaskTimeline } from "@/components/layout/dashboard/project-task-timeline"
import { ProjectTasksTable } from "@/components/layout/dashboard/project-tasks-table"
import ProjectTasksToolbar from "@/app/(app)/(auth)/dashboard/projects/[projectId]/_components/project_tasks_toolbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type TaskStatus } from "@/lib/constants/domain"

export type ProjectTaskPerson = {
  id: string
  name: string
  image?: string | null
}

export type ProjectTaskRow = {
  id: string
  projectId: string
  title: string
  type: string
  description: string
  priority: string
  status: TaskStatus
  people: ProjectTaskPerson[]
  startDate: string | null
  dueDate: string | null
}

type AssigneeOption = {
  id: string
  name: string
  email: string
  role: string
}

export function ProjectTasksWorkspace({
  projectId,
  canManageProjectTasks,
  initialRows,
  assignees,
}: {
  projectId: string
  canManageProjectTasks: boolean
  initialRows: ProjectTaskRow[]
  assignees: AssigneeOption[]
}) {
  const timelineAnchorDate = useMemo(() => {
    const firstScheduledRow = initialRows.find((row) => row.startDate || row.dueDate)
    const anchor = firstScheduledRow?.startDate ?? firstScheduledRow?.dueDate
    return anchor ? new Date(anchor) : new Date()
  }, [initialRows])

  const [activeTab, setActiveTab] = useState<"list" | "timeline">("list")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "__all__">("__all__")
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(timelineAnchorDate, { weekStartsOn: 1 }),
  )

  const filteredRows = initialRows.filter((row) => {
    const normalized = query.trim().toLowerCase()
    const matchesQuery =
      normalized.length === 0 ||
      row.title.toLowerCase().includes(normalized) ||
      row.type.toLowerCase().includes(normalized) ||
      row.description.toLowerCase().includes(normalized) ||
      row.people.some((person) => person.name.toLowerCase().includes(normalized))
    const matchesStatus = statusFilter === "__all__" || row.status === statusFilter
    return matchesQuery && matchesStatus
  })

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "list" | "timeline")}
      className="w-full space-y-4 h-full"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TabsList>
          <TabsTrigger value="list">
            <ListIcon className="size-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <CalendarDaysIcon className="size-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <ProjectTasksToolbar
          activeTab={activeTab}
          query={query}
          setQuery={(v) => setQuery(v)}
          statusFilter={statusFilter}
          setStatusFilter={(v) => setStatusFilter(v)}
          currentWeekStart={currentWeekStart}
          setCurrentWeekStart={setCurrentWeekStart}
          canManageProjectTasks={canManageProjectTasks}
          projectId={projectId}
          assignees={assignees}
        />
      </div>

      <TabsContent value="list">
        <ProjectTasksTable rows={filteredRows} />
      </TabsContent>
      <TabsContent value="timeline" className="h-full">
        <ProjectTaskTimeline rows={filteredRows} currentWeekStart={currentWeekStart} />
      </TabsContent>
    </Tabs>
  )
}
