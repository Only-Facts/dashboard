import type { WidgetData } from "../types/dashboard";

export interface WidgetSnapshot {
  key: string;
  data: WidgetData;
  history: WidgetData[];
}

export function appendSnapshot(previous: WidgetSnapshot | null, key: string, next: WidgetData): WidgetSnapshot {
  const history = previous?.key === key ? previous.history : [];
  const unchanged = history.at(-1)?.updatedAt === next.updatedAt;
  const samples = unchanged ? history : [...history, next].slice(-24);
  return { key, data: next, history: samples };
}

export function widgetConfigKey(id: number, service: string, type: string, config: Record<string, string>) {
  return JSON.stringify([id, service, type, config]);
}
