import { notFound } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/lib/session"
import { getProjectByIdForUser } from "@/lib/services/projects"
import { listTasksForUser } from "@/lib/services/tasks"

export default async function ProjectCalendarPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { user } = await requireSession()
  const [project, tasks] = await Promise.all([
    getProjectByIdForUser(projectId, user),
    listTasksForUser(user, projectId),
  ])

  if (!project) {
    notFound()
  }

  const datedTasks = tasks
    .filter((item) => item.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{project.name} - Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {datedTasks.map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <div className="font-medium">{item.title}</div>
              <div className="text-muted-foreground">
                Due: {new Date(item.dueDate!).toLocaleDateString()}
              </div>
            </div>
          ))}
          {datedTasks.length === 0 ? (
            <div className="text-muted-foreground">No due dates in this project yet.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
