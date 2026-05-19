"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeftIcon, ChevronRightIcon, Clock3Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import MiniCalendar from "@/app/(app)/(auth)/dashboard/projects/new/_components/mini_calendar";
import BookingSubmitForm from "@/app/(app)/(auth)/dashboard/projects/new/_components/booking_submit_form";

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
  useTwentyFourHour,
  submitProposal,
  activeDay,
  slotsPending,
  selectedSlotStart,
  selectSlot,
  formatSlotTime,
  monthLabel,
  shiftVisibleMonth,
  calendarCells,
  selectDate,
  selectedDate,
  timeZone,
  renderTimeFormatToggle,
}: any) {
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
          useTwentyFourHour={useTwentyFourHour}
          onSubmit={() => submitProposal(bookedConsultation)}
        />
      </div>
    );
  }

  return (
    <div className="h-full p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{activeDay?.label ?? "Select date"}</p>
        {renderTimeFormatToggle?.()}
      </div>

      <ScrollArea className="max-h-[390px] pr-0.5" scrollbarGutter scrollFade hideScrollbars>
        <div className="space-y-1">
          {slotsPending ? (
            <p className="text-sm text-muted-foreground">Loading available slots...</p>
          ) : activeDay && activeDay.slots.length > 0 ? (
            activeDay.slots.map((slot: any) => (
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
