import { ProjectProposalForm } from "@/app/(app)/(auth)/dashboard/projects/new/_components/project_proposal_form"
import { listBookableEventTypesForPublic } from "@/lib/services/bookings"

export const dynamic = "force-dynamic"

export default async function StartProjectPage() {
  let bookingSetup: Awaited<ReturnType<typeof listBookableEventTypesForPublic>> | null =
    null
  let bookingSetupError: string | null = null

  try {
    bookingSetup = await listBookableEventTypesForPublic()
  } catch (error) {
    console.error("Unable to load public booking options")
    bookingSetupError =
      "Booking options are temporarily unavailable. You can still submit the project details."
  }

  return (
    <main className="dark h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <ProjectProposalForm
        mode="public"
        bookingSetup={bookingSetup}
        bookingSetupError={bookingSetupError}
        currentUser={{
          email: "",
          name: "",
        }}
      />
    </main>
  )
}
