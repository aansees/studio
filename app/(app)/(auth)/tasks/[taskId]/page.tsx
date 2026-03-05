import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { TaskChatPanel } from "@/components/chat/task-chat-panel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { task } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { canAccessTask } from "@/lib/services/access-control"
import { buildTaskRoomId, getTaskChatMessages } from "@/lib/services/chat"
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
              <div className="font-medium">{item.assigneeId ?? "-"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskChatPanel
        taskId={taskId}
        roomId={buildTaskRoomId(taskId)}
        currentUserId={user.id}
        initialMessages={messages}
        canPost={canPost}
      />
    </div>
  )
}
