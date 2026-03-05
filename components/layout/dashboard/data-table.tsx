"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants/domain"
import type { DashboardTaskRow } from "@/lib/dashboard/overview-types"
import { Frame } from "@/components/ui/frame"

type DataTableProps = {
  data: DashboardTaskRow[]
  canManageTasks: boolean
  canBulkDelete: boolean
}

function formatStatusLabel(status: TaskStatus) {
  return status
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function formatDueDate(value: string | null) {
  if (!value) {
    return "-"
  }
  return new Date(value).toLocaleDateString()
}

export function DataTable({ data, canManageTasks, canBulkDelete }: DataTableProps) {
  const [rows, setRows] = React.useState(data)
  const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({})
  const [query, setQuery] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    setRows(data)
    setSelectedIds({})
  }, [data])

  const filteredRows = React.useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return rows
    }

    return rows.filter((row) => {
      return (
        row.title.toLowerCase().includes(normalized) ||
        row.projectName.toLowerCase().includes(normalized) ||
        row.assigneeLabel.toLowerCase().includes(normalized)
      )
    })
  }, [query, rows])

  const selectedCount = React.useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds],
  )
  const showSelection = canManageTasks || canBulkDelete

  const allFilteredSelected =
    filteredRows.length > 0 && filteredRows.every((row) => selectedIds[row.id])

  function toggleSelectAll() {
    setSelectedIds((current) => {
      if (allFilteredSelected) {
        const next = { ...current }
        for (const row of filteredRows) {
          delete next[row.id]
        }
        return next
      }

      const next = { ...current }
      for (const row of filteredRows) {
        next[row.id] = true
      }
      return next
    })
  }

  function toggleRowSelection(taskId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = { ...current }
      if (checked) {
        next[taskId] = true
      } else {
        delete next[taskId]
      }
      return next
    })
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Unable to update task status")
      }

      setRows((current) =>
        current.map((row) =>
          row.id === taskId
            ? {
                ...row,
                status,
              }
            : row,
        ),
      )
      toast.success("Task status updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update task status"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function bulkUpdateStatus(status: TaskStatus) {
    const taskIds = Object.keys(selectedIds).filter((id) => selectedIds[id])
    if (taskIds.length === 0) {
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/tasks/bulk", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ taskIds, status }),
      })

      if (!response.ok) {
        throw new Error("Unable to update selected tasks")
      }

      setRows((current) =>
        current.map((row) =>
          taskIds.includes(row.id)
            ? {
                ...row,
                status,
              }
            : row,
        ),
      )
      setSelectedIds({})
      toast.success("Selected tasks updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update selected tasks"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteSelectedTasks() {
    const taskIds = Object.keys(selectedIds).filter((id) => selectedIds[id])
    if (taskIds.length === 0) {
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/tasks/bulk", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ taskIds }),
      })

      if (!response.ok) {
        throw new Error("Unable to delete selected tasks")
      }

      setRows((current) => current.filter((row) => !taskIds.includes(row.id)))
      setSelectedIds({})
      toast.success("Selected tasks deleted")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete selected tasks"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by task, project, or assignee"
          className="md:max-w-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          {canManageTasks && selectedCount > 0 ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => bulkUpdateStatus("in_progress")}
              >
                Mark In Progress
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => bulkUpdateStatus("done")}
              >
                Mark Done
              </Button>
            </>
          ) : null}

          {canBulkDelete && selectedCount > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isSaving}
              onClick={deleteSelectedTasks}
            >
              Delete Selected
            </Button>
          ) : null}
        </div>
      </div>

      <Frame className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {showSelection ? (
                <TableHead className="w-10">
                  <Checkbox checked={allFilteredSelected} onCheckedChange={toggleSelectAll} />
                </TableHead>
              ) : null}
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showSelection ? 7 : 6}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  {showSelection ? (
                    <TableCell>
                      <Checkbox
                        checked={Boolean(selectedIds[row.id])}
                        onCheckedChange={(checked) => toggleRowSelection(row.id, Boolean(checked))}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Link href={`/tasks/${row.id}`} className="font-medium underline-offset-4 hover:underline">
                      {row.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/projects/${row.projectId}`}
                      className="text-muted-foreground underline-offset-4 hover:underline"
                    >
                      {row.projectName}
                    </Link>
                  </TableCell>
                  <TableCell>{row.assigneeLabel}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase">
                      {row.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canManageTasks ? (
                      <Select
                        value={row.status}
                        onValueChange={(value) => updateTaskStatus(row.id, value as TaskStatus)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-36" size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {formatStatusLabel(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{formatStatusLabel(row.status)}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDueDate(row.dueDate)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Frame>
    </div>
  )
}
