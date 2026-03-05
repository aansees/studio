import { notFound } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/lib/session"
import { getProjectByIdForUser, getProjectAnalytics } from "@/lib/services/projects"

export default async function ProjectAnalyticsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { user } = await requireSession()
  const [project, analytics] = await Promise.all([
    getProjectByIdForUser(projectId, user),
    getProjectAnalytics(projectId),
  ])

  if (!project) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{project.name} - Analytics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <div className="text-muted-foreground">Total tasks</div>
            <div className="text-2xl font-semibold">{analytics.summary.total}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Completed</div>
            <div className="text-2xl font-semibold">{analytics.summary.completed}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Overdue</div>
            <div className="text-2xl font-semibold">{analytics.summary.overdue}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Team size</div>
            <div className="text-2xl font-semibold">{analytics.assigneeBreakdown.length}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
