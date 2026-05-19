"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateKeyInTimeZone } from "@/app/(app)/(auth)/dashboard/projects/new/_components/helpers";

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type CalendarCell = {
  key: string;
  date: string | null;
  label: number | null;
  hasSlots: boolean;
  isCurrentMonth: boolean;
};

export default function MiniCalendar({
  monthLabel,
  shiftVisibleMonth,
  calendarCells,
  selectDate,
  selectedDate,
  timeZone,
}: {
  monthLabel: string;
  shiftVisibleMonth: (delta: number) => void;
  calendarCells: CalendarCell[];
  selectDate: (date: string) => void;
  selectedDate: string | null;
  timeZone: string;
}) {
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
