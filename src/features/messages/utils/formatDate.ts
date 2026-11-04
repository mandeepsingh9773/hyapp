const DAY_MS = 24 * 60 * 60 * 1000;

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "short",
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatMessageTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDateSeparator(dateKey: string, now: Date = new Date()): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - date.getTime()) / DAY_MS,
  );

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff > 1 && dayDiff < 7) return weekdayFormatter.format(date);
  return dateFormatter.format(date);
}
