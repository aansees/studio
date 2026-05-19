"use client";

import React, { FormEvent } from "react";
import { CalendarClockIcon, Clock3Icon, UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type BookedConsultation = {
  id: string;
  eventTypeId: string;
  eventTypeTitle: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  ownerName: string;
  locationLabel: string | null;
  locationKind: string | null;
  meetingUrl: string | null;
};

export type BookingSubmitFormProps = {
  consultation: BookedConsultation | null;
  idPrefix: string;
  onBack: () => void;
  variant: "dialog" | "inline";
  selectedDurationMinutes: number;
  pending: boolean;
  canSubmitBase: boolean;
  attendeeName: string;
  setAttendeeName: (v: string) => void;
  attendeeEmail: string;
  setAttendeeEmail: (v: string) => void;
  bookingNotes: string;
  setBookingNotes: (v: string) => void;
  showGuests: boolean;
  setShowGuests: (v: boolean) => void;
  guestEmails: string;
  setGuestEmails: (v: string) => void;
  useTwentyFourHour: boolean;
  onSubmit: () => Promise<void> | void;
};

export function BookingSubmitForm({
  consultation,
  idPrefix,
  onBack,
  variant,
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
  onSubmit,
}: BookingSubmitFormProps) {
  const schedule = React.useMemo(() => {
    if (!consultation) return null;
    const start = new Date(consultation.startsAt);
    const end = new Date(consultation.endsAt);
    const dateLabel = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: consultation.timezone,
    }).format(start);
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: !useTwentyFourHour,
      timeZone: consultation.timezone,
    });

    const timeLabel = `${timeFormatter.format(start)} — ${timeFormatter.format(
      end,
    )}`;

    return { dateLabel, timeLabel };
  }, [consultation, useTwentyFourHour]);

  return (
    <form
      className={cn("space-y-4", variant === "inline" && "h-full")}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      {variant === "dialog" && schedule ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
            <CalendarClockIcon className="size-3.5" />
            {schedule.dateLabel}, {schedule.timeLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
            <Clock3Icon className="size-3.5" />
            {selectedDurationMinutes}m
          </span>
        </div>
      ) : null}

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-name`}>Your name *</FieldLabel>
        <Input
          id={`${idPrefix}-name`}
          type="text"
          autoComplete="name"
          value={attendeeName}
          onChange={(ev) => setAttendeeName(ev.target.value)}
          aria-invalid={attendeeName.trim().length > 0 && attendeeName.trim().length < 2}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-email`}>Email address *</FieldLabel>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          value={attendeeEmail}
          onChange={(ev) => setAttendeeEmail(ev.target.value)}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-notes`}>Additional notes</FieldLabel>
        <Textarea
          id={`${idPrefix}-notes`}
          value={bookingNotes}
          onChange={(ev) => setBookingNotes(ev.target.value)}
          placeholder="Please share anything that will help prepare for our meeting."
          className="min-h-20"
        />
      </Field>

      <button
        type="button"
        onClick={() => setShowGuests(!showGuests)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <UserPlusIcon className="size-3.5" />
        Add guests
      </button>

      {showGuests ? (
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-guests`}>Guest emails</FieldLabel>
          <Input
            id={`${idPrefix}-guests`}
            type="text"
            value={guestEmails}
            onChange={(ev) => setGuestEmails(ev.target.value)}
            placeholder="guest@example.com, teammate@example.com"
          />
        </Field>
      ) : null}

      <p className="text-xs text-muted-foreground">
        By proceeding, your proposal and consultation request will be
        submitted together.
      </p>

      <div className={cn("flex items-center justify-end gap-2", variant === "dialog" && "-mx-4 -mb-4 border-t bg-muted/40 p-4") }>
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={!canSubmitBase || !consultation || pending}>
          {pending ? "Submitting..." : "Confirm"}
        </Button>
      </div>
    </form>
  );
}

export default BookingSubmitForm;
