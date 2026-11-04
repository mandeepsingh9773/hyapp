const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function minutesAgo(minutes: number, from: number = Date.now()): string {
  return new Date(from - minutes * MINUTE).toISOString();
}

export function hoursAgo(hours: number, from: number = Date.now()): string {
  return new Date(from - hours * HOUR).toISOString();
}

export function daysAgo(days: number, from: number = Date.now()): string {
  return new Date(from - days * DAY).toISOString();
}
