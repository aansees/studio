import { TaskDetailsPageContent } from "@/components/layout/dashboard/task-details-page"

export default async function ProjectTaskDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>
}) {
  const { projectId, taskId } = await params

  return <TaskDetailsPageContent taskId={taskId} projectId={projectId} />
}
