"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClockIcon, FileTextIcon, Sparkle } from "lucide-react";
import { toast } from "sonner";

import { ProjectRichTextEditor } from "@/components/layout/dashboard/project-rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BookableEventType = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  availableDurations: number[];
  timezone: string;
  locationLabel: string | null;
  locationKind: string | null;
};

type BookingSetup = {
  admin: {
    id: string;
    name: string;
    bookingPageTitle: string | null;
    bookingPageDescription: string | null;
  };
  eventTypes: BookableEventType[];
};

type SlotsPayload = {
  timezone: string;
  selectedDurationMinutes: number;
  days: Array<{
    date: string;
    label: string;
    slots: Array<{
      startsAt: string;
      endsAt: string;
    }>;
  }>;
};

type BookedConsultation = {
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

export function ProjectProposalForm({
  bookingSetup,
  bookingSetupError,
}: {
  bookingSetup: BookingSetup | null;
  bookingSetupError: string | null;
}) {
  const router = useRouter();
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  const eventTypes = useMemo(() => bookingSetup?.eventTypes ?? [], [bookingSetup]);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState(
    eventTypes[0]?.id ?? "",
  );
  const [selectedDurationMinutes, setSelectedDurationMinutes] =
    useState<number>(eventTypes[0]?.durationMinutes ?? 30);
  const [slotsData, setSlotsData] = useState<SlotsPayload | null>(null);
  const [slotsPending, setSlotsPending] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [bookingPending, setBookingPending] = useState(false);
  const [bookedConsultation, setBookedConsultation] =
    useState<BookedConsultation | null>(null);

  const selectedEventType = useMemo(
    () =>
      eventTypes.find((eventType) => eventType.id === selectedEventTypeId) ?? null,
    [eventTypes, selectedEventTypeId],
  );

  useEffect(() => {
    if (eventTypes.length === 0) {
      setSelectedEventTypeId("");
      return;
    }

    setSelectedEventTypeId((current) =>
      current && eventTypes.some((eventType) => eventType.id === current)
        ? current
        : eventTypes[0]!.id,
    );
  }, [eventTypes]);

  useEffect(() => {
    if (!selectedEventType) {
      return;
    }

    const availableDurations = selectedEventType.availableDurations;
    setSelectedDurationMinutes((current) => {
      if (availableDurations.includes(current)) {
        return current;
      }

      return selectedEventType.durationMinutes;
    });
  }, [selectedEventType]);

  useEffect(() => {
    if (!selectedEventTypeId) {
      setSlotsData(null);
      setSelectedDate(null);
      setSelectedSlotStart(null);
      return;
    }

    const controller = new AbortController();
    setSlotsPending(true);
    setBookedConsultation(null);
    setSelectedSlotStart(null);

    const query = new URLSearchParams({
      eventTypeId: selectedEventTypeId,
      durationMinutes: String(selectedDurationMinutes),
      days: "14",
    });

    fetch(`/api/bookings/client/slots?${query.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { data?: SlotsPayload; error?: string }
          | null;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error ?? "Unable to load available slots");
        }

        return payload.data;
      })
      .then((payload) => {
        setSlotsData(payload);

        setSelectedDate((current) => {
          if (current && payload.days.some((day) => day.date === current)) {
            return current;
          }

          return payload.days[0]?.date ?? null;
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setSlotsData(null);
        setSelectedDate(null);
        setSelectedSlotStart(null);
        toast.error(
          error instanceof Error ? error.message : "Unable to load available slots",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSlotsPending(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [selectedDurationMinutes, selectedEventTypeId]);

  const activeDay = useMemo(
    () => slotsData?.days.find((day) => day.date === selectedDate) ?? slotsData?.days[0],
    [selectedDate, slotsData],
  );

  const timeZone = slotsData?.timezone ?? selectedEventType?.timezone ?? "UTC";

  const canSubmit = useMemo(
    () =>
      title.trim().length >= 2 &&
      Boolean(bookedConsultation?.id) &&
      !bookingSetupError &&
      eventTypes.length > 0,
    [bookedConsultation?.id, bookingSetupError, eventTypes.length, title],
  );

  const selectedSlotLabel = useMemo(() => {
    if (!selectedSlotStart) {
      return null;
    }

    const value = new Date(selectedSlotStart);
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timeZone,
    }).format(value);
  }, [selectedSlotStart, timeZone]);

  const bookedLabel = useMemo(() => {
    if (!bookedConsultation) {
      return null;
    }

    const start = new Date(bookedConsultation.startsAt);
    const end = new Date(bookedConsultation.endsAt);

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: bookedConsultation.timezone,
    }).formatRange(start, end);
  }, [bookedConsultation]);

  const focusEditor = useCallback(() => {
    const editable = editorHostRef.current?.querySelector<HTMLElement>(
      '[contenteditable="true"], .ProseMirror',
    );

    if (!editable) {
      return;
    }

    requestAnimationFrame(() => {
      editable.focus();

      const selection = window.getSelection();
      if (!selection) {
        return;
      }

      const range = document.createRange();
      range.selectNodeContents(editable);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    });
  }, []);

  async function submitProposal() {
    if (!canSubmit || pending || !bookedConsultation) {
      if (!bookedConsultation) {
        toast.error("Please book a consultation before submitting");
      }
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: title.trim(),
          notes: notes.trim() || undefined,
          bookingId: bookedConsultation.id,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to submit proposal");
      }

      toast.success("Proposal submitted");
      router.push(`/projects/${payload.projectId}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to submit proposal",
      );
    } finally {
      setPending(false);
    }
  }

  async function bookConsultation() {
    if (!selectedEventTypeId || !selectedSlotStart || bookingPending) {
      return;
    }

    setBookingPending(true);

    try {
      const response = await fetch("/api/bookings/client", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventTypeId: selectedEventTypeId,
          startsAt: selectedSlotStart,
          durationMinutes: selectedDurationMinutes,
          attendeeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { data?: BookedConsultation; error?: string }
        | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error ?? "Unable to book consultation");
      }

      setBookedConsultation(payload.data);
      toast.success("Consultation booked");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to book consultation",
      );
    } finally {
      setBookingPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
      <Button
        onClick={() => void submitProposal()}
        disabled={!canSubmit || pending}
        className="absolute top-2 right-2"
      >
        <Sparkle className="h-4 w-4 rounded-full bg-white fill-primary text-white" />
        {pending ? "Submitting..." : "Submit proposal"}
      </Button>

      <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Book Consultation</p>
            <p className="text-xs text-muted-foreground">
              Schedule a discussion with {bookingSetup?.admin.name ?? "the admin"} before
              sending the project proposal.
            </p>
          </div>
          <Badge variant={bookedConsultation ? "secondary" : "outline"}>
            {bookedConsultation ? "Booked" : "Required"}
          </Badge>
        </div>

        {bookingSetup?.admin.bookingPageTitle ? (
          <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm">
            <p className="font-medium">{bookingSetup.admin.bookingPageTitle}</p>
            {bookingSetup.admin.bookingPageDescription ? (
              <p className="text-xs text-muted-foreground">
                {bookingSetup.admin.bookingPageDescription}
              </p>
            ) : null}
          </div>
        ) : null}

        {bookingSetupError ? (
          <p className="text-sm text-destructive">{bookingSetupError}</p>
        ) : eventTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No consultation event type is active yet. Ask the admin to configure and
            activate at least one public booking event type.
          </p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Event type</p>
                <Select
                  value={selectedEventTypeId}
                  onValueChange={(value) => setSelectedEventTypeId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((eventType) => (
                      <SelectItem key={eventType.id} value={eventType.id}>
                        {eventType.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Duration</p>
                <Select
                  value={String(selectedDurationMinutes)}
                  onValueChange={(value) => setSelectedDurationMinutes(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedEventType?.availableDurations ?? [selectedDurationMinutes]).map(
                      (value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value} min
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {bookedConsultation ? (
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Consultation confirmed</p>
                  <p className="text-xs text-muted-foreground">{bookedLabel}</p>
                  {bookedConsultation.locationLabel ? (
                    <p className="text-xs text-muted-foreground">
                      {bookedConsultation.locationLabel}
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBookedConsultation(null)}
                >
                  Change slot
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Select date</p>
                  <div className="flex flex-wrap gap-2">
                    {(slotsData?.days ?? []).map((day) => (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day.date);
                          setSelectedSlotStart(null);
                        }}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          selectedDate === day.date
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/60 bg-background hover:border-border"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Select time ({timeZone})</p>
                  {slotsPending ? (
                    <p className="text-sm text-muted-foreground">Loading available slots...</p>
                  ) : activeDay && activeDay.slots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activeDay.slots.map((slot) => (
                        <button
                          key={slot.startsAt}
                          type="button"
                          onClick={() => setSelectedSlotStart(slot.startsAt)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                            selectedSlotStart === slot.startsAt
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/60 bg-background hover:border-border"
                          }`}
                        >
                          {new Intl.DateTimeFormat(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone,
                          }).format(new Date(slot.startsAt))}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No slots available in this range. Try a different event type or
                      duration.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClockIcon className="h-3.5 w-3.5" />
                    {selectedSlotLabel
                      ? `Selected: ${selectedSlotLabel}`
                      : "Select a slot to continue"}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => void bookConsultation()}
                    disabled={
                      !selectedSlotStart || bookingPending || slotsPending || !activeDay
                    }
                  >
                    {bookingPending ? "Booking..." : "Book consultation"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileTextIcon className="h-4 w-4" />
          Proposal document
        </div>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return;
            }

            event.preventDefault();
            focusEditor();
          }}
          placeholder="Title"
          minLength={2}
          className="mt-2 h-auto appearance-none border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight shadow-none outline-none ring-0 focus:border-transparent focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 md:text-5xl"
        />

        <Separator className="my-3" />

        <div ref={editorHostRef}>
          <ProjectRichTextEditor
            value={notes}
            onChange={setNotes}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
