"use client"

import { addDays, format, startOfWeek, subWeeks } from "date-fns"
import { useMemo, useState } from "react"
import {
  CalendarDaysIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListIcon,
} from "lucide-react"

import { CreateTaskDialog } from "@/components/layout/dashboard/create-task-dialog"
import { ProjectTaskTimeline } from "@/components/layout/dashboard/project-task-timeline"
import { ProjectTasksTable } from "@/components/layout/dashboard/project-tasks-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants/domain"

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

function formatStatusLabel(status: TaskStatus) {
  return status
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
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

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          {activeTab === "timeline" ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                onClick={() => setCurrentWeekStart((current) => subWeeks(current, 1))}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <span>
                  {format(currentWeekStart, "d MMM")} - {format(addDays(currentWeekStart, 6), "d MMM")}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                onClick={() => setCurrentWeekStart((current) => addDays(current, 7))}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          ) : null}
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks"
            className="sm:w-72"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as TaskStatus | "__all__")}
          >
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManageProjectTasks ? (
            <CreateTaskDialog projectId={projectId} assignees={assignees} />
          ) : null}
        </div>
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
