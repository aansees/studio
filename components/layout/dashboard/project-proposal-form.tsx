"use client";

import {
  Fragment,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Calendar,
  CalendarClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
  Columns3,
  GlobeIcon,
  Grid3x3,
  Settings2Icon,
  Sparkle,
  UserPlusIcon,
  VideoIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ProjectRichTextEditor } from "@/components/layout/dashboard/project-rich-text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const HOUR_VALUES = Array.from({ length: 24 }, (_, hour) => hour);
const WEEKLY_DAY_HEADER_HEIGHT = 38;
const WEEKLY_HOUR_ROW_HEIGHT = 58;

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

type ProposalClient = {
  name: string;
  email: string;
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

type SlotSelection = {
  date: string;
  slot: SlotsPayload["days"][number]["slots"][number];
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

function getDateKeyInTimeZone(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
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

function getMinuteOfDayInTimeZone(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone,
  }).formatToParts(value);
  const hour = Number.parseInt(
    parts.find((part) => part.type === "hour")?.value ?? "0",
    10,
  );
  const minute = Number.parseInt(
    parts.find((part) => part.type === "minute")?.value ?? "0",
    10,
  );

  return hour * 60 + minute;
}

function formatHourLabel(hour: number, useTwentyFourHour: boolean) {
  if (useTwentyFourHour) {
    return `${String(hour).padStart(2, "0")}:00`;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;

  return `${normalized}:00 ${suffix}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function appendBookingNotesToProposalNotes(
  proposalNotes: string,
  bookingNotes: string,
) {
  const trimmedNotes = proposalNotes.trim();
  const trimmedBookingNotes = bookingNotes.trim();

  if (!trimmedBookingNotes) {
    return trimmedNotes || undefined;
  }

  const bookingNotesBlock = {
    type: "paragraph" as const,
    content: `Booking notes: ${trimmedBookingNotes}`,
  };

  if (!trimmedNotes) {
    return JSON.stringify([bookingNotesBlock]);
  }

  try {
    const parsed = JSON.parse(trimmedNotes);
    if (Array.isArray(parsed)) {
      return JSON.stringify([...parsed, bookingNotesBlock]);
    }
  } catch {
    // Plain text notes are still accepted by the server-side normalizer.
  }

  return `${trimmedNotes}\n\n${bookingNotesBlock.content}`;
}

export function ProjectProposalForm({
  bookingSetup,
  bookingSetupError,
  currentUser,
}: {
  bookingSetup: BookingSetup | null;
  bookingSetupError: string | null;
  currentUser: ProposalClient;
}) {
  const router = useRouter();
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState<ProposalStep>("proposal");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [attendeeName, setAttendeeName] = useState(currentUser.name);
  const [attendeeEmail, setAttendeeEmail] = useState(currentUser.email);
  const [bookingNotes, setBookingNotes] = useState("");
  const [showGuests, setShowGuests] = useState(false);
  const [guestEmails, setGuestEmails] = useState("");
  const [bookingView, setBookingView] = useState<BookingView>("day");
  const previousBookingViewRef = useRef<BookingView>("day");
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
  const [slotConfirmOpen, setSlotConfirmOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<SlotSelection | null>(null);
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
      setPendingSlot(null);
      setSlotConfirmOpen(false);
      return;
    }

    const controller = new AbortController();
    setSlotsPending(true);
    setBookedConsultation(null);
    setSelectedSlotStart(null);
    setPendingSlot(null);
    setSlotConfirmOpen(false);

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
        setPendingSlot(null);
        setSlotConfirmOpen(false);
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
      isCurrentMonth: boolean;
    }> = [];

    for (let index = 0; index < leadingSlots; index += 1) {
      cells.push({
        key: `leading-${index}`,
        date: null,
        label: null,
        hasSlots: false,
        isCurrentMonth: false,
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
        isCurrentMonth: true,
      });
    }

    const minimumCellCount = 42;
    const targetCellCount = Math.max(
      minimumCellCount,
      Math.ceil(cells.length / 7) * 7,
    );
    for (
      let day = 1;
      cells.length < targetCellCount;
      day += 1
    ) {
      const key = formatDateKey(
        new Date(visibleMonth.year, visibleMonth.month + 1, day),
      );

      cells.push({
        key,
        date: key,
        label: day,
        hasSlots: slotsByDate.has(key),
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [slotsByDate, visibleMonth.month, visibleMonth.year]);

  const timeZone = slotsData?.timezone ?? selectedEventType?.timezone ?? "UTC";

  const canContinue = title.trim().length >= 2;

  const canSubmitBase = useMemo(
    () =>
      title.trim().length >= 2 &&
      attendeeName.trim().length >= 2 &&
      isValidEmail(attendeeEmail.trim()) &&
      !bookingSetupError &&
      eventTypes.length > 0,
    [
      attendeeEmail,
      attendeeName,
      bookingSetupError,
      eventTypes.length,
      title,
    ],
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

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
      }).format(new Date(visibleMonth.year, visibleMonth.month, 1)),
    [visibleMonth.month, visibleMonth.year],
  );

  const timelineRangeLabel = useMemo(() => {
    if (timelineDays.length === 0) {
      return "";
    }

    const first = parseDateKey(timelineDays[0]!.date);
    const last = parseDateKey(timelineDays[timelineDays.length - 1]!.date);
    const firstLabel = new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      timeZone,
    }).format(first);
    const lastLabel = new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      timeZone,
      year: "numeric",
    }).format(last);

    return `${firstLabel} - ${lastLabel}`;
  }, [timeZone, timelineDays]);

  const currentTimeIndicator = useMemo(() => {
    if (bookingView !== "timeline" || timelineDays.length === 0) {
      return null;
    }

    const now = new Date();
    const todayKey = getDateKeyInTimeZone(now, timeZone);
    if (!timelineDays.some((day) => day.date === todayKey)) {
      return null;
    }

    const minuteOfDay = getMinuteOfDayInTimeZone(now, timeZone);

    return {
      label: new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: !useTwentyFourHour,
        timeZone,
      }).format(now),
      top:
        WEEKLY_DAY_HEADER_HEIGHT +
        (minuteOfDay / 60) * WEEKLY_HOUR_ROW_HEIGHT,
    };
  }, [bookingView, timeZone, timelineDays, useTwentyFourHour]);

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
    setSelectedSlotStart(null);
    setBookedConsultation(null);
    setPendingSlot(null);
  }

  function buildDraftConsultation(slot: SlotSelection["slot"]) {
    if (!selectedEventTypeId || !selectedEventType) {
      return null;
    }

    return {
      id: `draft:${selectedEventTypeId}:${slot.startsAt}`,
      eventTypeId: selectedEventTypeId,
      eventTypeTitle: selectedEventType.title,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      timezone: timeZone,
      ownerName: bookingSetup?.admin.name ?? "Admin",
      locationLabel: selectedEventType.locationLabel,
      locationKind: selectedEventType.locationKind,
      meetingUrl: null,
    } satisfies BookedConsultation;
  }

  function selectSlot(date: string, slot: SlotSelection["slot"]) {
    setSelectedDate(date);
    setSelectedSlotStart(slot.startsAt);

    const draftConsultation = buildDraftConsultation(slot);
    if (!draftConsultation) {
      toast.error("Select an available consultation time");
      return;
    }

    if (bookingView === "day") {
      setBookedConsultation(draftConsultation);
      setPendingSlot(null);
      setSlotConfirmOpen(false);
      return;
    }

    setBookedConsultation(null);
    setPendingSlot({ date, slot });
    setSlotConfirmOpen(true);
  }

  function handleSlotDialogOpenChange(open: boolean) {
    setSlotConfirmOpen(open);

    if (!open) {
      setPendingSlot(null);
      setSelectedSlotStart(null);
    }
  }

  function shiftTimelineRange(delta: number) {
    if (!slotsData?.days.length) {
      return;
    }

    const currentIndex = selectedDate
      ? slotsData.days.findIndex((day) => day.date === selectedDate)
      : 0;
    const nextIndex = Math.max(
      0,
      Math.min(
        (currentIndex >= 0 ? currentIndex : 0) + delta,
        slotsData.days.length - 1,
      ),
    );

    selectDate(slotsData.days[nextIndex]!.date);
  }

  function selectToday() {
    const todayKey = getDateKeyInTimeZone(new Date(), timeZone);
    if (slotsByDate.has(todayKey)) {
      selectDate(todayKey);
      return;
    }

    toast.error("No available slots today");
  }

  function getConsultationSchedule(consultation: BookedConsultation | null) {
    if (!consultation) {
      return null;
    }

    const start = new Date(consultation.startsAt);
    const end = new Date(consultation.endsAt);
    const dateLabel = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: consultation.timezone,
    }).format(start);
    const timeLabel = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: !useTwentyFourHour,
      timeZone: consultation.timezone,
    }).formatRange(start, end);

    return { dateLabel, timeLabel };
  }

  function validateSubmitForm(consultation: BookedConsultation | null) {
    if (!consultation) {
      toast.error("Choose a consultation slot before submitting");
      return false;
    }

    if (title.trim().length < 2) {
      toast.error("Add a proposal title before submitting");
      return false;
    }

    if (attendeeName.trim().length < 2) {
      toast.error("Enter your name before submitting");
      return false;
    }

    if (!isValidEmail(attendeeEmail.trim())) {
      toast.error("Enter a valid email address before submitting");
      return false;
    }

    if (bookingSetupError || eventTypes.length === 0) {
      toast.error(bookingSetupError ?? "No consultation event type is active");
      return false;
    }

    return true;
  }

  async function submitProposal(consultation: BookedConsultation | null) {
    if (pending) {
      return;
    }

    if (!consultation) {
      toast.error("Choose a consultation slot before submitting");
      return;
    }

    if (!validateSubmitForm(consultation)) {
      return;
    }

    setPending(true);

    try {
      const normalizedAttendeeEmail = attendeeEmail.trim().toLowerCase();
      const bookingNoteLines = [
        attendeeName.trim() !== currentUser.name
          ? `Preferred attendee name: ${attendeeName.trim()}`
          : null,
        normalizedAttendeeEmail !== currentUser.email.toLowerCase()
          ? `Preferred attendee email: ${normalizedAttendeeEmail}`
          : null,
        bookingNotes.trim()
          ? `Additional notes: ${bookingNotes.trim()}`
          : null,
        guestEmails.trim() ? `Guest emails: ${guestEmails.trim()}` : null,
      ].filter((value): value is string => Boolean(value));
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: title.trim(),
          notes: appendBookingNotesToProposalNotes(
            notes,
            bookingNoteLines.join("\n"),
          ),
          ...(consultation.id.startsWith("draft:")
            ? {
                bookingRequest: {
                  eventTypeId: consultation.eventTypeId,
                  startsAt: consultation.startsAt,
                  durationMinutes: Math.max(
                    5,
                    Math.round(
                      (new Date(consultation.endsAt).getTime() -
                        new Date(consultation.startsAt).getTime()) /
                        60_000,
                    ),
                  ),
                  attendeeTimezone:
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
              }
            : { bookingId: consultation.id }),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to submit proposal");
      }

      toast.success("Proposal submitted");
      router.push(`/dashboard/projects/${payload.projectId}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to submit proposal",
      );
    } finally {
      setPending(false);
    }
  }

  function clearSelectedSlot() {
    setBookedConsultation(null);
    setSelectedSlotStart(null);
    setPendingSlot(null);
    setSlotConfirmOpen(false);
  }

  function renderBookingSubmitForm({
    consultation,
    idPrefix,
    onBack,
    variant,
  }: {
    consultation: BookedConsultation | null;
    idPrefix: string;
    onBack: () => void;
    variant: "dialog" | "inline";
  }) {
    const schedule = getConsultationSchedule(consultation);

    return (
      <form
        className={cn(
          "space-y-4",
          variant === "inline" && "h-full",
        )}
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void submitProposal(consultation);
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
            onChange={(event) => setAttendeeName(event.target.value)}
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
            onChange={(event) => setAttendeeEmail(event.target.value)}
            aria-invalid={
              attendeeEmail.trim().length > 0 &&
              !isValidEmail(attendeeEmail.trim())
            }
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${idPrefix}-notes`}>
            Additional notes
          </FieldLabel>
          <Textarea
            id={`${idPrefix}-notes`}
            value={bookingNotes}
            onChange={(event) => setBookingNotes(event.target.value)}
            placeholder="Please share anything that will help prepare for our meeting."
            className="min-h-20"
          />
        </Field>

        <button
          type="button"
          onClick={() => setShowGuests((current) => !current)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <UserPlusIcon className="size-3.5" />
          Add guests
        </button>

        {showGuests ? (
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-guests`}>
              Guest emails
            </FieldLabel>
            <Input
              id={`${idPrefix}-guests`}
              type="text"
              value={guestEmails}
              onChange={(event) => setGuestEmails(event.target.value)}
              placeholder="guest@example.com, teammate@example.com"
            />
          </Field>
        ) : null}

        <p className="text-xs text-muted-foreground">
          By proceeding, your proposal and consultation request will be
          submitted together.
        </p>

        <div
          className={cn(
            "flex items-center justify-end gap-2",
            variant === "dialog" && "-mx-4 -mb-4 border-t bg-muted/40 p-4",
          )}
        >
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            type="submit"
            disabled={!canSubmitBase || !consultation || pending}
          >
            {pending ? "Submitting..." : "Confirm"}
          </Button>
        </div>
      </form>
    );
  }

  function renderMiniCalendar() {
    return (
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">{monthLabel}</p>
          <div className="flex items-center gap-1">
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

        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell) =>
            cell.date ? (
              <button
                key={cell.key}
                type="button"
                onClick={() => selectDate(cell.date!)}
                disabled={!cell.hasSlots}
                className={cn(
                  "relative h-10 rounded-md text-xs font-medium transition",
                  selectedDate === cell.date
                    ? "bg-primary text-primary-foreground"
                    : cell.hasSlots
                      ? "bg-muted/40 hover:bg-muted"
                      : "cursor-not-allowed text-muted-foreground/45",
                )}
              >
                {cell.label}
                {cell.date === getDateKeyInTimeZone(new Date(), timeZone) ? (
                  <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current" />
                ) : null}
              </button>
            ) : (
              <span key={cell.key} className="h-10" />
            ),
          )}
        </div>
      </div>
    );
  }

  function renderTimeFormatToggle() {
    return (
      <Toolbar className="p-0.5">
        <ToggleGroup
          aria-label="Time format"
          className="border-none p-0"
          onValueChange={(values) => {
            const nextFormat = values[0];

            if (nextFormat === "12h") {
              setUseTwentyFourHour(false);
            }

            if (nextFormat === "24h") {
              setUseTwentyFourHour(true);
            }
          }}
          value={[useTwentyFourHour ? "24h" : "12h"]}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Use 12-hour time"
                  render={<ToggleGroupItem value="12h" />}
                >
                  12h
                </ToolbarButton>
              }
              onClick={() => setUseTwentyFourHour(false)}
            />
            <TooltipPopup sideOffset={8}>Use 12-hour time</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Use 24-hour time"
                  render={
                    <ToggleGroupItem
                      aria-label="Use 24-hour time"
                      value="24h"
                    />
                  }
                >
                  24h
                </ToolbarButton>
              }
              onClick={() => setUseTwentyFourHour(true)}
            />
            <TooltipPopup sideOffset={8}>Use 24-hour time</TooltipPopup>
          </Tooltip>
        </ToggleGroup>
      </Toolbar>
    );
  }

  function switchBookingView(nextView: BookingView) {
    if (nextView === bookingView) {
      return;
    }

    previousBookingViewRef.current = bookingView;
    setBookingView(nextView);
  }

  function renderBookingViewToggle() {
    return (
      <Toolbar className="p-0.5">
        <ToggleGroup
          aria-label="Booking view"
          className="border-none shadow-none p-0"
          onValueChange={(values) => {
            const nextView = values[0];

            if (
              nextView === "day" ||
              nextView === "timeline" ||
              nextView === "list"
            ) {
              switchBookingView(nextView);
            }
          }}
          value={[bookingView]}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Monthly view"
                  render={<ToggleGroupItem value="day" />}
                >
                  <Calendar />
                </ToolbarButton>
              }
              onClick={() => switchBookingView("day")}
            />
            <TooltipPopup sideOffset={8}>Switch to Monthly view</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Weekly view"
                  render={
                    <ToggleGroupItem
                      aria-label="Weekly view"
                      value="timeline"
                    />
                  }
                >
                  <Grid3x3 />
                </ToolbarButton>
              }
              onClick={() => switchBookingView("timeline")}
            />
            <TooltipPopup sideOffset={8}>Switch to Weekly view</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Column view"
                  render={
                    <ToggleGroupItem
                      aria-label="Column view"
                      value="list"
                    />
                  }
                >
                  <Columns3 />
                </ToolbarButton>
              }
              onClick={() => switchBookingView("list")}
            />
            <TooltipPopup sideOffset={8}>Switch to Column view</TooltipPopup>
          </Tooltip>
        </ToggleGroup>
      </Toolbar>
    );
  }

  function renderBookingControls({
    showSettings = false,
    showTimeFormat = true,
  }: {
    showSettings?: boolean;
    showTimeFormat?: boolean;
  } = {}) {
    return (
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Switch
            size="sm"
            checked={overlayCalendar}
            onCheckedChange={setOverlayCalendar}
          />
          Overlay my calendar
        </label>

        {showSettings ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Calendar settings"
                >
                  <Settings2Icon className="size-4" />
                </Button>
              }
            />
            <TooltipPopup sideOffset={8}>Calendar settings</TooltipPopup>
          </Tooltip>
        ) : null}
        {showTimeFormat ? renderTimeFormatToggle() : null}
        {renderBookingViewToggle()}
      </div>
    );
  }

  function renderBookingDetails({
    className,
    showBackButton = true,
    showLocation = true,
    showMiniCalendar = false,
    showPageDescription = false,
  }: {
    className?: string;
    showBackButton?: boolean;
    showLocation?: boolean;
    showMiniCalendar?: boolean;
    showPageDescription?: boolean;
  }) {
    const schedule = getConsultationSchedule(bookedConsultation);
    const locationLabel =
      bookedConsultation?.locationLabel ??
      selectedEventType?.locationLabel ??
      "Cal Video";

    return (
      <aside className={cn(className)}>
        <ScrollArea className="max-h-full" scrollbarGutter scrollFade hideScrollbars>
          <div className="space-y-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Host</p>
                  <p className="text-sm font-semibold">
                    {bookingSetup?.admin.name ?? "Admin"}
                  </p>
                </div>
                {showBackButton ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep("proposal")}
                  >
                    Back
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 text-2xl font-semibold leading-tight">
                {selectedEventType?.title ?? "Consultation"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <p className="inline-flex items-center gap-1.5">
                <Clock3Icon className="h-3.5 w-3.5" />
                {selectedDurationMinutes}m
              </p>
              <p className="inline-flex items-center gap-1.5">
                <GlobeIcon className="h-3.5 w-3.5" />
                {timeZone}
              </p>
            </div>

            {schedule ? (
              <p className="inline-flex items-start gap-2 text-sm font-medium">
                <CalendarClockIcon className="mt-0.5 size-4 text-muted-foreground" />
                <span>
                  {schedule.dateLabel}
                  <br />
                  {schedule.timeLabel}
                </span>
              </p>
            ) : null}

            {showLocation && locationLabel ? (
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <VideoIcon className="size-4" />
                {locationLabel}
              </p>
            ) : null}

            {showPageDescription && bookingSetup?.admin.bookingPageTitle ? (
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

            {showMiniCalendar ? renderMiniCalendar() : null}
          </div>
        </ScrollArea>
      </aside>
    );
  }

  function renderMonthlyCalendar() {
    return (
      <div className="min-w-0 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">{monthLabel}</p>
          <div className="flex items-center gap-1">
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

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell) =>
            cell.date ? (
              <button
                key={cell.key}
                type="button"
                onClick={() => selectDate(cell.date!)}
                disabled={!cell.hasSlots}
                className={cn(
                  "relative aspect-square min-h-12 rounded-md border text-sm font-semibold transition-colors duration-200",
                  selectedDate === cell.date
                    ? cell.isCurrentMonth
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-foreground bg-foreground text-background"
                    : cell.hasSlots
                      ? "border-border/30 bg-muted/45 hover:border-primary/60 hover:bg-muted/60"
                      : "cursor-not-allowed border-transparent bg-transparent text-muted-foreground/45",
                )}
              >
                {!cell.isCurrentMonth && cell.label === 1 ? (
                  <span className="absolute left-1 top-1 text-[10px] font-semibold uppercase text-muted-foreground">
                    {new Intl.DateTimeFormat(undefined, {
                      month: "short",
                      timeZone,
                    }).format(parseDateKey(cell.date))}
                  </span>
                ) : null}
                {cell.label}
                {cell.date === getDateKeyInTimeZone(new Date(), timeZone) ? (
                  <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current" />
                ) : null}
              </button>
            ) : (
              <span key={cell.key} className="aspect-square min-h-12" />
            ),
          )}
        </div>
      </div>
    );
  }

  function renderMonthlyBookingPanel() {
    if (bookedConsultation) {
      return (
        <div className="h-full p-6">
          {renderBookingSubmitForm({
            consultation: bookedConsultation,
            idPrefix: "proposal-inline-booking",
            onBack: clearSelectedSlot,
            variant: "inline",
          })}
        </div>
      );
    }

    return (
      <div className="h-full p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">
            {activeDay?.label ?? "Select date"}
          </p>
          {renderTimeFormatToggle()}
        </div>

        <ScrollArea className="max-h-[390px] pr-0.5" scrollbarGutter scrollFade hideScrollbars>
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

  function renderMonthlyBookingContent() {
    const isSlotSelected = Boolean(bookedConsultation);

    return (
      <div
        className={cn(
          "grid grid-cols-1 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid-cols-[260px_minmax(0,1fr)_260px]",
          isSlotSelected && "lg:grid-cols-[318px_minmax(0,1fr)]",
        )}
      >
        {renderBookingDetails({
          className: "min-h-[420px] border-b border-border/60 p-6 lg:border-b-0 lg:border-r",
          showBackButton: false,
          showLocation: true,
        })}

        {isSlotSelected ? (
          <div className="min-h-[420px] min-w-0">
            {renderMonthlyBookingPanel()}
          </div>
        ) : (
          <>
            <div className="min-h-[420px] min-w-0 p-6">
              {renderMonthlyCalendar()}
            </div>

            <div className="min-h-[420px] min-w-0 border-t border-border/60 lg:border-l lg:border-t-0">
              {renderMonthlyBookingPanel()}
            </div>
          </>
        )}
      </div>
    );
  }

  function formatWeeklyDayHeader(date: string) {
    const value = parseDateKey(date);
    const weekday = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
    })
      .format(value)
      .toUpperCase();
    const day = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
    }).format(value);

    if (value.getDate() !== 1) {
      return `${weekday} ${day}`;
    }

    const month = new Intl.DateTimeFormat(undefined, {
      month: "short",
    })
      .format(value)
      .toUpperCase();

    return `${weekday} ${day}, ${month}`;
  }

  function renderWeeklyTimeGrid() {
    const dayCount = Math.max(timelineDays.length, 1);
    const bodyHeight = HOUR_VALUES.length * WEEKLY_HOUR_ROW_HEIGHT;
    const gridColumns = `64px repeat(${dayCount}, minmax(168px, 1fr))`;
    const dayColumns = `repeat(${dayCount}, minmax(168px, 1fr))`;

    if (timelineDays.length === 0) {
      return (
        <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
          No upcoming slots available.
        </div>
      );
    }

    return (
      <div
        className="relative min-w-[1120px]"
        style={{ height: WEEKLY_DAY_HEADER_HEIGHT + bodyHeight }}
      >
        {currentTimeIndicator ? (
          <div
            className="pointer-events-none absolute left-0 right-0 z-30 flex items-center"
            style={{ top: currentTimeIndicator.top }}
          >
            <span className="w-16 pr-2 text-right text-[11px] font-medium text-foreground">
              {currentTimeIndicator.label.replace(/\s/g, "").toLowerCase()}
            </span>
            <span className="h-px flex-1 bg-foreground" />
          </div>
        ) : null}

        <div
          className="grid"
          style={{
            gridTemplateColumns: gridColumns,
          }}
        >
          <div
            className="sticky left-0 top-0 z-30 border-b border-r border-border/70 bg-card/95"
            style={{ height: WEEKLY_DAY_HEADER_HEIGHT }}
          />

          {timelineDays.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => selectDate(day.date)}
              className={cn(
                "sticky top-0 z-20 border-b border-r border-border/70 bg-card/95 px-2 text-center text-xs font-semibold text-muted-foreground transition-colors",
                selectedDate === day.date && "text-foreground",
              )}
              style={{ height: WEEKLY_DAY_HEADER_HEIGHT }}
            >
              {formatWeeklyDayHeader(day.date)}
            </button>
          ))}

          {HOUR_VALUES.map((hour) => (
            <Fragment key={`weekly-hour-${hour}`}>
              <div
                className="sticky left-0 z-10 border-b border-r border-border/60 bg-card/95 px-2 pt-3 text-right text-[11px] text-muted-foreground"
                style={{ height: WEEKLY_HOUR_ROW_HEIGHT }}
              >
                {formatHourLabel(hour, useTwentyFourHour)
                  .replace(/\s/g, "")
                  .toLowerCase()}
              </div>

              {timelineDays.map((day) => {
                const hasSlotAtHour = day.slots.some(
                  (slot) => getHourInTimeZone(slot.startsAt, timeZone) === hour,
                );

                return (
                  <div
                    key={`${day.date}-${hour}`}
                    className={cn(
                      "border-b border-r border-border/55 transition-colors",
                      hasSlotAtHour
                        ? "bg-background/75"
                        : overlayCalendar
                          ? "bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.02),rgba(255,255,255,0.02)_5px,rgba(148,163,184,0.13)_5px,rgba(148,163,184,0.13)_10px)]"
                          : "bg-muted/15",
                    )}
                    style={{ height: WEEKLY_HOUR_ROW_HEIGHT }}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>

        <div
          className="pointer-events-none absolute bottom-0 left-16 right-0 grid"
          style={{
            gridTemplateColumns: dayColumns,
            top: WEEKLY_DAY_HEADER_HEIGHT,
          }}
        >
          {timelineDays.map((day) => (
            <div
              key={`weekly-slots-${day.date}`}
              className="relative min-w-0"
              style={{ height: bodyHeight }}
            >
              {day.slots.map((slot) => {
                const start = new Date(slot.startsAt);
                const end = new Date(slot.endsAt);
                const startMinute = getMinuteOfDayInTimeZone(start, timeZone);
                const durationMinutes = Math.max(
                  5,
                  Math.round((end.getTime() - start.getTime()) / 60_000),
                );
                const isSelected =
                  selectedDate === day.date && selectedSlotStart === slot.startsAt;

                return (
                  <button
                    key={slot.startsAt}
                    type="button"
                    aria-label={`Select ${formatSlotTime(slot.startsAt)}`}
                    onClick={() => selectSlot(day.date, slot)}
                    className={cn(
                      "pointer-events-auto absolute left-2 right-2 z-20 flex items-center overflow-hidden rounded-sm px-1.5 text-left text-[11px] font-semibold leading-none transition-all duration-200",
                      isSelected
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-transparent text-transparent hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background focus-visible:outline-none",
                    )}
                    style={{
                      top:
                        (startMinute / 60) * WEEKLY_HOUR_ROW_HEIGHT +
                        (isSelected ? 0 : 2),
                      height: Math.max(
                        14,
                        (durationMinutes / 60) * WEEKLY_HOUR_ROW_HEIGHT - 4,
                      ),
                    }}
                  >
                    {formatSlotTime(slot.startsAt)
                      .replace(/\s/g, "")
                      .toLowerCase()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderColumnBookingView() {
    const columnDays = timelineDays.filter((day) => day.slots.length > 0);
    const visibleColumnDays =
      columnDays.length > 0 ? columnDays : timelineDays;

    return (
      <div className="min-h-full">
        {visibleColumnDays.length > 0 ? (
          <div
            className="grid min-w-[1120px] gap-4 p-6"
            style={{
              gridTemplateColumns: `repeat(${visibleColumnDays.length}, minmax(180px, 1fr))`,
            }}
          >
            {visibleColumnDays.map((day) => (
              <div key={day.date} className="min-w-0 space-y-3">
                <button
                  type="button"
                  onClick={() => selectDate(day.date)}
                  className={cn(
                    "h-8 w-full rounded-md px-2 text-center text-xs font-semibold uppercase text-muted-foreground transition-colors hover:text-foreground",
                    selectedDate === day.date && "text-foreground",
                  )}
                >
                  {formatWeeklyDayHeader(day.date)}
                </button>

                <div className="space-y-2">
                  {day.slots.length > 0 ? (
                    day.slots.map((slot) => (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => selectSlot(day.date, slot)}
                        className={cn(
                          "flex h-9 w-full items-center justify-center gap-3 rounded-md border px-3 text-sm font-semibold transition-colors",
                          selectedSlotStart === slot.startsAt
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/70 bg-background/70 hover:border-primary/60 hover:bg-background",
                        )}
                      >
                        <span className="size-2 rounded-full bg-emerald-400" />
                        <span>
                          {formatSlotTime(slot.startsAt)
                            .replace(/\s/g, "")
                            .toLowerCase()}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-md border border-dashed border-border/50 px-3 py-2 text-center text-xs text-muted-foreground">
                      Unavailable
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            No upcoming slots available.
          </p>
        )}
      </div>
    );
  }

  function renderCalendarBookingView() {
    const isColumnView = bookingView === "list";
    const enteredFromMonthly = previousBookingViewRef.current === "day";

    return (
      <>
        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)]">
          {renderBookingDetails({
            className:
              "max-h-full border-b border-border/60 p-5 lg:border-b-0 lg:border-r",
            showBackButton: false,
            showLocation: true,
            showMiniCalendar: true,
          })}

          <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold">{timelineRangeLabel}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => shiftTimelineRange(-7)}
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => shiftTimelineRange(7)}
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectToday}
                >
                  Today
                </Button>
              </div>

              {renderBookingControls({ showSettings: true })}
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              <AnimatePresence initial={false}>
                <motion.div
                  key={bookingView}
                  className="absolute inset-0 overflow-auto overscroll-contain"
                  initial={{
                    opacity: 0,
                    x: enteredFromMonthly ? 180 : isColumnView ? 96 : -72,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: isColumnView ? 96 : -96,
                  }}
                  transition={{
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ willChange: "transform, opacity" }}
                >
                  {isColumnView ? renderColumnBookingView() : renderWeeklyTimeGrid()}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>
      </>
    );
  }

  function renderBookingFrameView() {
    const isMonthly = bookingView === "day";
    const isSlotSelected = Boolean(bookedConsultation);

    return (
      <div className="relative flex min-h-[calc(100vh-49px)] flex-col">
        {isMonthly ? (
          <div className="absolute right-1 top-1 z-10 flex flex-wrap items-center justify-end gap-3">
            {renderBookingControls({ showTimeFormat: false })}
          </div>
        ) : null}

        <div
          className={cn(
            "flex flex-1",
            isMonthly
              ? "items-center justify-center px-2 py-16 md:py-20"
              : "items-stretch",
          )}
        >
          <div
            className={cn(
              "w-full transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isMonthly
                ? isSlotSelected
                  ? "max-w-[710px]"
                  : "max-w-[974px]"
                : "h-[calc(100vh-49px)] max-w-none",
            )}
          >
            <motion.div
              layout="position"
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ willChange: "transform" }}
              className={cn(
                "booking-mode-motion transform-gpu overflow-hidden bg-card/70",
                !isMonthly && "h-full",
              )}
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={isMonthly ? "monthly" : "calendar"}
                  className={cn(!isMonthly && "h-full")}
                  initial={{ opacity: 0, x: isMonthly ? -40 : 96 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isMonthly ? -40 : 96 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ willChange: "transform, opacity" }}
                >
                  {isMonthly
                    ? renderMonthlyBookingContent()
                    : renderCalendarBookingView()}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {isMonthly ? (
              <Button
                type="button"
                variant="link"
                className="mx-auto mt-5 flex text-base font-semibold text-muted-foreground"
                onClick={() => setStep("proposal")}
              >
                Back
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const pendingConsultation = pendingSlot
    ? buildDraftConsultation(pendingSlot.slot)
    : null;

  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col gap-6",
        step === "proposal"
          ? "mx-auto max-w-5xl p-4 md:p-6"
          : bookingView === "day" ||
              bookingView === "timeline" ||
              bookingView === "list"
            ? "max-w-none"
            : "max-w-none",
      )}
    >
      <TooltipProvider>
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            .booking-mode-motion {
              transform: none !important;
              filter: none !important;
            }
          }
        `}</style>
        {step === "proposal" ? (
          <div className="flex items-center justify-end gap-2">
            <Button onClick={goToConsultationStep} disabled={!canContinue}>
              <Sparkle className="h-4 w-4 rounded-full bg-white fill-primary text-white" />
              Next
            </Button>
          </div>
        ) : null}

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
          <LayoutGroup id="proposal-booking-mode">
            <div className="w-full overflow-hidden">
              {bookingSetupError ? (
                <div className="p-4 md:p-5">
                  <p className="text-sm text-destructive">
                    {bookingSetupError}
                  </p>
                </div>
              ) : eventTypes.length === 0 ? (
                <div className="p-4 md:p-5">
                  <p className="text-sm text-muted-foreground">
                    No consultation event type is active yet. Ask the admin to
                    configure and activate at least one public booking event
                    type.
                  </p>
                </div>
              ) : (
                renderBookingFrameView()
              )}
            </div>
          </LayoutGroup>
        )}

        <Dialog
          open={slotConfirmOpen}
          onOpenChange={handleSlotDialogOpenChange}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Confirm your details</DialogTitle>
              <DialogDescription>
                {proposalLabel}
              </DialogDescription>
            </DialogHeader>

            {pendingConsultation ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
                  <CalendarClockIcon className="size-3.5" />
                  {getConsultationSchedule(pendingConsultation)?.dateLabel},{" "}
                  {getConsultationSchedule(pendingConsultation)?.timeLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
                  <Clock3Icon className="size-3.5" />
                  {selectedDurationMinutes}m
                </span>
              </div>
            ) : null}

            {renderBookingSubmitForm({
              consultation: pendingConsultation,
              idPrefix: "proposal-dialog-booking",
              onBack: () => handleSlotDialogOpenChange(false),
              variant: "dialog",
            })}
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  );
}
