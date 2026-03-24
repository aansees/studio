import { notFound, redirect } from "next/navigation";

import { ProjectDetailsEditor } from "@/components/layout/dashboard/project-details-editor";
import { ProjectDocsLauncher } from "@/components/layout/dashboard/project-docs-launcher";
import { ProjectMembersEditor } from "@/components/layout/dashboard/project-members-editor";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type ProjectPriority,
  type ProjectStatus,
} from "@/lib/constants/domain";
import { isUserRole } from "@/lib/constants/rbac";
import { requireSession } from "@/lib/session";
import {
  canManageProject,
  getProjectByIdForUser,
  listAssignableUsersForProjectManager,
  listProjectMembersForUser,
} from "@/lib/services/projects";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user } = await requireSession();
  if (user.role === "client") {
    redirect(`/projects/${projectId}`);
  }

  const project = await getProjectByIdForUser(projectId, user);

  if (!project) {
    notFound();
  }

  const [members, projectManager] = await Promise.all([
    listProjectMembersForUser(user, projectId),
    canManageProject(user, projectId),
  ]);

  if (!projectManager) {
    redirect(`/projects/${projectId}/details`);
  }

  const projectLead = members.find(
    (member) => member.userId === project.projectLeadId,
  );
  const clientMembers = members.filter((member) => member.role === "client");
  const developerMembers = members.filter(
    (member) =>
      member.role === "developer" && member.userId !== project.projectLeadId,
  );
  const normalizedStatus = PROJECT_STATUSES.includes(
    project.status as ProjectStatus,
  )
    ? (project.status as ProjectStatus)
    : "draft";
  const normalizedPriority = PROJECT_PRIORITIES.includes(
    project.priority as ProjectPriority,
  )
    ? (project.priority as ProjectPriority)
    : "medium";
  const allUsers = await listAssignableUsersForProjectManager(user, projectId);

  const usersForMemberEditor = Array.from(
    new Map(
      [
        ...allUsers.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          role: isUserRole(item.role) ? item.role : "client",
          isActive: item.isActive,
        })),
        ...members.map((member) => ({
          id: member.userId,
          name: member.name,
          email: member.email,
          role: isUserRole(member.role) ? member.role : "client",
          isActive: member.isActive,
        })),
      ].map((item) => [item.id, item]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name));

  const projectLeadOptions = usersForMemberEditor
    .filter((item) => item.role === "admin" || item.role === "developer")
    .map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      role: item.role as "admin" | "developer",
    }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="space-y-1">
        <div className="text-sm font-semibold">Project Workspace</div>
        <div className="text-sm text-muted-foreground">
          Planning, resources, dev links, and credentials are maintained in a
          dedicated documentation page.
        </div>
      </div>
      <ProjectDocsLauncher projectId={projectId} />

      <div className="space-y-1">
        <div className="text-sm font-semibold">Project Configuration</div>
        <div className="text-sm text-muted-foreground">
          Update project scope, ownership, and schedule. Working documents live
          in the dedicated project plan workspace.
        </div>
      </div>
      <Frame>
        <FramePanel className="space-y-4 p-4 md:p-5">
          <ProjectDetailsEditor
            projectId={projectId}
            currentProjectLeadLabel={projectLead?.name ?? "Unassigned"}
            projectLeadOptions={projectLeadOptions}
            canChangeTeamLead={user.role === "admin"}
            canDeleteProject={user.role === "admin"}
            initialProject={{
              name: project.name,
              description: project.description,
              status: normalizedStatus,
              priority: normalizedPriority,
              startDate: project.startDate
                ? new Date(project.startDate).toISOString().slice(0, 10)
                : null,
              endDate: project.endDate
                ? new Date(project.endDate).toISOString().slice(0, 10)
                : null,
              projectLeadId: project.projectLeadId,
            }}
          />
        </FramePanel>
      </Frame>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold">Project Members</div>
          <div className="text-sm text-muted-foreground">
            Manage developer membership and client visibility. Team leads can
            update developers, but only admins can manage clients.
          </div>
        </div>
        <ProjectMembersEditor
          projectId={projectId}
          users={usersForMemberEditor}
          initialMemberIds={developerMembers.map((member) => member.userId)}
          initialClientIds={clientMembers.map((member) => member.userId)}
          projectLeadId={project.projectLeadId}
          canManageClients={user.role === "admin"}
        />
      </div>
    </div>
  );
}
