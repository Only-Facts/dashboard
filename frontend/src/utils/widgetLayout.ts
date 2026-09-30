import type { Widget } from "../types/dashboard";

export type WidgetVisualSize = "sm" | "md" | "lg";

const LARGE_WIDGETS = new Set(["forecast", "commits", "latest", "game_news"]);
const SMALL_WIDGETS = new Set(["temperature", "rate", "aqi", "players"]);

export function widgetVisualSize(widget: Widget): WidgetVisualSize {
  if (LARGE_WIDGETS.has(widget.type)) return "lg";
  if (SMALL_WIDGETS.has(widget.type)) return "sm";
  return "md";
}
