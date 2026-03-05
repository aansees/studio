import { redirect } from "next/navigation";

import { TeamManagement } from "@/components/layout/dashboard/team-management";
import { isUserRole } from "@/lib/constants/rbac";
import { requireSession } from "@/lib/session";
import { listTeamAsAdmin } from "@/lib/services/team";

export default async function TeamPage() {
  const { user } = await requireSession();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const team = await listTeamAsAdmin(user);
  const normalizedTeam = team.map((member) => ({
    ...member,
    role: isUserRole(member.role) ? member.role : "client",
  }));

  return <TeamManagement initialTeam={normalizedTeam} />;
}
