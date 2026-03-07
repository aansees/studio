"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  type CalendarEvent,
  EventCalendar,
} from "@/components/layout/sheduling";

type SerializableCalendarEvent = Omit<CalendarEvent, "start" | "end"> & {
  start: string;
  end: string;
};

export function ProjectTaskCalendar({
  projectId,
  events,
}: {
  projectId: string;
  events: SerializableCalendarEvent[];
}) {
  const router = useRouter();

  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      events.map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      })),
    [events],
  );

  return (
    <EventCalendar
      allowCreate={false}
      events={calendarEvents}
      initialView="month"
      onEventSelectReadOnly={(event) => router.push(`/projects/${projectId}/tasks/${event.id}`)}
    />
  );
}
