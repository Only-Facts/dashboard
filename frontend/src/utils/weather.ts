export function clockTime(text: string) {
  return text.match(/\d{2}:\d{2}$/)?.[0] ?? "—";
}

export function minutesFromTimestamp(text: string) {
  const match = text.match(/(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function daylightDuration(sunrise: string, sunset: string) {
  const start = minutesFromTimestamp(sunrise);
  const end = minutesFromTimestamp(sunset);
  if (start === null || end === null || end < start) return null;
  return end - start;
}
