import { redirect } from "next/navigation"

import { requireSession } from "@/lib/session"
import { TaskDetailsPageContent } from "@/components/layout/dashboard/task-details-page"

export default async function ProjectTaskDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>
}) {
  const { projectId, taskId } = await params
  const { user } = await requireSession()

  if (user.role === "client") {
    redirect(`/projects/${projectId}`)
  }

  return <TaskDetailsPageContent taskId={taskId} projectId={projectId} />
}
