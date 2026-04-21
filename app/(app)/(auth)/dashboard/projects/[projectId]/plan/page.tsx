import { notFound } from "next/navigation";

import { ProjectDocsWorkspace } from "@/components/layout/dashboard/project-docs-workspace";
import { requireSession } from "@/lib/session";
import {
  canManageProject,
  getProjectByIdForUser,
} from "@/lib/services/projects";
import { Unauthorized } from "@/components/global/pages/401";

export default async function ProjectPlanPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user } = await requireSession();
  if (user.role === "client") {
    return <Unauthorized />
  }

  const project = await getProjectByIdForUser(projectId, user);

  if (!project) {
    notFound();
  }

  const canEdit = await canManageProject(user, projectId);
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
      <ProjectDocsWorkspace
        projectId={projectId}
        canEdit={canEdit}
        canViewInternalDocs
        initialNotes={project.notes ?? ""}
        initialDevLinks={project.devLinks ?? ""}
        initialCredentials={project.credentials ?? ""}
      />
    </div>
  );
}
