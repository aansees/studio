import { MyTaskTable } from "@/components/layout/dashboard/my-task-table";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants/domain";
import { requireSession } from "@/lib/session";
import { listProjectsForUser } from "@/lib/services/projects";
import { listTasksForUser } from "@/lib/services/tasks";
import { Frame } from "@/components/ui/frame";

export default async function MyTaskPage() {
  const { user } = await requireSession(["admin", "developer"]);
  const [tasks, projects] = await Promise.all([listTasksForUser(user), listProjectsForUser(user)]);
  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));

  const rows = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    projectId: task.projectId,
    projectName: projectNameById.get(task.projectId) ?? "Unknown project",
    priority: task.priority,
    status: TASK_STATUSES.includes(task.status as TaskStatus)
      ? (task.status as TaskStatus)
      : "todo",
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1>My Tasks</h1>
      </div>
      <Frame className="space-y-2">
        <MyTaskTable initialRows={rows} role={user.role} />
      </Frame>
    </div>
  );
}
