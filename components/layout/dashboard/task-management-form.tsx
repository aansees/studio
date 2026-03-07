"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/lib/constants/domain"
import type { UserRole } from "@/lib/constants/rbac"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TaskAssigneesPicker } from "@/components/layout/dashboard/task-assignees-picker"

type TaskAssignableUser = {
  id: string
  name: string
  email: string
  role: "admin" | "developer" | "client"
}

type EditableTask = {
  title: string
  description: string | null
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assigneeIds: string[]
  dueDate: string | null
}

export function TaskManagementForm({
  taskId,
  currentUserId,
  role,
  canManageTask,
  initialTask,
  assignees,
}: {
  taskId: string
  currentUserId: string
  role: UserRole
  canManageTask: boolean
  initialTask: EditableTask
  assignees: TaskAssignableUser[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const [title, setTitle] = useState(initialTask.title)
  const [description, setDescription] = useState(initialTask.description ?? "")
  const [type, setType] = useState<TaskType>(initialTask.type)
  const [priority, setPriority] = useState<TaskPriority>(initialTask.priority)
  const [status, setStatus] = useState<TaskStatus>(initialTask.status)
  const [assigneeIds, setAssigneeIds] = useState(initialTask.assigneeIds)
  const [dueDate, setDueDate] = useState(initialTask.dueDate ?? "")

  const developerCanUpdateStatus =
    role === "developer" && initialTask.assigneeIds.includes(currentUserId)

  const assignableOptions = useMemo(
    () => assignees.filter((assignee) => assignee.role !== "client"),
    [assignees],
  )

  async function submitStatusOnly(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update task status")
      }

      toast.success("Task status updated")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update task status"
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  async function submitFullUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          priority,
          status,
          assigneeIds,
          dueDate: dueDate || undefined,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update task")
      }

      toast.success("Task updated")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update task"
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  if (!canManageTask && !developerCanUpdateStatus) {
    return null
  }

  if (!canManageTask && developerCanUpdateStatus) {
    return (
      <form onSubmit={submitStatusOnly} className="space-y-4">
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
            <SelectTrigger className="md:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((taskStatus) => (
                <SelectItem key={taskStatus} value={taskStatus}>
                  {taskStatus}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Update status"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={submitFullUpdate} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="task-title-edit">Title</FieldLabel>
          <Input
            id="task-title-edit"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="task-description-edit">Description</FieldLabel>
          <Textarea
            id="task-description-edit"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Task details"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select value={type} onValueChange={(value) => setType(value as TaskType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((taskType) => (
                  <SelectItem key={taskType} value={taskType}>
                    {taskType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Priority</FieldLabel>
            <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((taskPriority) => (
                  <SelectItem key={taskPriority} value={taskPriority}>
                    {taskPriority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((taskStatus) => (
                  <SelectItem key={taskStatus} value={taskStatus}>
                    {taskStatus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Assignees</FieldLabel>
            <TaskAssigneesPicker
              options={assignableOptions}
              value={assigneeIds}
              onChange={setAssigneeIds}
              disabled={pending}
              placeholder="Select assignees"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="task-due-date-edit">Due Date</FieldLabel>
            <DatePicker
              id="task-due-date-edit"
              value={dueDate}
              onValueChange={setDueDate}
              placeholder="Pick due date"
            />
          </Field>
        </div>
      </FieldGroup>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save task"}
        </Button>
      </div>
    </form>
  )
}
