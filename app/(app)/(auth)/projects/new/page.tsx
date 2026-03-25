import { ProjectProposalForm } from "@/components/layout/dashboard/project-proposal-form";
import { requireSession } from "@/lib/session";
import { Unauthorized } from "@/components/global/pages";

export default async function NewProjectProposalPage() {
  const { user } = await requireSession();

  if (user.role !== "client") {
    return <Unauthorized />
  }

  return <ProjectProposalForm />;
}
