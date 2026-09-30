import { useWidgetDrag } from "../hooks/useWidgetDrag";
import type { Widget } from "../types/dashboard";
import { widgetVisualSize } from "../utils/widgetLayout";
import WidgetCard from "./WidgetCard";
import WidgetDragHandle from "./WidgetDragHandle";

interface WidgetGridProps {
  widgets: Widget[];
  busy: boolean;
  onEdit: (widget: Widget) => void;
  onMove: (index: number, direction: number) => void;
  onDelete: (widget: Widget) => void;
}

export default function WidgetGrid(props: WidgetGridProps) {
  const drag = useWidgetDrag({ widgets: props.widgets, busy: props.busy, onMove: props.onMove });

  return (
    <>
      <p id="reorder-help" className="sr-only">
        Drag to another widget to move. Use arrow keys on a handle to move one position,
        or Home and End. Press Escape to cancel dragging.
      </p>
      <p className="sr-only" role="status">{drag.announcement}</p>

      <section aria-label="Your widgets" className="widget-grid" onKeyDown={(event) => event.key === "Escape" && drag.cancelDrag()}>
        {props.widgets.map((widget, index) => (
          <WidgetSlot
            key={widget.id}
            widget={widget}
            index={index}
            widgets={props.widgets}
            busy={props.busy}
            drag={drag}
            onEdit={props.onEdit}
            onMove={props.onMove}
            onDelete={props.onDelete}
          />
        ))}
      </section>

      {drag.drag?.moved && (
        <div className="drag-preview" style={{ left: drag.drag.x + 16, top: drag.drag.y + 16 }} aria-hidden="true">
          {props.widgets.find((widget) => widget.id === drag.drag?.id)?.title}
          <span>Drop to move here</span>
        </div>
      )}
    </>
  );
}

function WidgetSlot({ widget, index, widgets, busy, drag, onEdit, onMove, onDelete }: WidgetSlotProps) {
  const visualSize = widgetVisualSize(widget);
  const dragging = drag.drag?.moved && drag.drag.id === widget.id;
  const dropTarget = drag.drag?.moved && drag.drag.target === widget.id && drag.drag.id !== widget.id;

  return (
    <div data-widget-id={widget.id} className={`widget-slot widget-slot--${visualSize} ${dragging ? "is-dragging" : ""} ${dropTarget ? "is-drop-target" : ""}`}>
      <WidgetCard
        widget={widget}
        busy={busy}
        first={index === 0}
        last={index === widgets.length - 1}
        onEdit={() => onEdit(widget)}
        onDelete={() => onDelete(widget)}
        onMove={(direction) => onMove(index, direction)}
        dragHandle={
          <WidgetDragHandle
            widget={widget}
            index={index}
            count={widgets.length}
            busy={busy}
            onMove={(direction) => onMove(index, direction)}
            onAnnounce={drag.announce}
            onPointerDown={(event) => drag.startDrag(event, widget.id)}
            onPointerMove={drag.moveDrag}
            onPointerUp={drag.finishDrag}
            onCancel={drag.cancelDrag}
          />
        }
      />
    </div>
  );
}

type WidgetSlotProps = WidgetGridProps & {
  widget: Widget;
  index: number;
  drag: ReturnType<typeof useWidgetDrag>;
};
