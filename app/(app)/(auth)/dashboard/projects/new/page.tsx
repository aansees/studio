import { ProjectProposalForm } from "./_components/project_proposal_form";
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
    console.error("Unable to load client booking options");
    bookingSetupError =
      "Booking options are temporarily unavailable. You can still submit the project details.";
  }

  return (
    <ProjectProposalForm
      bookingSetup={bookingSetup}
      bookingSetupError={bookingSetupError}
      currentUser={{
        email: user.email,
        name: user.name,
      }}
    />
  );
}
