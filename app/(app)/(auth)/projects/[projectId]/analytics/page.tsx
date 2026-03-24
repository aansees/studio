import { notFound, redirect } from "next/navigation"

import { ProjectAnalyticsDashboard } from "@/components/layout/dashboard/project-analytics-dashboard"
import { requireSession } from "@/lib/session"
import {
  getProjectByIdForUser,
  getProjectAnalytics,
  listProjectMembersForUser,
} from "@/lib/services/projects"

export default async function ProjectAnalyticsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { user } = await requireSession()
  if (user.role === "client") {
    redirect(`/projects/${projectId}`)
  }

  const [project, analytics, members] = await Promise.all([
    getProjectByIdForUser(projectId, user),
    getProjectAnalytics(projectId),
    listProjectMembersForUser(user, projectId),
  ])

  if (!project) {
    notFound()
  }

  return (
    <ProjectAnalyticsDashboard
      project={{
        id: project.id,
        name: project.name,
        description: project.description ?? null,
        status: project.status,
        priority: project.priority,
        progressPercent: project.progressPercent,
        endDate: project.endDate ? new Date(project.endDate).toISOString() : null,
      }}
      analytics={analytics}
      members={members.map((member) => ({
        userId: member.userId,
        name: member.name,
        image: member.image ?? null,
        role: member.role,
      }))}
    />
  )
}
