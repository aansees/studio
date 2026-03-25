import { requireSession } from "@/lib/session"
import { TaskDetailsPageContent } from "@/components/layout/dashboard/task-details-page"
import { Unauthorized } from "@/components/global/pages";

export default async function ProjectTaskDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>
}) {
  const { projectId, taskId } = await params
  const { user } = await requireSession()

  if (user.role === "client") {
    return <Unauthorized />
  }

  return <TaskDetailsPageContent taskId={taskId} projectId={projectId} />
}
