const PACIFIC_TIME_ZONE = "America/Los_Angeles";

type TimeZoneParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getTimeZoneParts(date: Date, timeZone: string): TimeZoneParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const entries = formatter.formatToParts(date).reduce<Record<string, string>>((accumulator, part) => {
    if (part.type !== "literal") {
      accumulator[part.type] = part.value;
    }
    return accumulator;
  }, {});

  return {
    year: Number(entries.year),
    month: Number(entries.month),
    day: Number(entries.day),
    hour: Number(entries.hour),
    minute: Number(entries.minute),
    second: Number(entries.second),
  };
}

function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string): number {
  const parts = getTimeZoneParts(date, timeZone);
  const utcTimestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return utcTimestamp - date.getTime();
}

function zonedDateTimeToDate(parts: TimeZoneParts, timeZone: string): Date {
  const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const firstOffset = getTimeZoneOffsetMilliseconds(new Date(utcGuess), timeZone);
  const firstCandidate = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMilliseconds(new Date(firstCandidate), timeZone);
  const finalCandidate = secondOffset === firstOffset ? firstCandidate : utcGuess - secondOffset;

  return new Date(finalCandidate);
}

export function getNextPacificMidnight(reference = new Date()): Date {
  const pacificNow = getTimeZoneParts(reference, PACIFIC_TIME_ZONE);
  const nextPacificDate = new Date(Date.UTC(pacificNow.year, pacificNow.month - 1, pacificNow.day + 1));

  return zonedDateTimeToDate(
    {
      year: nextPacificDate.getUTCFullYear(),
      month: nextPacificDate.getUTCMonth() + 1,
      day: nextPacificDate.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    },
    PACIFIC_TIME_ZONE
  );
}

export function formatDateTimeForLocale(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
