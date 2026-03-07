import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { TaskChatPanel } from "@/components/chat/task-chat-panel"
import { TaskManagementForm } from "@/components/layout/dashboard/task-management-form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Frame, FramePanel } from "@/components/ui/frame"
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
import { task, taskAssignment } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { canAccessTask } from "@/lib/services/access-control"
import { buildTaskRoomId, getTaskChatMessages } from "@/lib/services/chat"
import { canManageProject, listProjectMembersForUser } from "@/lib/services/projects"
import { canUserChatOnTask } from "@/lib/services/tasks"

export async function TaskDetailsPageContent({
  taskId,
  projectId,
}: {
  taskId: string
  projectId?: string
}) {
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
  if (!item || (projectId && item.projectId !== projectId)) {
    notFound()
  }

  const assignedUserIds = await db
    .select({ userId: taskAssignment.userId })
    .from(taskAssignment)
    .where(eq(taskAssignment.taskId, taskId))
  const normalizedAssigneeIds = assignedUserIds.map((record) => record.userId)
  const fallbackAssigneeIds =
    normalizedAssigneeIds.length > 0
      ? normalizedAssigneeIds
      : item.assigneeId
        ? [item.assigneeId]
        : []

  const [members, canManageTask] = await Promise.all([
    listProjectMembersForUser(user, item.projectId),
    canManageProject(user, item.projectId),
  ])

  const assigneeLabel =
    user.role === "client"
      ? fallbackAssigneeIds.length > 0
        ? fallbackAssigneeIds.length === 1
          ? "Assigned developer"
          : `${fallbackAssigneeIds.length} assigned developers`
        : "Unassigned"
      : fallbackAssigneeIds.length > 0
        ? fallbackAssigneeIds
            .map(
              (assigneeId) =>
                members.find((member) => member.userId === assigneeId)?.name ??
                "Unknown",
            )
            .join(", ")
        : "Unassigned"

  const normalizedType = TASK_TYPES.includes(item.type as TaskType)
    ? (item.type as TaskType)
    : "feature"
  const normalizedPriority = TASK_PRIORITIES.includes(item.priority as TaskPriority)
    ? (item.priority as TaskPriority)
    : "medium"
  const normalizedStatus = TASK_STATUSES.includes(item.status as TaskStatus)
    ? (item.status as TaskStatus)
    : "todo"
  const developerCanUpdateStatus =
    user.role === "developer" && fallbackAssigneeIds.includes(user.id)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Frame>
        <FramePanel className="p-4 md:p-5">
          <Collapsible className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.description || "No task description provided."}
                </div>
              </div>
              {canManageTask ? (
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    Edit task
                  </Button>
                </CollapsibleTrigger>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
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
                <div className="text-muted-foreground">Assignees</div>
                <div className="font-medium">{assigneeLabel}</div>
              </div>
            </div>

            {developerCanUpdateStatus ? (
              <div className="space-y-3 border-t pt-4">
                <div className="text-sm font-medium">Update status</div>
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
                    assigneeIds: fallbackAssigneeIds,
                    dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : null,
                  }}
                  assignees={members.map((member) => ({
                    id: member.userId,
                    name: member.name,
                    email: member.email,
                    role: isUserRole(member.role) ? member.role : "client",
                  }))}
                />
              </div>
            ) : null}

            {canManageTask ? (
              <CollapsibleContent className="space-y-3 border-t pt-4">
                <div className="text-sm font-medium">Edit task</div>
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
                    assigneeIds: fallbackAssigneeIds,
                    dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : null,
                  }}
                  assignees={members.map((member) => ({
                    id: member.userId,
                    name: member.name,
                    email: member.email,
                    role: isUserRole(member.role) ? member.role : "client",
                  }))}
                />
              </CollapsibleContent>
            ) : null}

            {!canManageTask && !developerCanUpdateStatus ? (
              <div className="text-sm text-muted-foreground">
                You can view this task, but editing is restricted.
              </div>
            ) : null}
          </Collapsible>
        </FramePanel>
      </Frame>

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
