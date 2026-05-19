"use client";

import React, { Fragment, type FC } from "react";
import { cn } from "@/lib/utils";
import {
  parseDateKey,
  getHourInTimeZone,
  getMinuteOfDayInTimeZone,
  formatHourLabel,
} from "./helpers";

type Slot = { startsAt: string; endsAt: string };
type Day = { date: string; slots: Slot[] };

type CurrentTimeIndicator = { top: number; label: string } | null;

type Props = {
  timelineDays: Day[];
  HOUR_VALUES: number[];
  WEEKLY_DAY_HEADER_HEIGHT: number;
  WEEKLY_HOUR_ROW_HEIGHT: number;
  currentTimeIndicator: CurrentTimeIndicator;
  formatWeeklyDayHeader?: (date: string) => string;
  selectedDate?: string | null;
  selectedSlotStart?: string | null;
  selectDate: (date: string) => void;
  selectSlot: (date: string, slot: Slot) => void;
  formatSlotTime: (s: string) => string;
  useTwentyFourHour: boolean;
  timeZone?: string;
  overlayCalendar?: boolean;
};

const WeeklyTimeGrid: FC<Props> = ({
  timelineDays,
  HOUR_VALUES,
  WEEKLY_DAY_HEADER_HEIGHT,
  WEEKLY_HOUR_ROW_HEIGHT,
  currentTimeIndicator,
  formatWeeklyDayHeader: propsFormatWeeklyDayHeader,
  selectedDate,
  selectedSlotStart,
  selectDate,
  selectSlot,
  formatSlotTime,
  useTwentyFourHour,
  timeZone,
  overlayCalendar,
}) => {
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

  function formatWeeklyDayHeader(date: string) {
    if (typeof propsFormatWeeklyDayHeader === "function") return propsFormatWeeklyDayHeader(date);
    const value = parseDateKey(date);
    const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" })
      .format(value)
      .toUpperCase();
    const day = new Intl.DateTimeFormat(undefined, { day: "2-digit" }).format(value);

    if (value.getDate() !== 1) return `${weekday} ${day}`;

    const month = new Intl.DateTimeFormat(undefined, { month: "short" })
      .format(value)
      .toUpperCase();

    return `${weekday} ${day}, ${month}`;
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
              {formatHourLabel(hour, useTwentyFourHour).replace(/\s/g, "").toLowerCase()}
            </div>

            {timelineDays.map((day) => {
              const hasSlotAtHour = day.slots.some(
                (slot) => getHourInTimeZone(slot.startsAt, timeZone!) === hour,
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
              const startMinute = getMinuteOfDayInTimeZone(start, timeZone!);
              const durationMinutes = Math.max(
                5,
                Math.round((end.getTime() - start.getTime()) / 60_000),
              );
              const isSelected = selectedDate === day.date && selectedSlotStart === slot.startsAt;

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
                    top: (startMinute / 60) * WEEKLY_HOUR_ROW_HEIGHT + (isSelected ? 0 : 2),
                    height: Math.max(14, (durationMinutes / 60) * WEEKLY_HOUR_ROW_HEIGHT - 4),
                  }}
                >
                  {formatSlotTime(slot.startsAt).replace(/\s/g, "").toLowerCase()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyTimeGrid;
