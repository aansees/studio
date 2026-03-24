import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { ProjectDocsWorkspace } from "@/components/layout/dashboard/project-docs-workspace";
import { ProjectTasksWorkspace } from "@/components/layout/dashboard/project-tasks-workspace";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants/domain";
import { requireSession } from "@/lib/session";
import {
  canManageProject,
  getProjectByIdForUser,
  getProjectAnalytics,
  listProjectMembersForUser,
} from "@/lib/services/projects";
import { projectTaskSummary } from "@/lib/services/tasks";
import { resolveTaskTimelineStartDate } from "@/lib/tasks/timeline";
import { listProjectTasksForUser } from "@/lib/services/tasks";

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default async function ProjectDetailsPage({
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

  if (user.role === "client") {
    const summary = await projectTaskSummary(projectId);

    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Project Overview</h2>
            <p className="text-sm text-muted-foreground">
              See the latest status, deadline, and shared plan for this project.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}/chat`}>Open chats</Link>
          </Button>
        </div>

        <Frame>
          <FramePanel className="space-y-4 p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 text-base font-semibold">
                <span>{project.name}</span>
                <Badge variant="outline">{project.status}</Badge>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {project.description || "No project description available."}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${project.progressPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <div className="text-muted-foreground">Total tasks</div>
                <div className="text-lg font-semibold">{summary.total}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Completed</div>
                <div className="text-lg font-semibold">{summary.done}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Overdue</div>
                <div className="text-lg font-semibold">{summary.overdue}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Deadline</div>
                <div className="text-lg font-semibold">
                  {project.endDate
                    ? new Date(project.endDate).toLocaleDateString()
                    : "-"}
                </div>
              </div>
            </div>
          </FramePanel>
        </Frame>

        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Project Plan & Resources</h3>
            <p className="text-sm text-muted-foreground">
              Shared project notes and approved resources for this delivery.
            </p>
          </div>
          <ProjectDocsWorkspace
            projectId={projectId}
            canEdit={false}
            canViewInternalDocs={false}
            initialNotes={project.notes ?? ""}
            initialDevLinks={project.devLinks ?? ""}
            initialCredentials={project.credentials ?? ""}
            layout="embedded"
          />
        </div>
      </div>
    );
  }

  const [analytics, tasks, members, projectManager] = await Promise.all([
    getProjectAnalytics(projectId),
    listProjectTasksForUser(user, projectId),
    listProjectMembersForUser(user, projectId),
    canManageProject(user, projectId),
  ]);

  const taskRows = tasks.map((item) => ({
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
  }));

  const visibleMembers = members.slice(0, 5);
  const extraMembers = Math.max(members.length - visibleMembers.length, 0);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-blue-700 dark:text-indigo-400">
            Hello {user.name}, manage your project
          </h2>
          <p className="text-sm text-muted-foreground">
            You can monitor, analyze and refine essential metrics to improve
            your project outcomes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AvatarGroup>
            {visibleMembers.map((member) => (
              <Avatar key={member.userId}>
                {member.image ? (
                  <AvatarImage src={member.image} alt={member.name} />
                ) : null}
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
            ))}
            {extraMembers > 0 ? (
              <AvatarGroupCount>+{extraMembers}</AvatarGroupCount>
            ) : null}
          </AvatarGroup>
          {projectManager ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/projects/${projectId}/settings#members`}>
                Invite
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Frame>
        <FramePanel className="space-y-4 p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 text-base font-semibold">
              <span>{project.name}</span>
              <Badge variant="outline">{project.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/projects/${projectId}/details`}>
                  More
                  <ChevronRightIcon className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {project.description || "No project description available."}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${project.progressPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <div className="text-muted-foreground">Total tasks</div>
              <div className="text-lg font-semibold">
                {analytics.summary.total}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Completed</div>
              <div className="text-lg font-semibold">
                {analytics.summary.completed}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Overdue</div>
              <div className="text-lg font-semibold">
                {analytics.summary.overdue}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Deadline</div>
              <div className="text-lg font-semibold">
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "-"}
              </div>
            </div>
          </div>
        </FramePanel>
      </Frame>

      <ProjectTasksWorkspace
        projectId={projectId}
        canManageProjectTasks={projectManager}
        initialRows={taskRows}
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
