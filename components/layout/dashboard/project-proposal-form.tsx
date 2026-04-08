"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CalendarClockIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
  Columns3,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  Grid3x3,
  Sparkle,
} from "lucide-react";
import { toast } from "sonner";

import { ProjectRichTextEditor } from "@/components/layout/dashboard/project-rich-text";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Frame, FramePanel } from "@/components/ui/frame";
import { RiGoogleFill } from "@remixicon/react";

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const HOUR_VALUES = Array.from({ length: 24 }, (_, hour) => hour);

type ProposalStep = "proposal" | "consultation";
type BookingView = "day" | "timeline" | "list";

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

function parseDateKey(value: string) {
  return new Date(`${value}T12:00:00`);
}

function formatDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const date = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function getHourInTimeZone(value: string, timeZone: string) {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone,
  })
    .formatToParts(new Date(value))
    .find((part) => part.type === "hour")?.value;

  return Number.parseInt(hourPart ?? "0", 10);
}

function formatHourLabel(hour: number, useTwentyFourHour: boolean) {
  if (useTwentyFourHour) {
    return `${String(hour).padStart(2, "0")}:00`;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;

  return `${normalized}:00 ${suffix}`;
}

export function ProjectProposalForm({
  bookingSetup,
  bookingSetupError,
}: {
  bookingSetup: BookingSetup | null;
  bookingSetupError: string | null;
}) {
  const router = useRouter();
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState<ProposalStep>("proposal");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [bookingView, setBookingView] = useState<BookingView>("day");
  const [useTwentyFourHour, setUseTwentyFourHour] = useState(false);
  const [overlayCalendar, setOverlayCalendar] = useState(true);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();

    return {
      year: now.getFullYear(),
      month: now.getMonth(),
    };
  });

  const eventTypes = useMemo(
    () => bookingSetup?.eventTypes ?? [],
    [bookingSetup],
  );
  const [selectedEventTypeId, setSelectedEventTypeId] = useState(
    eventTypes[0]?.id ?? "",
  );
  const [selectedDurationMinutes, setSelectedDurationMinutes] =
    useState<number>(eventTypes[0]?.durationMinutes ?? 30);
  const [slotsData, setSlotsData] = useState<SlotsPayload | null>(null);
  const [slotsPending, setSlotsPending] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(
    null,
  );
  const [bookingPending, setBookingPending] = useState(false);
  const [bookedConsultation, setBookedConsultation] =
    useState<BookedConsultation | null>(null);

  const selectedEventType = useMemo(
    () =>
      eventTypes.find((eventType) => eventType.id === selectedEventTypeId) ??
      null,
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
    if (step !== "consultation") {
      return;
    }

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
        const payload = (await response.json().catch(() => null)) as {
          data?: SlotsPayload;
          error?: string;
        } | null;

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
          error instanceof Error
            ? error.message
            : "Unable to load available slots",
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
  }, [selectedDurationMinutes, selectedEventTypeId, step]);

  useEffect(() => {
    const seedDate = selectedDate ?? slotsData?.days[0]?.date;
    if (!seedDate) {
      return;
    }

    const value = parseDateKey(seedDate);
    setVisibleMonth((current) => {
      const next = {
        year: value.getFullYear(),
        month: value.getMonth(),
      };

      if (current.year === next.year && current.month === next.month) {
        return current;
      }

      return next;
    });
  }, [selectedDate, slotsData]);

  const activeDay = useMemo(
    () =>
      slotsData?.days.find((day) => day.date === selectedDate) ??
      slotsData?.days[0],
    [selectedDate, slotsData],
  );

  const slotsByDate = useMemo(() => {
    const map = new Map<string, SlotsPayload["days"][number]>();

    for (const day of slotsData?.days ?? []) {
      map.set(day.date, day);
    }

    return map;
  }, [slotsData]);

  const timelineDays = useMemo(() => {
    if (!slotsData?.days.length) {
      return [];
    }

    if (!selectedDate) {
      return slotsData.days.slice(0, 7);
    }

    const selectedIndex = slotsData.days.findIndex(
      (day) => day.date === selectedDate,
    );
    if (selectedIndex < 0) {
      return slotsData.days.slice(0, 7);
    }

    const startIndex = Math.max(
      0,
      Math.min(selectedIndex, Math.max(slotsData.days.length - 7, 0)),
    );

    return slotsData.days.slice(startIndex, startIndex + 7);
  }, [selectedDate, slotsData]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(visibleMonth.year, visibleMonth.month, 1);
    const totalDays = new Date(
      visibleMonth.year,
      visibleMonth.month + 1,
      0,
    ).getDate();
    const leadingSlots = firstDay.getDay();
    const cells: Array<{
      key: string;
      date: string | null;
      label: number | null;
      hasSlots: boolean;
    }> = [];

    for (let index = 0; index < leadingSlots; index += 1) {
      cells.push({
        key: `leading-${index}`,
        date: null,
        label: null,
        hasSlots: false,
      });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const key = formatDateKey(
        new Date(visibleMonth.year, visibleMonth.month, day),
      );

      cells.push({
        key,
        date: key,
        label: day,
        hasSlots: slotsByDate.has(key),
      });
    }

    return cells;
  }, [slotsByDate, visibleMonth.month, visibleMonth.year]);

  const timeZone = slotsData?.timezone ?? selectedEventType?.timezone ?? "UTC";

  const canContinue = title.trim().length >= 2;

  const canSubmit = useMemo(
    () =>
      title.trim().length >= 2 &&
      Boolean(bookedConsultation?.id) &&
      !bookingSetupError &&
      eventTypes.length > 0,
    [bookedConsultation?.id, bookingSetupError, eventTypes.length, title],
  );

  const formatSlotTime = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: !useTwentyFourHour,
        timeZone,
      }).format(new Date(value)),
    [timeZone, useTwentyFourHour],
  );

  const selectedSlotLabel = useMemo(() => {
    if (!selectedSlotStart) {
      return null;
    }

    return formatSlotTime(selectedSlotStart);
  }, [formatSlotTime, selectedSlotStart]);

  const bookedSchedule = useMemo(() => {
    if (!bookedConsultation) {
      return null;
    }

    const start = new Date(bookedConsultation.startsAt);
    const end = new Date(bookedConsultation.endsAt);

    const dateLabel = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: bookedConsultation.timezone,
    }).format(start);

    const timeLabel = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: !useTwentyFourHour,
      timeZone: bookedConsultation.timezone,
    }).formatRange(start, end);

    const timezoneLabel =
      new Intl.DateTimeFormat(undefined, {
        timeZone: bookedConsultation.timezone,
        timeZoneName: "long",
      })
        .formatToParts(start)
        .find((part) => part.type === "timeZoneName")?.value ??
      bookedConsultation.timezone;

    return {
      dateLabel,
      timeLabel,
      timezoneLabel,
    };
  }, [bookedConsultation, useTwentyFourHour]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) {
      return null;
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
    }).format(parseDateKey(selectedDate));
  }, [selectedDate]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
      }).format(new Date(visibleMonth.year, visibleMonth.month, 1)),
    [visibleMonth.month, visibleMonth.year],
  );

  const totalSlotCount = useMemo(
    () =>
      (slotsData?.days ?? []).reduce(
        (count, day) => count + day.slots.length,
        0,
      ),
    [slotsData],
  );

  const proposalLabel = title.trim() || "Untitled proposal";

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

  function goToConsultationStep() {
    if (!canContinue) {
      toast.error("Add a proposal title before continuing");
      return;
    }

    setStep("consultation");
  }

  function shiftVisibleMonth(delta: number) {
    setVisibleMonth((current) => {
      const nextDate = new Date(current.year, current.month + delta, 1);

      return {
        year: nextDate.getFullYear(),
        month: nextDate.getMonth(),
      };
    });
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlotStart((current) => {
      if (!current || current.slice(0, 10) !== date) {
        return null;
      }

      return current;
    });
  }

  function selectSlot(date: string, startsAt: string) {
    setSelectedDate(date);
    setSelectedSlotStart(startsAt);
  }

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

      const payload = (await response.json().catch(() => null)) as {
        data?: BookedConsultation;
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error ?? "Unable to book consultation");
      }

      setBookedConsultation(payload.data);
      setSelectedDate(payload.data.startsAt.slice(0, 10));
      setSelectedSlotStart(payload.data.startsAt);
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
      <TooltipProvider>
        <div className="flex items-center justify-end gap-2">
          {step === "consultation" ? (
            <Button variant="outline" onClick={() => setStep("proposal")}>
              Back
            </Button>
          ) : null}

          {step === "proposal" ? (
            <Button onClick={goToConsultationStep} disabled={!canContinue}>
              <Sparkle className="h-4 w-4 rounded-full bg-white fill-primary text-white" />
              Next
            </Button>
          ) : (
            <Button
              onClick={() => void submitProposal()}
              disabled={!canSubmit || pending}
            >
              <Sparkle className="h-4 w-4 rounded-full bg-white fill-primary text-white" />
              {pending ? "Submitting..." : "Submit proposal"}
            </Button>
          )}
        </div>

        {step === "proposal" ? (
          <div className="flex flex-1 flex-col bg-background/70 p-4 md:p-6">
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
        ) : (
          <div className="space-y-4">
            <div className="space-y-4 p-4 md:p-5">
              {bookingSetupError ? (
                <p className="text-sm text-destructive">{bookingSetupError}</p>
              ) : eventTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No consultation event type is active yet. Ask the admin to
                  configure and activate at least one public booking event type.
                </p>
              ) : bookedConsultation ? (
                <div className="mx-auto w-full max-w-lg space-y-3">
                  <Frame className="p-5">
                    <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                      <CheckIcon className="size-4" />
                    </div>

                    <h3 className="mt-3 text-center text-xl font-semibold">
                      This meeting is scheduled
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
                      We sent an email with a calendar invitation with the
                      details to everyone.
                    </p>

                    <Separator className="my-8" />

                    <dl className="space-y-3 text-sm">
                      <div className="grid grid-cols-[74px_minmax(0,1fr)] gap-3">
                        <dt className="text-xs text-muted-foreground">What</dt>
                        <dd className="text-sm">
                          {bookedConsultation.eventTypeTitle} about{" "}
                          {proposalLabel}
                        </dd>
                      </div>

                      <div className="grid grid-cols-[74px_minmax(0,1fr)] gap-3">
                        <dt className="text-xs text-muted-foreground">When</dt>
                        <dd className="space-y-0.5">
                          <p>{bookedSchedule?.dateLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {bookedSchedule
                              ? `${bookedSchedule.timeLabel} (${bookedSchedule.timezoneLabel})`
                              : ""}
                          </p>
                        </dd>
                      </div>

                      <div className="grid grid-cols-[74px_minmax(0,1fr)] gap-3">
                        <dt className="text-xs text-muted-foreground">Who</dt>
                        <dd className="space-y-1.5">
                          <p className="inline-flex items-center gap-1.5 text-sm">
                            <span>{bookedConsultation.ownerName}</span>
                            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                              Host
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">You</p>
                        </dd>
                      </div>

                      <div className="grid grid-cols-[74px_minmax(0,1fr)] gap-3">
                        <dt className="text-xs text-muted-foreground">Where</dt>
                        <dd>
                          {bookedConsultation.meetingUrl ? (
                            <a
                              href={bookedConsultation.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary"
                            >
                              {bookedConsultation.locationLabel ??
                                "Join meeting"}
                              <ExternalLinkIcon className="size-3.5" />
                            </a>
                          ) : (
                            <p className="text-sm">
                              {bookedConsultation.locationLabel ??
                                "Location shared by host"}
                            </p>
                          )}
                        </dd>
                      </div>
                    </dl>

                    <Separator className="my-8" />

                    <p className="text-center text-sm text-muted-foreground">
                      Need to make a change?{" "}
                      <button
                        type="button"
                        onClick={() => setBookedConsultation(null)}
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        Reschedule
                      </button>{" "}
                      or{" "}
                      <button
                        type="button"
                        onClick={() => setBookedConsultation(null)}
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        Cancel
                      </button>
                    </p>

                    <Separator className="my-8" />

                    <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Add to calendar
                      </span>
                      {[<RiGoogleFill/>, "Outlook", "Office 365", "Yahoo"].map(
                        (item, index) => (
                          <Button
                            key={index}
                            type="button"
                            size={"icon"}
                            variant={"secondary"}
                            className="rounded-md border border-border/60 px-2 py-1 text-[11px] text-muted-foreground transition hover:text-foreground"
                          >
                            {item}
                          </Button>
                        ),
                      )}
                    </div>
                  </Frame>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                    <p>
                      Google&apos;s new spam policy could prevent notifications
                      for this booking from reaching your inbox.
                    </p>
                    <button
                      type="button"
                      className="mt-1 font-medium underline underline-offset-2"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
                  <aside className="space-y-4 p-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Host</p>
                      <p className="text-sm font-semibold">
                        {bookingSetup?.admin.name ?? "Admin"}
                      </p>
                      <p className="mt-3 text-2xl font-semibold leading-tight">
                        {selectedEventType?.title ?? "Consultation"}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground gap-1.5 flex">
                      <p className="inline-flex items-center gap-1.5 m-0">
                        <Clock3Icon className="h-3.5 w-3.5" />
                        {selectedDurationMinutes}m
                      </p>
                      <p className="inline-flex items-center gap-1.5">
                        <GlobeIcon className="h-3.5 w-3.5" />
                        {timeZone}
                      </p>
                    </div>

                    {bookingSetup?.admin.bookingPageTitle ? (
                      <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs">
                        <p className="font-medium">
                          {bookingSetup.admin.bookingPageTitle}
                        </p>
                        {bookingSetup.admin.bookingPageDescription ? (
                          <p className="mt-1 text-muted-foreground">
                            {bookingSetup.admin.bookingPageDescription}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </aside>

                  <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
                      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch
                          size="sm"
                          checked={overlayCalendar}
                          onCheckedChange={setOverlayCalendar}
                        />
                        Overlay my calendar
                      </label>

                      <Toolbar className={"p-0.5"}>
                        <ToggleGroup
                          className="border-none p-0"
                          defaultValue={["left"]}
                        >
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <ToolbarButton
                                  aria-label="Align left"
                                  render={<ToggleGroupItem value="left" />}
                                >
                                  12h
                                </ToolbarButton>
                              }
                              onClick={() => setUseTwentyFourHour(false)}
                            />
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <ToolbarButton
                                  aria-label="Align center"
                                  render={
                                    <ToggleGroupItem
                                      aria-label="Toggle center"
                                      value="center"
                                    />
                                  }
                                >
                                  24h
                                </ToolbarButton>
                              }
                              onClick={() => setUseTwentyFourHour(true)}
                            />
                          </Tooltip>
                        </ToggleGroup>
                      </Toolbar>

                      <Toolbar className={"p-0.5"}>
                        <ToggleGroup
                          className="border-none p-0"
                          defaultValue={["left"]}
                        >
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <ToolbarButton
                                  aria-label="Align left"
                                  render={<ToggleGroupItem value="left" />}
                                >
                                  <Calendar />
                                </ToolbarButton>
                              }
                              onClick={() => setBookingView("day")}
                            />
                            <TooltipPopup sideOffset={8}>
                              Switch to Monthly view
                            </TooltipPopup>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <ToolbarButton
                                  aria-label="Align center"
                                  render={
                                    <ToggleGroupItem
                                      aria-label="Toggle center"
                                      value="center"
                                    />
                                  }
                                >
                                  <Grid3x3 />
                                </ToolbarButton>
                              }
                              onClick={() => setBookingView("timeline")}
                            />
                            <TooltipPopup sideOffset={8}>
                              Switch to Weekly view
                            </TooltipPopup>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <ToolbarButton
                                  aria-label="Align right"
                                  render={
                                    <ToggleGroupItem
                                      aria-label="Toggle right"
                                      value="right"
                                    />
                                  }
                                >
                                  <Columns3 />
                                </ToolbarButton>
                              }
                              onClick={() => setBookingView("list")}
                            />
                            <TooltipPopup sideOffset={8}>
                              Switch to Column view
                            </TooltipPopup>
                          </Tooltip>
                        </ToggleGroup>
                      </Toolbar>
                    </div>

                    {bookingView === "day" ? (
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-medium">{monthLabel}</p>
                            <div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => shiftVisibleMonth(-1)}
                              >
                                <ChevronLeftIcon className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => shiftVisibleMonth(1)}
                              >
                                <ChevronRightIcon className="size-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
                            {WEEKDAY_LABELS.map((label) => (
                              <span key={label}>{label}</span>
                            ))}
                          </div>

                          <div className="mt-1 grid grid-cols-7 gap-1">
                            {calendarCells.map((cell) =>
                              cell.date ? (
                                <button
                                  key={cell.key}
                                  type="button"
                                  onClick={() => selectDate(cell.date!)}
                                  disabled={!cell.hasSlots}
                                  className={cn(
                                    "h-14 rounded-md border text-xs font-medium transition",
                                    selectedDate === cell.date
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : cell.hasSlots
                                        ? "border-border/20 bg-muted/20 hover:border-primary/60"
                                        : "cursor-not-allowed border-none text-muted-foreground/50",
                                  )}
                                >
                                  {cell.label}
                                </button>
                              ) : (
                                <span key={cell.key} className="h-9" />
                              ),
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="border-border/60 px-3 py-2">
                            <p className="text-sm font-medium">
                              {activeDay?.label ?? "Select date"}
                            </p>
                          </div>

                          <div className="max-h-95 space-y-2 overflow-y-auto p-3">
                            {slotsPending ? (
                              <p className="text-sm text-muted-foreground">
                                Loading available slots...
                              </p>
                            ) : activeDay && activeDay.slots.length > 0 ? (
                              activeDay.slots.map((slot) => (
                                <button
                                  key={slot.startsAt}
                                  type="button"
                                  onClick={() =>
                                    selectSlot(activeDay.date, slot.startsAt)
                                  }
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition",
                                    selectedSlotStart === slot.startsAt
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border/20 bg-muted/20 hover:border-primary/60",
                                  )}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    {formatSlotTime(slot.startsAt)}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No slots available for this day.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {bookingView === "timeline" ? (
                      <div className="overflow-auto border border-border/60 bg-background/60">
                        <div className="min-w-220">
                          <div
                            className="grid"
                            style={{
                              gridTemplateColumns: `76px repeat(${Math.max(timelineDays.length, 1)}, minmax(0, 1fr))`,
                            }}
                          >
                            <div className="h-11 border-r border-b border-border/60" />

                            {timelineDays.map((day) => (
                              <button
                                key={day.date}
                                type="button"
                                onClick={() => selectDate(day.date)}
                                className={cn(
                                  "h-11 border-r border-b border-border/60 px-2 text-center text-xs transition",
                                  selectedDate === day.date
                                    ? "bg-primary/15 text-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {day.label}
                              </button>
                            ))}

                            {HOUR_VALUES.map((hour) => (
                              <Fragment key={`hour-${hour}`}>
                                <div className="h-10 border-r border-b border-border/50 px-2 pt-1 text-[10px] text-muted-foreground">
                                  {formatHourLabel(hour, useTwentyFourHour)}
                                </div>

                                {timelineDays.map((day) => {
                                  const hourSlot = day.slots.find(
                                    (slot) =>
                                      getHourInTimeZone(
                                        slot.startsAt,
                                        timeZone,
                                      ) === hour,
                                  );
                                  const isSelected =
                                    selectedDate === day.date &&
                                    selectedSlotStart != null &&
                                    getHourInTimeZone(
                                      selectedSlotStart,
                                      timeZone,
                                    ) === hour;

                                  return (
                                    <button
                                      key={`${day.date}-${hour}`}
                                      type="button"
                                      disabled={!hourSlot}
                                      onClick={() => {
                                        if (!hourSlot) {
                                          return;
                                        }

                                        selectSlot(day.date, hourSlot.startsAt);
                                      }}
                                      className={cn(
                                        "relative h-10 border-r border-b border-border/50 text-[10px] transition",
                                        hourSlot
                                          ? isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-background/80 text-muted-foreground hover:bg-background"
                                          : overlayCalendar
                                            ? "cursor-not-allowed bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,rgba(148,163,184,0.1)_5px,rgba(148,163,184,0.1)_10px)]"
                                            : "cursor-not-allowed bg-muted/20",
                                      )}
                                    >
                                      {hourSlot
                                        ? formatSlotTime(hourSlot.startsAt)
                                        : ""}
                                    </button>
                                  );
                                })}
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {bookingView === "list" ? (
                      <div className="overflow-auto rounded-2xl border border-border/60 bg-background/60 p-3">
                        {timelineDays.length > 0 ? (
                          <div
                            className="grid min-w-230 gap-3"
                            style={{
                              gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))`,
                            }}
                          >
                            {timelineDays.map((day) => (
                              <div
                                key={day.date}
                                className={cn(
                                  "rounded-xl border border-border/60 bg-background/80",
                                  selectedDate === day.date
                                    ? "ring-1 ring-primary/50"
                                    : "",
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => selectDate(day.date)}
                                  className="w-full border-b border-border/60 px-3 py-2 text-left text-xs font-medium"
                                >
                                  {day.label}
                                </button>

                                <div className="max-h-90 space-y-2 overflow-y-auto p-2">
                                  {day.slots.length > 0 ? (
                                    day.slots.map((slot) => (
                                      <button
                                        key={slot.startsAt}
                                        type="button"
                                        onClick={() =>
                                          selectSlot(day.date, slot.startsAt)
                                        }
                                        className={cn(
                                          "flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition",
                                          selectedSlotStart === slot.startsAt
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border/60 bg-background/70 hover:border-primary/60",
                                        )}
                                      >
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        {formatSlotTime(slot.startsAt)}
                                      </button>
                                    ))
                                  ) : (
                                    <p className="px-1 py-2 text-xs text-muted-foreground">
                                      Unavailable
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No upcoming slots available.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </section>
                </div>
              )}

              {!bookingSetupError &&
              eventTypes.length > 0 &&
              !bookedConsultation ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClockIcon className="h-3.5 w-3.5" />
                    {selectedSlotLabel
                      ? `Selected: ${selectedDateLabel ? `${selectedDateLabel} - ` : ""}${selectedSlotLabel}`
                      : "Select a slot to continue"}
                  </span>

                  <span>{totalSlotCount} slots in this range</span>

                  <Button
                    size="sm"
                    onClick={() => void bookConsultation()}
                    disabled={
                      !selectedSlotStart ||
                      bookingPending ||
                      slotsPending ||
                      !activeDay ||
                      Boolean(bookedConsultation)
                    }
                  >
                    {bookingPending ? "Booking..." : "Book consultation"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
}
