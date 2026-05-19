"use client";

import type { ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import BookingSubmitForm from "@/app/(app)/(auth)/dashboard/projects/new/_components/booking_submit_form";
import type {
  BookedConsultation,
  BookingQuestion,
} from "@/app/(app)/(auth)/dashboard/projects/new/_components/booking_submit_form";

type Slot = {
  startsAt: string;
  endsAt: string;
};

type ActiveDay = {
  date: string;
  label: string | null;
  slots: Slot[];
};

export default function MonthlyBookingPanel({
  bookedConsultation,
  clearSelectedSlot,
  selectedDurationMinutes,
  pending,
  canSubmitBase,
  attendeeName,
  setAttendeeName,
  attendeeEmail,
  setAttendeeEmail,
  bookingNotes,
  setBookingNotes,
  showGuests,
  setShowGuests,
  guestEmails,
  setGuestEmails,
  questions,
  questionAnswers,
  setQuestionAnswer,
  useTwentyFourHour,
  submitProposal,
  activeDay,
  slotsPending,
  selectedSlotStart,
  selectSlot,
  formatSlotTime,
  renderTimeFormatToggle,
}: {
  bookedConsultation: BookedConsultation | null;
  clearSelectedSlot: () => void;
  selectedDurationMinutes: number;
  pending: boolean;
  canSubmitBase: boolean;
  attendeeName: string;
  setAttendeeName: (value: string) => void;
  attendeeEmail: string;
  setAttendeeEmail: (value: string) => void;
  bookingNotes: string;
  setBookingNotes: (value: string) => void;
  showGuests: boolean;
  setShowGuests: (value: boolean) => void;
  guestEmails: string;
  setGuestEmails: (value: string) => void;
  questions: BookingQuestion[];
  questionAnswers: Record<string, string>;
  setQuestionAnswer: (fieldKey: string, value: string) => void;
  useTwentyFourHour: boolean;
  submitProposal: (consultation: BookedConsultation) => Promise<void> | void;
  activeDay: ActiveDay | null;
  slotsPending: boolean;
  selectedSlotStart: string | null;
  selectSlot: (date: string, slot: Slot) => void;
  formatSlotTime: (value: string) => string;
  renderTimeFormatToggle?: () => ReactNode;
}) {
  if (bookedConsultation) {
    return (
      <div className="h-full p-6">
        <BookingSubmitForm
          consultation={bookedConsultation}
          idPrefix="proposal-inline-booking"
          onBack={clearSelectedSlot}
          variant="inline"
          selectedDurationMinutes={selectedDurationMinutes}
          pending={pending}
          canSubmitBase={canSubmitBase}
          attendeeName={attendeeName}
          setAttendeeName={setAttendeeName}
          attendeeEmail={attendeeEmail}
          setAttendeeEmail={setAttendeeEmail}
          bookingNotes={bookingNotes}
          setBookingNotes={setBookingNotes}
          showGuests={showGuests}
          setShowGuests={setShowGuests}
          guestEmails={guestEmails}
          setGuestEmails={setGuestEmails}
          questions={questions}
          questionAnswers={questionAnswers}
          setQuestionAnswer={setQuestionAnswer}
          useTwentyFourHour={useTwentyFourHour}
          onSubmit={() => submitProposal(bookedConsultation)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{activeDay?.label ?? "Select date"}</p>
        {renderTimeFormatToggle?.()}
      </div>

      <ScrollArea className="h-0 min-h-0 flex-1 pr-0.5" scrollbarGutter scrollFade hideScrollbars>
        <div className="space-y-1">
          {slotsPending ? (
            <p className="text-sm text-muted-foreground">Loading available slots...</p>
          ) : activeDay && activeDay.slots.length > 0 ? (
            activeDay.slots.map((slot) => (
              <button
                key={slot.startsAt}
                type="button"
                onClick={() => selectSlot(activeDay.date, slot)}
                className={cn(
                  "flex w-full items-center justify-center rounded-lg border px-3 py-2 text-center text-sm font-semibold transition-colors duration-200",
                  selectedSlotStart === slot.startsAt
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-background/70 hover:border-primary/60 hover:bg-muted/30",
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {formatSlotTime(slot.startsAt)}
                </span>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No slots available for this day.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
