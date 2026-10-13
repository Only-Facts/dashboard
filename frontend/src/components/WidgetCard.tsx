import type { ReactNode } from "react";
import type { Widget } from "../types/dashboard";
import { useWidgetData } from "../hooks/useWidgetData";
import WidgetVisual from "./widgets/WidgetVisual";

interface WidgetCardProps {
  widget: Widget;
  first: boolean;
  last: boolean;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: number) => void;
  dragHandle: ReactNode;
}

export default function WidgetCard({ widget, first, last, busy, onEdit, onDelete, onMove, dragHandle }: WidgetCardProps) {
  const { data, history, error, loading, refresh } = useWidgetData(widget);
  const items = data?.items ?? [];
  const location = items.find((item) => item.label === "Location");
  const metrics = items.filter((item) => item !== location);

  return (
    <WidgetVisual
      widget={widget}
      items={metrics}
      history={history}
      chrome={{
        title: widget.title,
        subtitle: location?.value ?? widget.service.replaceAll("_", " "),
        loading,
        error,
        data,
        refreshSeconds: widget.refreshSeconds,
        busy,
        first,
        last,
        dragHandle,
        onRefresh: refresh,
        onEdit,
        onDelete,
        onMove,
      }}
    />
  );
}
