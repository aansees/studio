import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { TaskChatPanel } from "@/components/chat/task-chat-panel"
import { TaskManagementForm } from "@/components/layout/dashboard/task-management-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/lib/constants/domain"
import { isUserRole } from "@/lib/constants/rbac"
import { db } from "@/lib/db"
import { task } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { canAccessTask } from "@/lib/services/access-control"
import { buildTaskRoomId, getTaskChatMessages } from "@/lib/services/chat"
import { canManageProject, listProjectMembersForUser } from "@/lib/services/projects"
import { canUserChatOnTask } from "@/lib/services/tasks"

export default async function TaskDetailsPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params
  const { user } = await requireSession()
  const allowed = await canAccessTask(user, taskId)
  if (!allowed) {
    notFound()
  }

  const [taskRecord, messages, canPost] = await Promise.all([
    db.select().from(task).where(eq(task.id, taskId)).limit(1),
    getTaskChatMessages(taskId),
    canUserChatOnTask(user, taskId),
  ])

  const item = taskRecord[0]
  if (!item) {
    notFound()
  }

  const [members, canManageTask] = await Promise.all([
    listProjectMembersForUser(user, item.projectId),
    canManageProject(user, item.projectId),
  ])

  const assignee = item.assigneeId
    ? members.find((member) => member.userId === item.assigneeId)
    : null

  const assigneeLabel =
    user.role === "client"
      ? item.assigneeId
        ? "Assigned developer"
        : "Unassigned"
      : assignee?.name ?? (item.assigneeId ? "Unknown" : "Unassigned")

  const normalizedType = TASK_TYPES.includes(item.type as TaskType)
    ? (item.type as TaskType)
    : "feature"
  const normalizedPriority = TASK_PRIORITIES.includes(item.priority as TaskPriority)
    ? (item.priority as TaskPriority)
    : "medium"
  const normalizedStatus = TASK_STATUSES.includes(item.status as TaskStatus)
    ? (item.status as TaskStatus)
    : "todo"

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>{item.title}</span>
            <Badge variant="outline">{item.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>{item.description}</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <div className="text-muted-foreground">Priority</div>
              <div className="font-medium">{item.priority}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Type</div>
              <div className="font-medium">{item.type}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Due date</div>
              <div className="font-medium">
                {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "-"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Assignee</div>
              <div className="font-medium">{assigneeLabel}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskManagementForm
            taskId={taskId}
            currentUserId={user.id}
            role={user.role}
            canManageTask={canManageTask}
            initialTask={{
              title: item.title,
              description: item.description,
              type: normalizedType,
              priority: normalizedPriority,
              status: normalizedStatus,
              assigneeId: item.assigneeId,
              dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : null,
              estimatedHours: item.estimatedHours,
            }}
            assignees={members.map((member) => ({
              id: member.userId,
              name: member.name,
              role: isUserRole(member.role) ? member.role : "client",
            }))}
          />
          {!canManageTask && !(user.role === "developer" && item.assigneeId === user.id) ? (
            <div className="text-sm text-muted-foreground">
              You can view this task, but editing is restricted.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <TaskChatPanel
        taskId={taskId}
        roomId={buildTaskRoomId(taskId)}
        currentUserId={user.id}
        viewerRole={user.role}
        initialMessages={messages}
        canPost={canPost}
      />
    </div>
  )
}
