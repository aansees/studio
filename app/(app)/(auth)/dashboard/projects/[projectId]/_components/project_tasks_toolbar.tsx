"use client"

import { addDays, format, startOfWeek, subWeeks } from "date-fns"
import { CalendarDaysIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ListIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VisualSelect } from "@/components/ui/visual-select"
import { taskStatusOptions } from "@/lib/constants/domain-display"
import { type TaskStatus } from "@/lib/constants/domain"
import { CreateTaskDialog } from "@/components/layout/dashboard/create-task-dialog"

export default function ProjectTasksToolbar({
  activeTab,
  setActiveTab,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  currentWeekStart,
  setCurrentWeekStart,
  canManageProjectTasks,
  projectId,
  assignees,
}: {
  activeTab: "list" | "timeline"
  setActiveTab: (v: "list" | "timeline") => void
  query: string
  setQuery: (v: string) => void
  statusFilter: TaskStatus | "__all__"
  setStatusFilter: (v: TaskStatus | "__all__") => void
  currentWeekStart: Date
  setCurrentWeekStart: (d: Date | ((d: Date) => Date)) => void
  canManageProjectTasks: boolean
  projectId: string
  assignees: any[]
}) {
  return (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
      {activeTab === "timeline" ? (
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" className="size-9" onClick={() => setCurrentWeekStart((current) => subWeeks(current, 1))}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span>
              {format(currentWeekStart, "d MMM")} - {format(addDays(currentWeekStart, 6), "d MMM")}
            </span>
          </div>
          <Button type="button" variant="outline" size="icon" className="size-9" onClick={() => setCurrentWeekStart((current) => addDays(current, 7))}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      ) : null}

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" className="sm:w-72" />

      <VisualSelect
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as TaskStatus | "__all__")}
        options={[{ value: "__all__", label: "All statuses" }, ...taskStatusOptions]}
        placeholder="Status"
        triggerClassName="sm:w-44"
      />

      {canManageProjectTasks ? <CreateTaskDialog projectId={projectId} assignees={assignees} /> : null}
    </div>
  )
}
