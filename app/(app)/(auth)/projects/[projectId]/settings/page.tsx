import { notFound, redirect } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/lib/session"
import { getProjectByIdForUser } from "@/lib/services/projects"

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { user } = await requireSession()
  const project = await getProjectByIdForUser(projectId, user)

  if (!project) {
    notFound()
  }

  if (user.role !== "admin") {
    redirect(`/projects/${projectId}`)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{project.name} - Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="text-muted-foreground">Project links</div>
            <div>{project.devLinks ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Credentials</div>
            <div>{project.credentials ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Notes</div>
            <div>{project.notes ?? "-"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
