import { TeamManagement } from "@/components/layout/dashboard/team-management";
import { isUserRole } from "@/lib/constants/rbac";
import { requireSession } from "@/lib/session";
import { listTeamAsAdmin } from "@/lib/services/team";
import { Unauthorized } from "@/components/global/pages";

export default async function TeamPage() {
  const { user } = await requireSession();
  if (user.role !== "admin") {
    return <Unauthorized/>
  }

  const team = await listTeamAsAdmin(user);
  const normalizedTeam = team.map((member) => ({
    ...member,
    role: isUserRole(member.role) ? member.role : "client",
  }));

  return <TeamManagement initialTeam={normalizedTeam} />;
}
