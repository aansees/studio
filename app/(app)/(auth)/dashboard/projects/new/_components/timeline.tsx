"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type Slot = { startsAt: string; endsAt: string };
type Day = { date: string; label: string | null; slots: Slot[] };

export { default as WeeklyTimeGrid } from "./weekly_time_grid";

export function ColumnBookingView({
  timelineDays,
  selectDate,
  formatWeeklyDayHeader,
  selectedDate,
  selectedSlotStart,
  selectSlot,
  formatSlotTime,
}: {
  timelineDays: Day[];
  selectDate: (d: string) => void;
  formatWeeklyDayHeader: (d: string) => string;
  selectedDate: string | null;
  selectedSlotStart: string | null;
  selectSlot: (date: string, slot: Slot) => void;
  formatSlotTime: (iso: string) => string;
}) {
  const columnDays = timelineDays.filter((day) => day.slots.length > 0);
  const visibleColumnDays = columnDays.length > 0 ? columnDays : timelineDays;

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
        <p className="p-6 text-sm text-muted-foreground">No upcoming slots available.</p>
      )}
    </div>
  );
}

export function CalendarBookingView({
  renderBookingDetails,
  renderBookingControls,
  timelineRangeLabel,
  shiftTimelineRange,
  selectToday,
  isColumnView,
  renderColumnBookingView,
  renderWeeklyTimeGrid,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderBookingDetails: (opts?: any) => React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderBookingControls: (opts?: any) => React.ReactNode;
  timelineRangeLabel: string;
  shiftTimelineRange: (delta: number) => void;
  selectToday: () => void;
  isColumnView: boolean;
  renderColumnBookingView: () => React.ReactNode;
  renderWeeklyTimeGrid: () => React.ReactNode;
}) {
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
              <Button type="button" variant="outline" size="sm" onClick={selectToday}>
                Today
              </Button>
            </div>

            {renderBookingControls({ showSettings: true })}
          </div>

          <ScrollArea hideScrollbars className="relative min-h-0 flex-1">
            {/* Keep the same motion container behavior in the parent; render appropriate view here */}
            {isColumnView ? renderColumnBookingView() : renderWeeklyTimeGrid()}
          </ScrollArea>
        </section>
      </div>
    </>
  );
}
