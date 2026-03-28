"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from "@/lib/constants/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TaskAssigneesPicker } from "@/components/layout/dashboard/task-assignees-picker";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "@/components/ui/frame";

type AssigneeOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function CreateTaskDialog({
  projectId,
  assignees,
}: {
  projectId: string;
  assignees: AssigneeOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<(typeof TASK_TYPES)[number]>("feature");
  const [priority, setPriority] =
    useState<(typeof TASK_PRIORITIES)[number]>("medium");
  const [status, setStatus] = useState<(typeof TASK_STATUSES)[number]>("todo");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");

  const assignableUsers = useMemo(
    () => assignees.filter((member) => member.role !== "client"),
    [assignees],
  );

  function resetForm() {
    setTitle("");
    setDescription("");
    setType("feature");
    setPriority("medium");
    setStatus("todo");
    setAssigneeIds([]);
    setDueDate("");
  }

  async function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

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
          assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
          dueDate: dueDate || undefined,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to create task");
      }

      toast.success("Task created");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create task";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl p-0 ring-0">
        <Frame>
          <FrameHeader>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>
                Add a task for this project and assign it to one or more team
                members.
              </DialogDescription>
            </DialogHeader>
          </FrameHeader>
          <form onSubmit={submitTask} className="space-y-4">
            <FramePanel block="mb-0">
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
                  <FieldLabel htmlFor="task-description">
                    Description
                  </FieldLabel>
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
                    <Select
                      value={type}
                      onValueChange={(value) =>
                        setType(value as (typeof TASK_TYPES)[number])
                      }
                    >
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
                      onValueChange={(value) =>
                        setPriority(value as (typeof TASK_PRIORITIES)[number])
                      }
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
                      onValueChange={(value) =>
                        setStatus(value as (typeof TASK_STATUSES)[number])
                      }
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
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Assignees</FieldLabel>
                    <TaskAssigneesPicker
                      options={assignableUsers}
                      value={assigneeIds}
                      onChange={setAssigneeIds}
                      disabled={pending}
                      placeholder="Select assignees"
                    />
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
                </div>
              </FieldGroup>
            </FramePanel>
            <FrameFooter className="px-2.5 py-2 flex items-center justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Creating..." : "Create task"}
              </Button>
            </FrameFooter>
          </form>
        </Frame>
      </DialogContent>
    </Dialog>
  );
}
