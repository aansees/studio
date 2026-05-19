"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

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
import ProjectTaskTimelineView from "@/app/(app)/(auth)/dashboard/projects/[projectId]/_components/project_task_timeline";

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

  return <ProjectTaskTimelineView rows={rows} currentWeekStart={currentWeekStart} />;
}
