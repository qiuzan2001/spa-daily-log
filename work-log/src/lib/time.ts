/**
 * Time utility functions for NextBar
 */

/**
 * Format a Date object to "hh:mm AM/PM" string
 */
export function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minStr = minutes.toString().padStart(2, "0");
  return `${hours}:${minStr} ${ampm}`;
}

/**
 * Parse "hh:mm AM/PM" string to Date object (using today's date)
 */
export function parseTimeToDate(timeStr: string): Date {
  const now = new Date();
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return now;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  return d;
}

/**
 * Parse "hh:mm AM/PM" to total minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const d = parseTimeToDate(timeStr);
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Add minutes to a time string and return new time string
 */
export function addMinutes(timeStr: string, minutes: number): string {
  const d = parseTimeToDate(timeStr);
  d.setMinutes(d.getMinutes() + minutes);
  return formatTime(d);
}

/**
 * Calculate duration in minutes between two time strings
 */
export function durationMinutes(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

/**
 * Get current time string
 */
export function getCurrentTimeString(): string {
  return formatTime(new Date());
}

/**
 * Get today's date string "YYYY-MM-DD"
 */
export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}