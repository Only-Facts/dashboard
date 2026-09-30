import { LuGripVertical } from "react-icons/lu";
import type { KeyboardEvent, PointerEvent } from "react";
import type { Widget } from "../types/dashboard";

interface WidgetDragHandleProps {
  widget: Widget;
  index: number;
  count: number;
  busy: boolean;
  onMove: (direction: number) => void;
  onAnnounce: (message: string) => void;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  onCancel: () => void;
}

export default function WidgetDragHandle(props: WidgetDragHandleProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const direction = keyboardDirection(event.key, props.index, props.count);
    if (direction === null) return;

    event.preventDefault();
    if (props.busy || direction === 0) return;

    props.onMove(direction);
    props.onAnnounce(`${props.widget.title} moved to position ${props.index + direction + 1}.`);
  }

  return (
    <button
      type="button"
      className="drag-handle"
      disabled={props.busy}
      aria-label={`Drag ${props.widget.title}`}
      aria-describedby="reorder-help"
      onPointerDown={props.onPointerDown}
      onPointerMove={props.onPointerMove}
      onPointerUp={props.onPointerUp}
      onPointerCancel={props.onCancel}
      onLostPointerCapture={props.onCancel}
      onKeyDown={handleKeyDown}
    >
      <LuGripVertical size={18} aria-hidden="true" />
    </button>
  );
}

function keyboardDirection(key: string, index: number, count: number) {
  if (key === "ArrowLeft" || key === "ArrowUp") return index > 0 ? -1 : 0;
  if (key === "ArrowRight" || key === "ArrowDown") return index < count - 1 ? 1 : 0;
  if (key === "Home") return -index;
  if (key === "End") return count - 1 - index;
  return null;
}
