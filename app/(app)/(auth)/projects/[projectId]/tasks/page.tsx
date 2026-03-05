import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/lib/session"
import { getProjectByIdForUser } from "@/lib/services/projects"
import { listTasksForUser } from "@/lib/services/tasks"

export default async function ProjectTasksPage({
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{project.name} - Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.map((item) => (
            <Link
              key={item.id}
              href={`/tasks/${item.id}`}
              className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/40"
            >
              <div>{item.title}</div>
              <Badge variant="outline">{item.status}</Badge>
            </Link>
          ))}
          {tasks.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tasks available.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
