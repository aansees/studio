"use client";

import { type FC } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseDateKey, getDateKeyInTimeZone } from "./helpers";

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type CalendarCell = {
  key: string;
  date?: string | null;
  label?: number | null;
  hasSlots?: boolean;
  isCurrentMonth?: boolean;
};

type Props = {
  monthLabel: string;
  shiftVisibleMonth: (n: number) => void;
  calendarCells: CalendarCell[];
  selectDate: (date: string) => void;
  selectedDate?: string | null;
  timeZone?: string;
};

const MonthlyCalendar: FC<Props> = ({
  monthLabel,
  shiftVisibleMonth,
  calendarCells,
  selectDate,
  selectedDate,
  timeZone,
}) => {
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
                    timeZone: timeZone!,
                  }).format(parseDateKey(cell.date!))}
                </span>
              ) : null}
              {cell.label}
              {cell.date === getDateKeyInTimeZone(new Date(), timeZone!) ? (
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
};

export default MonthlyCalendar;
