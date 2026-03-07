import { notFound } from "next/navigation";

import { ProjectTasksWorkspace } from "@/components/layout/dashboard/project-tasks-workspace";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants/domain";
import { requireSession } from "@/lib/session";
import {
  canManageProject,
  getProjectByIdForUser,
  listProjectMembersForUser,
} from "@/lib/services/projects";
import { resolveTaskTimelineStartDate } from "@/lib/tasks/timeline";
import { listProjectTasksForUser } from "@/lib/services/tasks";

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user } = await requireSession();
  const project = await getProjectByIdForUser(projectId, user);

  if (!project) {
    notFound();
  }

  const [tasks, members, projectManager] = await Promise.all([
    listProjectTasksForUser(user, projectId),
    listProjectMembersForUser(user, projectId),
    canManageProject(user, projectId),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <h1>{project.name} - Tasks</h1>

      <ProjectTasksWorkspace
        projectId={projectId}
        canManageProjectTasks={projectManager}
        initialRows={tasks.map((item) => ({
          id: item.id,
          projectId,
          title: item.title,
          type: item.type,
          description: item.description ?? "",
          priority: item.priority,
          status: TASK_STATUSES.includes(item.status as TaskStatus)
            ? (item.status as TaskStatus)
            : "todo",
          people:
            item.assignedUsers?.map((assignedUser) => ({
              id: assignedUser.id,
              name:
                user.role === "client" && assignedUser.role === "developer"
                  ? "Assigned developer"
                  : assignedUser.name,
              image: assignedUser.image ?? null,
            })) ?? [],
          startDate: resolveTaskTimelineStartDate(
            item.createdAt,
            project.startDate,
          ).toISOString(),
          dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
        }))}
        assignees={members
          .filter((member) => member.role !== "client")
          .map((member) => ({
            id: member.userId,
            name: member.name,
            email: member.email,
            role: member.role,
          }))}
      />
    </div>
  );
}
