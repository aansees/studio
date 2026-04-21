import { ProjectProposalForm } from "@/components/layout/dashboard/project-proposal-form";
import { requireSession } from "@/lib/session";
import { Unauthorized } from "@/components/global/pages";
import { listBookableEventTypesForClient } from "@/lib/services/bookings";

export default async function NewProjectProposalPage() {
  const { user } = await requireSession();

  if (user.role !== "client") {
    return <Unauthorized />
  }

  let bookingSetup: Awaited<ReturnType<typeof listBookableEventTypesForClient>> | null =
    null;
  let bookingSetupError: string | null = null;

  try {
    bookingSetup = await listBookableEventTypesForClient(user);
  } catch (error) {
    bookingSetupError =
      error instanceof Error
        ? error.message
        : "Unable to load booking options";
  }

  return (
    <ProjectProposalForm
      bookingSetup={bookingSetup}
      bookingSetupError={bookingSetupError}
    />
  );
}
