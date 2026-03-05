import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/lib/session"
import { getProjectByIdForUser, getProjectAnalytics } from "@/lib/services/projects"
import { listTasksForUser } from "@/lib/services/tasks"

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { user } = await requireSession()

  const [project, analytics, tasks] = await Promise.all([
    getProjectByIdForUser(projectId, user),
    getProjectAnalytics(projectId),
    listTasksForUser(user, projectId),
  ])

  if (!project) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span>{project.name}</span>
            <Badge variant="outline">{project.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">{project.description}</div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${project.progressPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <div className="text-muted-foreground">Total tasks</div>
              <div className="text-lg font-semibold">{analytics.summary.total}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Completed</div>
              <div className="text-lg font-semibold">{analytics.summary.completed}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Overdue</div>
              <div className="text-lg font-semibold">{analytics.summary.overdue}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Deadline</div>
              <div className="text-lg font-semibold">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.slice(0, 12).map((item) => (
            <Link
              key={item.id}
              href={`/tasks/${item.id}`}
              className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/40"
            >
              <span>{item.title}</span>
              <Badge variant="outline">{item.status}</Badge>
            </Link>
          ))}
          {tasks.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tasks in this project yet.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
