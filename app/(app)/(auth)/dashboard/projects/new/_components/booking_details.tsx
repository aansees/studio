"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock3Icon, GlobeIcon, CalendarClockIcon, VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBookingTimeZoneLabel } from "@/lib/bookings/format";
import MiniCalendar from "@/app/(app)/(auth)/dashboard/projects/new/_components/mini_calendar";

type BookableEventType = {
  title: string;
  locationLabel: string | null;
};

type BookingSetup = {
  admin: {
    name: string;
    bookingPageTitle: string | null;
    bookingPageDescription: string | null;
  };
};

type BookedConsultation = {
  startsAt: string;
  endsAt: string;
  timezone: string;
  locationLabel: string | null;
};

type CalendarCell = {
  key: string;
  date: string | null;
  label: number | null;
  hasSlots: boolean;
  isCurrentMonth: boolean;
};

type BookingDetailsProps = {
  className?: string;
  showBackButton?: boolean;
  showLocation?: boolean;
  showMiniCalendar?: boolean;
  showPageDescription?: boolean;
  bookedConsultation: BookedConsultation | null;
  selectedEventType: BookableEventType | null;
  selectedDurationMinutes: number;
  timeZone: string;
  bookingSetup: BookingSetup | null;
  onBack: () => void;
  monthLabel: string;
  shiftVisibleMonth: (delta: number) => void;
  calendarCells: CalendarCell[];
  selectDate: (date: string) => void;
  selectedDate: string | null;
  useTwentyFourHour: boolean;
};

function getConsultationSchedule(
  consultation: BookedConsultation | null,
  useTwentyFourHour: boolean,
) {
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

  const timeLabel = `${timeFormatter.format(start)} — ${timeFormatter.format(end)}`;
  return { dateLabel, timeLabel };
}

export default function BookingDetails({
  className,
  showBackButton = true,
  showLocation = true,
  showMiniCalendar = false,
  showPageDescription = false,
  bookedConsultation,
  selectedEventType,
  selectedDurationMinutes,
  timeZone,
  bookingSetup,
  onBack,
  monthLabel,
  shiftVisibleMonth,
  calendarCells,
  selectDate,
  selectedDate,
  useTwentyFourHour,
}: BookingDetailsProps) {
  const schedule = React.useMemo(() => getConsultationSchedule(bookedConsultation, useTwentyFourHour), [bookedConsultation, useTwentyFourHour]);
  const timeZoneLabel = React.useMemo(
    () =>
      formatBookingTimeZoneLabel(timeZone, {
        hour12: !useTwentyFourHour,
      }),
    [timeZone, useTwentyFourHour],
  );
  const locationLabel = bookedConsultation?.locationLabel ?? selectedEventType?.locationLabel ?? "Cal Video";

  return (
    <aside className={cn(className)}>
      <ScrollArea className="max-h-full" scrollbarGutter scrollFade hideScrollbars>
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Host</p>
                <p className="text-sm font-semibold">{bookingSetup?.admin.name ?? "Admin"}</p>
              </div>
              {showBackButton ? (
                <Button type="button" variant="outline" size="sm" onClick={onBack}>
                  Back
                </Button>
              ) : null}
            </div>
            <p className="mt-3 text-2xl font-semibold leading-tight">{selectedEventType?.title ?? "Consultation"}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-1.5">
              <Clock3Icon className="h-3.5 w-3.5" />
              {selectedDurationMinutes}m
            </p>
            <p className="inline-flex items-center gap-1.5">
              <GlobeIcon className="h-3.5 w-3.5" />
              {timeZoneLabel}
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
              <p className="font-medium">{bookingSetup.admin.bookingPageTitle}</p>
              {bookingSetup.admin.bookingPageDescription ? (
                <p className="mt-1 text-muted-foreground">{bookingSetup.admin.bookingPageDescription}</p>
              ) : null}
            </div>
          ) : null}

          {showMiniCalendar ? (
            <MiniCalendar
              monthLabel={monthLabel}
              shiftVisibleMonth={shiftVisibleMonth}
              calendarCells={calendarCells}
              selectDate={selectDate}
              selectedDate={selectedDate}
              timeZone={timeZone}
            />
          ) : null}
        </div>
      </ScrollArea>
    </aside>
  );
}
