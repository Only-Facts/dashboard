import { useRef, useState, type PointerEvent } from "react";
import type { Widget } from "../types/dashboard";
import type { WidgetDragState } from "../types/widgets";

interface UseWidgetDragOptions {
  widgets: Widget[];
  busy: boolean;
  onMove: (index: number, direction: number) => void;
}

export function useWidgetDrag({ widgets, busy, onMove }: UseWidgetDragOptions) {
  const [drag, setDrag] = useState<WidgetDragState | null>(null);
  const currentDrag = useRef<WidgetDragState | null>(null);
  const [announcement, setAnnouncement] = useState("");

  function updateDrag(next: WidgetDragState | null) {
    currentDrag.current = next;
    setDrag(next);
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, id: number) {
    if (busy || event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    updateDrag({
      id,
      target: id,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    });
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = currentDrag.current;
    if (!active) return;

    const target = widgetAtPoint(event.clientX, event.clientY) ?? active.target;
    const moved = active.moved || pointerDistance(active, event) > 5;
    updateDrag({ ...active, target, x: event.clientX, y: event.clientY, moved });
    autoScroll(event.clientY);
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = currentDrag.current;
    const slot = widgetAtPoint(event.clientX, event.clientY);
    updateDrag(null);

    if (!active?.moved || slot === null || active.id === active.target) return;
    const from = widgets.findIndex((widget) => widget.id === active.id);
    const to = widgets.findIndex((widget) => widget.id === active.target);
    if (from < 0 || to < 0) return;

    onMove(from, to - from);
    setAnnouncement(`${widgets[from].title} moved to position ${to + 1}.`);
  }

  return {
    drag,
    announcement,
    startDrag,
    moveDrag,
    finishDrag,
    cancelDrag: () => updateDrag(null),
    announce: setAnnouncement,
  };
}

function widgetAtPoint(x: number, y: number) {
  const slot = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-widget-id]");
  return slot ? Number(slot.dataset.widgetId) : null;
}

function pointerDistance(active: WidgetDragState, event: PointerEvent<HTMLButtonElement>) {
  return Math.hypot(event.clientX - active.startX, event.clientY - active.startY);
}

function autoScroll(pointerY: number) {
  if (pointerY > window.innerHeight - 70) window.scrollBy(0, 18);
  if (pointerY < 90) window.scrollBy(0, -18);
}
