export function parseDateKey(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function formatDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const date = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

export function getDateKeyInTimeZone(value: Date, timeZone: string) {
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

export function getHourInTimeZone(value: string, timeZone: string) {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone,
  })
    .formatToParts(new Date(value))
    .find((part) => part.type === "hour")?.value;

  return Number.parseInt(hourPart ?? "0", 10);
}

export function getMinuteOfDayInTimeZone(value: Date, timeZone: string) {
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

export function formatHourLabel(hour: number, useTwentyFourHour: boolean) {
  if (useTwentyFourHour) {
    return `${String(hour).padStart(2, "0")}:00`;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;

  return `${normalized}:00 ${suffix}`;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function appendBookingNotesToProposalNotes(
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
