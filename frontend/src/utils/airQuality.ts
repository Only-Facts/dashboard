export function qualityLabel(value: number | null) {
  if (value === null) return "Unavailable";
  if (value <= 20) return "Very good";
  if (value <= 40) return "Good";
  if (value <= 60) return "Moderate";
  if (value <= 80) return "Poor";
  return "Very poor";
}
