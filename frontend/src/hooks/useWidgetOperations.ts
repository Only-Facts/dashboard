import { dashboardApi } from "../api/dashboardApi";
import type { Dispatch, SetStateAction } from "react";
import type { Widget, WidgetInput } from "../types/dashboard";
import { reorderWidgets } from "../utils/dashboard";

interface WidgetOperationsOptions {
  widgets: Widget[];
  setWidgets: Dispatch<SetStateAction<Widget[]>>;
  run: (task: () => Promise<void>) => Promise<boolean>;
  onLayoutSaved: () => void;
}

export function useWidgetOperations(options: WidgetOperationsOptions) {
  async function move(index: number, direction: number) {
    const reordered = reorderWidgets(options.widgets, index, direction);
    if (!reordered) return;

    const previous = options.widgets;
    options.setWidgets(reordered);
    const saved = await options.run(() => dashboardApi.order(reordered.map((widget) => widget.id)));

    if (saved) options.onLayoutSaved();
    else options.setWidgets(previous);
  }

  async function remove(widget: Widget) {
    if (!window.confirm(`Delete “${widget.title}”?`)) return;

    await options.run(async () => {
      await dashboardApi.remove(widget.id);
      options.setWidgets((current) => current.filter((item) => item.id !== widget.id));
    });
  }

  async function save(input: WidgetInput, editing: Widget | "new") {
    const saved = await dashboardApi.save(input, editing === "new" ? undefined : editing.id);
    options.setWidgets((current) => editing === "new"
      ? [...current, saved]
      : current.map((widget) => widget.id === saved.id ? saved : widget));
  }

  return { move, remove, save };
}
