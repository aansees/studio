import Link from "next/link";

import { CreateProjectDialog } from "@/components/layout/dashboard/create-project-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isUserRole } from "@/lib/constants/rbac";
import { requireSession } from "@/lib/session";
import { listProjectsForUser } from "@/lib/services/projects";
import { listTeamAsAdmin } from "@/lib/services/team";
import { Frame } from "@/components/ui/frame";

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
      <div className="flex flex-row items-center justify-between">
        <h1>Projects</h1>
        {user.role === "admin" ? (
          <CreateProjectDialog users={normalizedTeam} currentUserId={user.id} />
        ) : null}
      </div>
      <Frame className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${item.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.status}</Badge>
                  </TableCell>
                  <TableCell>{item.priority}</TableCell>
                  <TableCell>{item.progressPercent}%</TableCell>
                  <TableCell>
                    {item.endDate
                      ? new Date(item.endDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Frame>
    </div>
  );
}
