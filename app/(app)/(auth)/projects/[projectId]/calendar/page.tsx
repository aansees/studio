import { endOfDay, isBefore, startOfDay } from "date-fns";
import { notFound } from "next/navigation";

import { ProjectTaskCalendar } from "@/components/layout/dashboard/project-task-calendar";
import { Frame, FramePanel } from "@/components/ui/frame";
import { requireSession } from "@/lib/session";
import { getProjectByIdForUser } from "@/lib/services/projects";
import { listProjectTasksForUser } from "@/lib/services/tasks";
import { resolveTaskTimelineStartDate } from "@/lib/tasks/timeline";
import { Unauthorized } from "@/components/global/pages";

function getEventColor({
  priority,
  status,
  dueDate,
}: {
  priority: string | null;
  status: string | null;
  dueDate: Date;
}) {
  if (status === "done") return "emerald" as const;
  if (isBefore(dueDate, new Date()) && status !== "done") return "rose" as const;
  if (status === "in_progress") return "amber" as const;

  switch (priority) {
    case "urgent":
      return "rose" as const;
    case "high":
      return "orange" as const;
    case "medium":
      return "amber" as const;
    case "low":
      return "sky" as const;
    default:
      return "violet" as const;
  }
}

export default async function ProjectCalendarPage({
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

  const tasks = await listProjectTasksForUser(user, projectId);

  const calendarEvents = tasks
    .filter((item) => item.dueDate)
    .map((item) => {
      const startDate = startOfDay(
        resolveTaskTimelineStartDate(item.createdAt, project.startDate),
      );
      const dueDate = new Date(item.dueDate!);
      const normalizedEnd = endOfDay(
        isBefore(dueDate, startDate) ? startDate : dueDate,
      );

      return {
        id: item.id,
        title: item.title,
        description:
          item.description ?? `${item.type ?? "task"} - ${item.status ?? "todo"}`,
        start: startDate.toISOString(),
        end: normalizedEnd.toISOString(),
        allDay: true,
        color: getEventColor({
          priority: item.priority,
          status: item.status,
          dueDate,
        }),
      };
    })
    .sort((left, right) => left.start.localeCompare(right.start));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Frame>
        <FramePanel className="overflow-hidden p-0">
          <ProjectTaskCalendar projectId={projectId} events={calendarEvents} />
        </FramePanel>
      </Frame>
    </div>
  );
}

