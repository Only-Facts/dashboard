import { widgetRegistry, defaultWidget } from "./registry";
import type { Widget, WidgetInput } from "../api/dashboardApi";
import WidgetCard from "./WidgetCard";
import { type PointerEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { WidgetDragState } from "./WidgetUtils";

interface WidgetGridProps {
  widgets: Widget[];
  busy: boolean;
  onUpdate: (widget: Widget, input: WidgetInput) => Promise<void>;
  onMove: (index: number, direction: number) => void;
  onDelete: (widget: Widget) => Promise<boolean>;
}

const interactive = 'button, input, select, textarea, a, summary, [contenteditable="true"], [role="button"]';
type Hold = WidgetDragState & { phase: "pending" | "ready"; pointerId: number; element: HTMLDivElement };

export default function WidgetGrid({ widgets, busy, onUpdate, onMove, onDelete }: WidgetGridProps) {
  const grid = useRef<HTMLElement>(null);
  const [drag, setDrag] = useState<Hold | null>(null);
  const current = useRef<Hold | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const suppressClick = useRef(false);
  const [announcement, setAnnouncement] = useState("");

  const cancel = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const active = current.current;
    current.current = null;
    setDrag(null);
    document.querySelector("[data-trash-zone]")?.classList.remove("is-drop-target");
    if (active?.element.hasPointerCapture(active.pointerId)) active.element.releasePointerCapture(active.pointerId);
  }, []);

  useEffect(() => {
    const preventScroll = (event: TouchEvent) => {
      if (current.current?.phase === "ready" && event.cancelable) event.preventDefault();
    };
    const hidden = () => { if (document.hidden) cancel(); };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      cancel();
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, [cancel, busy, widgets]);

  // Measure intrinsic heights before paint and again when data or controls grow.
  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;
    const measure = () => {
      const styles = getComputedStyle(element);
      const row = Number.parseFloat(styles.gridAutoRows);
      const gap = Number.parseFloat(styles.rowGap) || 0;
      const sizes = Array.from(element.children).flatMap(slot => {
        if (!(slot instanceof HTMLElement)) return [];
        const card = slot.querySelector<HTMLElement>(".widget-visual");
        if (!card) return [];
        const span = Number.isFinite(row)
          ? Math.max(1, Math.ceil((card.getBoundingClientRect().height + gap) / (row + gap))) : 1;
        return [{ slot, value: `span ${span}` }];
      });
      for (const { slot, value } of sizes) {
        if (slot.style.gridRowEnd !== value) slot.style.gridRowEnd = value;
      }
    };
    const observer = new ResizeObserver(measure);
    element.querySelectorAll(".widget-visual").forEach(card => observer.observe(card));
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [widgets]);

  function update(next: Hold) { current.current = next; setDrag(next); }

  function start(event: PointerEvent<HTMLDivElement>, id: number) {
    if (busy || event.button !== 0 || !event.isPrimary || (event.target as HTMLElement).closest(interactive)) return;
    cancel();
    suppressClick.current = false;
    const element = event.currentTarget;
    element.setPointerCapture(event.pointerId);
    update({ id, target: id, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false, phase: "pending", pointerId: event.pointerId, element });
    timers.current = [
      setTimeout(() => {
        if (!current.current) return;
        update({ ...current.current, phase: "ready" });
        suppressClick.current = true;
        setAnnouncement("Ready to drag. Move to another widget and release to place it.");
      }, 2000),
    ];
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const active = current.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - active.startX, event.clientY - active.startY);
    if (active.phase !== "ready") {
      if (distance > 8) cancel();
      return;
    }
    event.preventDefault();
    const target = widgetAtPoint(event.clientX, event.clientY) ?? active.id;
    document.querySelector("[data-trash-zone]")?.classList.toggle("is-drop-target", target === "trash");
    update({ ...active, x: event.clientX, y: event.clientY, moved: active.moved || distance > 8, target });
    if (event.clientY > window.innerHeight - 70) window.scrollBy(0, 18);
    if (event.clientY < 90) window.scrollBy(0, -18);
  }

  async function updateWidget(widget: Widget, input: WidgetInput) {
    const slot = grid.current?.querySelector<HTMLElement>(`[data-widget-id="${widget.id}"]`);
    const focused = document.activeElement;
    const controls = Array.from(slot?.querySelectorAll<HTMLElement>(interactive) ?? []);
    const index = controls.indexOf(focused as HTMLElement);
    try {
      await onUpdate(widget, input);
    } finally {
      requestAnimationFrame(() => {
        if (index < 0 || (focused instanceof HTMLElement && focused.isConnected)) return;
        const nextSlot = grid.current?.querySelector<HTMLElement>(`[data-widget-id="${widget.id}"]`);
        const nextControls = Array.from(nextSlot?.querySelectorAll<HTMLElement>(interactive) ?? []);
        const label = focused?.getAttribute("aria-label");
        const next = label ? nextControls.find(control => control.getAttribute("aria-label") === label) : nextControls[index];
        next?.focus();
      });
    }
  }

  function moveWidget(index: number, direction: number) {
    const id = widgets[index].id;
    onMove(index, direction);
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-widget-id="${id}"]`)?.focus());
  }

  async function deleteWidget(widget: Widget) {
    const index = widgets.findIndex(item => item.id === widget.id);
    if (!await onDelete(widget)) return;
    setAnnouncement(`${widget.title} deleted.`);
    requestAnimationFrame(() => {
      const slots = grid.current?.querySelectorAll<HTMLElement>('[data-widget-id]');
      const next = slots?.[Math.min(index, slots.length - 1)];
      if (next) next.focus();
      else document.querySelector<HTMLButtonElement>('.workspace-heading__actions button')?.focus();
    });
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    const active = current.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const target = widgetAtPoint(event.clientX, event.clientY);
    cancel();
    if (busy || active.phase !== "ready" || !active.moved || target === null) return;
    if (target === "trash") {
      const widget = widgets.find(item => item.id === active.id);
      if (widget) void deleteWidget(widget);
      return;
    }
    if (target === active.id) return;
    const from = widgets.findIndex(widget => widget.id === active.id);
    const to = widgets.findIndex(widget => widget.id === target);
    if (from < 0 || to < 0) return;
    moveWidget(from, to - from);
    setAnnouncement(`${widgets[from].title} moved to position ${to + 1}.`);
  }

  return <>
    <p id="reorder-help" className="sr-only">Hold a widget for 2 seconds to drag. A spinner appears immediately while holding. Release it on another widget to reorder or on the trash icon to delete it. When a widget is focused, use arrow keys, Home or End to reorder. Delete removes the focused widget after confirmation. Escape cancels.</p>
    <p className="sr-only" role="status">{announcement}</p>
    <section ref={grid} aria-label="Your widgets" className="widget-grid" onKeyDown={event => { if (event.key === "Escape") cancel(); }}>
      {widgets.map((widget, index) => {
        const size = (widgetRegistry[`${widget.service}:${widget.type}`] ?? defaultWidget).size;
        const active = drag?.id === widget.id;
        const ready = active && drag.phase === "ready";
        const target = drag?.phase === "ready" && drag.moved && drag.target === widget.id && !active;
        return <div key={widget.id} data-widget-id={widget.id}
          className={`widget-slot widget-slot--${size} ${active ? "is-holding" : ""} ${ready ? "is-drag-ready" : ""} ${ready && drag.moved ? "is-dragging" : ""} ${target ? "is-drop-target" : ""}`}
          tabIndex={busy ? undefined : 0} role="group" aria-label={`Reorder ${widget.title}`} aria-describedby="reorder-help"
          onPointerDown={event => start(event, widget.id)} onPointerMove={move} onPointerUp={finish}
          onPointerCancel={cancel} onLostPointerCapture={cancel}
          onContextMenu={event => { if (current.current) event.preventDefault(); }}
          onClickCapture={event => { if (suppressClick.current && !(event.target as HTMLElement).closest(interactive)) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
          onKeyDown={event => {
            if (busy || event.target !== event.currentTarget) return;
            if (event.key === "Delete") {
              event.preventDefault();
              void deleteWidget(widget);
              return;
            }
            const direction = keyboardDirection(event.key, index, widgets.length);
            if (direction === null) return;
            event.preventDefault();
            cancel();
            if (direction) { moveWidget(index, direction); setAnnouncement(`${widget.title} moved to position ${index + direction + 1}.`); }
          }}>
          <WidgetCard widget={widget} busy={busy} onUpdate={input => updateWidget(widget, input)}
            onMoveUp={index > 0 ? () => moveWidget(index, -1) : undefined}
            onMoveDown={index < widgets.length - 1 ? () => moveWidget(index, 1) : undefined}
            onDelete={() => void deleteWidget(widget)} />
          {active && drag.phase === "pending" && <div className="widget-hold-indicator" role="status"><i className="widget-hold-spinner" aria-hidden="true" /><span className="sr-only">Keep holding to drag</span></div>}
          {ready && !drag.moved && <div className="widget-hold-indicator" role="status">Ready to drag</div>}
        </div>;
      })}
    </section>
    {drag?.phase === "ready" && drag.moved && <div className="drag-preview" style={{ left: drag.x + 16, top: drag.y + 16 }} aria-hidden="true">{widgets.find(widget => widget.id === drag.id)?.title}</div>}
  </>;
}

function widgetAtPoint(x: number, y: number) {
  const trash = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-trash-zone]");
  if (trash) return "trash" as const;
  const slot = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-widget-id]");
  return slot ? Number(slot.dataset.widgetId) : null;
}

function keyboardDirection(key: string, index: number, count: number) {
  if (key === "ArrowLeft" || key === "ArrowUp") return index > 0 ? -1 : 0;
  if (key === "ArrowRight" || key === "ArrowDown") return index < count - 1 ? 1 : 0;
  if (key === "Home") return -index;
  if (key === "End") return count - 1 - index;
  return null;
}
