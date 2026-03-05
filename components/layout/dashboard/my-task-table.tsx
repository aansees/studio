"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Frame } from "@/components/ui/frame"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants/domain"
import type { UserRole } from "@/lib/constants/rbac"

type MyTaskRow = {
  id: string
  title: string
  projectId: string
  projectName: string
  priority: string
  status: TaskStatus
  dueDate: string | null
}

function formatStatus(status: TaskStatus) {
  return status
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function MyTaskTable({
  initialRows,
  role,
}: {
  initialRows: MyTaskRow[]
  role: UserRole
}) {
  const [rows, setRows] = useState(initialRows)
  const [query, setQuery] = useState("")
  const [pendingById, setPendingById] = useState<Record<string, boolean>>({})

  const canEditStatus = role !== "client"

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return rows
    }

    return rows.filter((row) => {
      return (
        row.title.toLowerCase().includes(normalized) ||
        row.projectName.toLowerCase().includes(normalized) ||
        row.priority.toLowerCase().includes(normalized) ||
        row.status.toLowerCase().includes(normalized)
      )
    })
  }, [query, rows])

  async function updateStatus(taskId: string, status: TaskStatus) {
    setPendingById((prev) => ({ ...prev, [taskId]: true }))
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update task status")
      }

      setRows((prev) => prev.map((row) => (row.id === taskId ? { ...row, status } : row)))
      toast.success("Task status updated")
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : "Unable to update task status"
      toast.error(message)
    } finally {
      setPendingById((prev) => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
    }
  }

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search tasks"
        className="md:max-w-sm"
      />

      <Frame className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  No assigned tasks right now.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
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
                  <TableCell>
                    <Badge variant="outline" className="uppercase">
                      {row.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canEditStatus ? (
                      <Select
                        value={row.status}
                        onValueChange={(value) => void updateStatus(row.id, value as TaskStatus)}
                        disabled={Boolean(pendingById[row.id])}
                      >
                        <SelectTrigger size="sm" className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {formatStatus(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{formatStatus(row.status)}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Frame>
    </div>
  )
}
