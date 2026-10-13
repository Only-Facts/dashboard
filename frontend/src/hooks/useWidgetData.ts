import { useCallback, useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboardApi";
import type { Widget, WidgetData } from "../types/dashboard";
import { appendSnapshot, widgetConfigKey, type WidgetSnapshot } from "../utils/widgetData";

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
      if (!disposed) timer = setTimeout(() => void load(), widget.refreshSeconds * 1000);
    };

    const load = async () => {
      if (disposed || pending) return;
      if (timer) clearTimeout(timer);
      if (document.hidden) return schedule();

      pending = true;
      setLoading(true);
      try {
        const result = await dashboardApi.data(widget.id, controller.signal);
        if (!disposed) {
          setSnapshot((previous) => appendSnapshot(previous, key, result));
          setError("");
        }
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : "Unable to refresh this widget.");
      } finally {
        pending = false;
        if (!disposed) {
          setLoading(false);
          schedule();
        }
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden) void load();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    void load();

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
