import { notFound } from "next/navigation"

import { ProjectOverviewDeepDive } from "@/components/layout/dashboard/project-overview-deep-dive"
import { PROJECT_PRIORITIES, type ProjectPriority } from "@/lib/constants/domain"
import { requireSession } from "@/lib/session"
import { canManageProject, getProjectByIdForUser, listProjectMembersForUser } from "@/lib/services/projects"

export default async function ProjectDetailsTabPage({
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

  const [members, projectManager] = await Promise.all([
    listProjectMembersForUser(user, projectId),
    canManageProject(user, projectId),
  ])

  const projectLead = members.find((member) => member.userId === project.projectLeadId)
  const clientNames = members
    .filter((member) => member.role === "client")
    .map((member) => member.name)
  const normalizedPriority = PROJECT_PRIORITIES.includes(project.priority as ProjectPriority)
    ? (project.priority as ProjectPriority)
    : "medium"

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <ProjectOverviewDeepDive
        projectId={projectId}
        userRole={user.role}
        projectManager={projectManager}
        details={{
          projectLead: projectLead?.name ?? "Unassigned",
          client: clientNames.length > 0 ? clientNames.join(", ") : "No client",
          priority: normalizedPriority,
          startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : "-",
          endDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : "-",
          teamMembersCount: members.filter((member) => member.role !== "client").length,
        }}
        members={members.map((member) => ({
          userId: member.userId,
          name: member.name,
          email: member.email,
          role: member.role,
          isActive: member.isActive,
        }))}
      />
    </div>
  )
}
