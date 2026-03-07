"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "@/lib/constants/domain"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type AssigneeOption = {
  id: string
  name: string
  email: string
  role: string
}

export function CreateTaskDialog({
  projectId,
  assignees,
}: {
  projectId: string
  assignees: AssigneeOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<(typeof TASK_TYPES)[number]>("feature")
  const [priority, setPriority] = useState<(typeof TASK_PRIORITIES)[number]>("medium")
  const [status, setStatus] = useState<(typeof TASK_STATUSES)[number]>("todo")
  const [assigneeId, setAssigneeId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [estimatedHours, setEstimatedHours] = useState("")

  const assignableUsers = useMemo(
    () => assignees.filter((member) => member.role !== "client"),
    [assignees],
  )

  function resetForm() {
    setTitle("")
    setDescription("")
    setType("feature")
    setPriority("medium")
    setStatus("todo")
    setAssigneeId("")
    setDueDate("")
    setEstimatedHours("")
  }

  async function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    const estimated = Number.parseInt(estimatedHours, 10)

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          priority,
          status,
          assigneeId: assigneeId || undefined,
          dueDate: dueDate || undefined,
          estimatedHours: Number.isFinite(estimated) && estimated > 0 ? estimated : undefined,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to create task")
      }

      toast.success("Task created")
      setOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create task"
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Add a task for this project and assign it to a team member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitTask} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="task-title">Title</FieldLabel>
              <Input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={2}
                placeholder="Build authentication API"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="task-description">Description</FieldLabel>
              <Textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add details for assignee"
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel>Type</FieldLabel>
                <Select value={type} onValueChange={(value) => setType(value as (typeof TASK_TYPES)[number])}>
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
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as (typeof TASK_PRIORITIES)[number])}
                >
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
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as (typeof TASK_STATUSES)[number])}
                >
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
            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel>Assignee</FieldLabel>
                <Select
                  value={assigneeId || "__unassigned__"}
                  onValueChange={(value) => setAssigneeId(value === "__unassigned__" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">Unassigned</SelectItem>
                    {assignableUsers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="task-due-date">Due Date</FieldLabel>
                <DatePicker
                  id="task-due-date"
                  value={dueDate}
                  onValueChange={setDueDate}
                  placeholder="Pick due date"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="task-estimated-hours">Estimated Hours</FieldLabel>
                <Input
                  id="task-estimated-hours"
                  type="number"
                  min={1}
                  step={1}
                  value={estimatedHours}
                  onChange={(event) => setEstimatedHours(event.target.value)}
                  placeholder="8"
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
