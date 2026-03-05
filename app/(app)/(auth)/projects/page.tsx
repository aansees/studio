import { ProjectsTable } from "@/components/layout/dashboard/projects-table";
import { isUserRole } from "@/lib/constants/rbac";
import { requireSession } from "@/lib/session";
import { listProjectsForUser } from "@/lib/services/projects";
import { listTeamAsAdmin } from "@/lib/services/team";

export default async function ProjectsPage() {
  const { user } = await requireSession();
  const [projects, team] = await Promise.all([
    listProjectsForUser(user),
    user.role === "admin" ? listTeamAsAdmin(user) : Promise.resolve([]),
  ]);
  const normalizedTeam = team.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: isUserRole(member.role) ? member.role : "client",
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <ProjectsTable
        user={user}
        normalizedTeam={normalizedTeam}
        initialProjects={projects.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          priority: item.priority,
          progressPercent: item.progressPercent,
          endDate: item.endDate ? item.endDate.toISOString() : null,
        }))}
      />
    </div>
  );
}
