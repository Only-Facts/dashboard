/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useState } from "react";
import { LuArrowUpRight, LuChartNoAxesCombined } from "react-icons/lu";
import { dashboardApi, type Widget, type WidgetData, type WidgetDataItem } from "../api/dashboardApi";

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

export type WidgetTone = "accent" | "cool" | "warm" | "violet" | "danger";
export interface ViewProps { widget: Widget; items: WidgetDataItem[]; history: WidgetData[]; }
export interface WidgetDragState { id: number; target: number | "trash"; x: number; y: number; startX: number; startY: number; moved: boolean; }

interface BarProps { value: number | null; max: number; tone?: WidgetTone; }
export function Bar({ value, max, tone = "accent" }: BarProps) {
  const width = value === null ? 0 : clamp((value / Math.max(max, 1)) * 100);
  return (
    <div className={`chart-track chart-track--${tone}`} aria-hidden="true">
      <i style={{ width: `${width}%` }} />
    </div>
  );
}

function DetailList({ items }: { items: WidgetDataItem[] }) {
  return (
    <dl className="detail-list">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <dt>{item.label}</dt>
          <dd><ItemLink item={item} /></dd>
        </div>
      ))}
    </dl>
  );
}

export function ItemLink({ item }: { item: WidgetDataItem }) {
  if (!item.url?.startsWith("https://")) return <span>{item.value}</span>;
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer">
      {item.value}
      <LuArrowUpRight aria-hidden="true" />
    </a>
  );
}

export function UnknownView({ items }: ViewProps) {
  return (
    <div className="unknown-view">
      <LuChartNoAxesCombined aria-hidden="true" />
      <DetailList items={items} />
    </div>
  );
}

interface WidgetDataState {
  data: WidgetData | null;
  history: WidgetData[];
  error: string;
  loading: boolean;
  refresh: () => void;
}

export function useWidgetData(widget: Widget): WidgetDataState {
  const key = widgetConfigKey(widget.id, widget.service, widget.type, widget.config);
  const [snapshot, setSnapshot] = useState<WidgetSnapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let disposed = false;
    let pending = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const schedule = () => {
      if (!disposed) {
        timer = setTimeout(() => void load(), widget.refreshSeconds * 1000);
      }
    };

    const load = async () => {
      if (disposed || pending) return;
      if (timer) clearTimeout(timer);
      if (document.hidden) return schedule();

      pending = true;
      setLoading(true);
      try {
        const result = widget.id < 0
          ? await dashboardApi.publicData(widget.service, widget.type, controller.signal, widget.config)
          : await dashboardApi.data(widget.id, controller.signal);
        if (!disposed) {
          setSnapshot((previous) => appendSnapshot(previous, key, result));
          setError("");
        }
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : "Unable to refresh this widget.");
        }
      } finally {
        pending = false;
        if (!disposed) {
          setLoading(false);
          schedule();
        }
      }
    };

    const onVisibilityChange = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", onVisibilityChange); void load();

    return () => {
      disposed = true;
      controller.abort();
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [widget, revision, key]);

  const current = snapshot?.key === key ? snapshot : null;
  return { data: current?.data ?? null, history: current?.history ?? [], error, loading, refresh };
}

interface WidgetSnapshot {
  key: string;
  data: WidgetData;
  history: WidgetData[];
}

function appendSnapshot(
  previous: WidgetSnapshot | null,
  key: string,
  next: WidgetData,
): WidgetSnapshot {
  const history = previous?.key === key ? previous.history : [];
  const unchanged = history.at(-1)?.updatedAt === next.updatedAt;
  return {
    key,
    data: next,
    history: unchanged ? history : [...history, next].slice(-24),
  };
}

function widgetConfigKey(
  id: number,
  service: string,
  type: string,
  config: Record<string, string>,
) {
  return JSON.stringify([id, service, type, config]);
}
