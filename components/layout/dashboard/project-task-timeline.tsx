"use client";

import Link from "next/link";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  startOfDay,
} from "date-fns";
import { MoreHorizontalIcon } from "lucide-react";
import { useMemo } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectTaskRow } from "./project-tasks-workspace";

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function priorityTone(priority: string) {
  if (priority === "urgent" || priority === "high") {
    return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300";
  }
  if (priority === "low") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
}

function statusAccent(status: ProjectTaskRow["status"]) {
  if (status === "done") return "bg-emerald-400";
  if (status === "in_progress") return "bg-amber-400";
  if (status === "review") return "bg-violet-400";
  if (status === "blocked") return "bg-rose-400";
  return "bg-sky-400";
}

function formatTimelineDate(date: Date) {
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  return hasTime
    ? format(date, "MMM d, yyyy 'at' p")
    : format(date, "MMM d, yyyy");
}

export function ProjectTaskTimeline({
  rows,
  currentWeekStart,
}: {
  rows: ProjectTaskRow[];
  currentWeekStart: Date;
}) {
  const normalizedWeekStart = startOfDay(currentWeekStart);
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: normalizedWeekStart,
        end: endOfWeek(normalizedWeekStart, { weekStartsOn: 1 }),
      }),
    [normalizedWeekStart],
  );
  const weekEnd = startOfDay(days[days.length - 1]);
  const unscheduledRows = rows.filter((row) => !row.dueDate);
  const scheduledRows = rows.filter((row) => row.dueDate);

  const timelineCards = useMemo(() => {
    const laneEnds: number[] = [];

    return scheduledRows
      .map((row) => {
        const rawStart = startOfDay(new Date(row.startDate ?? row.dueDate!));
        const rawDueDate = startOfDay(new Date(row.dueDate!));
        const rawEnd =
          rawDueDate.getTime() < rawStart.getTime() ? rawStart : rawDueDate;

        if (
          rawEnd.getTime() < normalizedWeekStart.getTime() ||
          rawStart.getTime() > weekEnd.getTime()
        ) {
          return null;
        }

        const clampedStart =
          rawStart.getTime() < normalizedWeekStart.getTime()
            ? normalizedWeekStart
            : rawStart;
        const clampedEnd =
          rawEnd.getTime() > weekEnd.getTime() ? weekEnd : rawEnd;
        const startColumn = differenceInCalendarDays(
          clampedStart,
          normalizedWeekStart,
        );
        const spanDays = differenceInCalendarDays(clampedEnd, clampedStart) + 1;

        let lane = laneEnds.findIndex((lastColumn) => startColumn > lastColumn);
        if (lane === -1) {
          lane = laneEnds.length;
        }
        laneEnds[lane] = startColumn + spanDays - 1;

        return {
          row,
          lane,
          startColumn,
          spanDays,
          rawStart,
          rawEnd,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [normalizedWeekStart, scheduledRows, weekEnd]);

  const laneCount =
    timelineCards.length === 0
      ? 0
      : timelineCards.reduce(
          (maxLane, item) => Math.max(maxLane, item.lane),
          0,
        ) + 1;
  const boardHeight = Math.max(420, laneCount * 108 + 120);

  return (
    <div className="space-y-4 h-full">
      <div className="w-full overflow-x-auto h-full">
        <div className="min-w-[1040px] h-full">
          <div className="grid grid-cols-7 rounded-t-xl border border-b-0 bg-muted/30">
            {days.map((day) => (
              <div
                key={`head-${day.toISOString()}`}
                className={cn(
                  "relative border-r px-3 py-3 text-center text-sm last:border-r-0",
                  isToday(day) && "bg-muted/40",
                )}
              >
                {isToday(day) ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-rose-400" />
                ) : null}
                <div className="text-muted-foreground">
                  {format(day, "EEE").toUpperCase()}
                </div>
                <div className="font-medium">{format(day, "d")}</div>
              </div>
            ))}
          </div>

          <div
            className="relative overflow-hidden rounded-b-xl border h-[calc(100%-65px)]"
            style={{ minHeight: `${boardHeight}px` }}
          >
            <div className="absolute inset-0 grid grid-cols-7">
              {days.map((day) => (
                <div
                  key={`column-${day.toISOString()}`}
                  className={cn(
                    "relative border-r px-3 py-4 last:border-r-0",
                  )}
                >
                  {isToday(day) ? (
                    <>
                      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(248,113,113,0.06)_0px,rgba(248,113,113,0.06)_6px,transparent_6px,transparent_14px)]" />
                      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-rose-300/80" />
                      <div className="pointer-events-none absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-rose-400" />
                    </>
                  ) : null}
                </div>
              ))}
            </div>

            {timelineCards.length === 0 ? (
              <div className="absolute inset-x-0 top-10 z-10 text-center text-sm text-muted-foreground">
                No scheduled tasks for this week.
              </div>
            ) : null}

            {timelineCards.map((item) => (
              <Link
                key={item.row.id}
                href={`/projects/${item.row.projectId}/tasks/${item.row.id}`}
                className="absolute z-10"
                style={{
                  left: `calc((100% / 7) * ${item.startColumn} + 16px)`,
                  width: `calc((100% / 7) * ${item.spanDays} - 32px)`,
                  top: `${24 + item.lane * 104}px`,
                }}
              >
                <div className="space-y-2 rounded-lg border bg-background p-2 shadow-xs transition-colors hover:bg-muted/30">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 h-10 w-1 rounded-full",
                        statusAccent(item.row.status),
                      )}
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="line-clamp-2 font-medium">
                        {item.row.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimelineDate(item.rawStart)} -{" "}
                        {formatTimelineDate(item.rawEnd)}
                      </div>
                    </div>
                    <MoreHorizontalIcon className="mt-0.5 size-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-sm">
                        {item.row.type}
                      </Badge>
                      <Badge className={cn(priorityTone(item.row.priority), "rounded-sm")}>
                        {item.row.priority}
                      </Badge>
                    </div>
                    {item.row.people.length > 0 ? (
                      <AvatarGroup>
                        {item.row.people.slice(0, 3).map((person) => (
                          <Avatar key={person.id} size="sm">
                            {person.image ? (
                              <AvatarImage
                                src={person.image}
                                alt={person.name}
                              />
                            ) : null}
                            <AvatarFallback>
                              {getInitials(person.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {item.row.people.length > 3 ? (
                          <AvatarGroupCount>
                            +{item.row.people.length - 3}
                          </AvatarGroupCount>
                        ) : null}
                      </AvatarGroup>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {unscheduledRows.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Unscheduled</div>
          <div className="grid gap-2 md:grid-cols-2">
            {unscheduledRows.map((row) => (
              <Link
                key={row.id}
                href={`/projects/${row.projectId}/tasks/${row.id}`}
                className="rounded-xl border p-3 text-sm transition-colors hover:bg-muted/30"
              >
                <div className="font-medium">{row.title}</div>
                <div className="mt-1 text-muted-foreground">
                  {row.description || "-"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
