import type { WidgetDataItem } from "../../types/dashboard";

export function number(value?: string): number | null {
  const match = value?.replaceAll(",", "").match(/^\s*(-?\d+(?:\.\d+)?)/);
  return match && Number.isFinite(Number(match[1])) ? Number(match[1]) : null;
}

export function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function find(items: WidgetDataItem[], label: string) {
  return items.find((item) => item.label === label)?.value ?? "Unavailable";
}
