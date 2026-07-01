export const businessTimeZone = 'America/Sao_Paulo';

export type DateInputParts = {
  year: number;
  month: number;
  day: number;
};

const timeZoneFormatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string) {
  const existing = timeZoneFormatters.get(timeZone);

  if (existing) {
    return existing;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  timeZoneFormatters.set(timeZone, formatter);
  return formatter;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getFormatter(timeZone).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUtc - date.getTime();
}

export function parseDateInputParts(date: string): DateInputParts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const [year, month, day] = date.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function parseTimeToMinutes(time: string) {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return Number.NaN;
  }

  const [hours, minutes] = time.split(':').map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return Number.NaN;
  }

  return hours * 60 + minutes;
}

export function getDateInputValueInTimeZone(date = new Date(), timeZone = businessTimeZone) {
  const parts = getFormatter(timeZone).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addDaysToDateInput(date: string, days: number) {
  const parts = parseDateInputParts(date);

  if (!parts) {
    return date;
  }

  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

export function getUtcDateOnlyFromInput(date: string) {
  const parts = parseDateInputParts(date);

  if (!parts) {
    return null;
  }

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0));
}

export function getUtcDateRangeFromInput(date: string) {
  const startDate = getUtcDateOnlyFromInput(date);

  if (!startDate) {
    return null;
  }

  return {
    dateObj: startDate,
    startDate,
    endDate: new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1),
  };
}

export function getDateInputFromStoredDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getZonedDateTimeFromInput(
  date: string,
  time: string,
  timeZone = businessTimeZone,
) {
  const parts = parseDateInputParts(date);
  const minutes = parseTimeToMinutes(time);

  if (!parts || Number.isNaN(minutes)) {
    return null;
  }

  const hours = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const localAsUtc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hours, minute, 0, 0));
  const firstOffset = getTimeZoneOffsetMs(localAsUtc, timeZone);
  const firstResult = new Date(localAsUtc.getTime() - firstOffset);
  const finalOffset = getTimeZoneOffsetMs(firstResult, timeZone);

  return new Date(localAsUtc.getTime() - finalOffset);
}

export function getHoursUntilZonedBooking(
  date: string,
  time: string,
  nowMs = Date.now(),
  timeZone = businessTimeZone,
) {
  const bookingDateTime = getZonedDateTimeFromInput(date, time, timeZone);

  if (!bookingDateTime) {
    return Number.NaN;
  }

  return (bookingDateTime.getTime() - nowMs) / (1000 * 60 * 60);
}
