import { useId } from "react";
import { LuInfo, LuX } from "react-icons/lu";

export default function WidgetHelp() {
  const id = useId();
  return <>
    <button type="button" className="widget-help-button" popoverTarget={id}
      aria-label="How to move and delete widgets" title="Widget help">
      <LuInfo aria-hidden="true" />
    </button>
    <div id={id} popover="auto" className="widget-help" role="dialog" aria-labelledby={`${id}-title`}>
      <div className="widget-help__heading">
        <h2 id={`${id}-title`}>Arrange your widgets</h2>
        <button type="button" popoverTarget={id} popoverTargetAction="hide" aria-label="Close widget help"><LuX aria-hidden="true" /></button>
      </div>
      <p><strong>Move:</strong> Press and hold a widget for 2 seconds until it is ready to drag. Drag it onto another widget, then release to reorder.</p>
      <p><strong>Delete:</strong> Drag a widget onto “Drop to delete” at the top, then confirm the deletion. You can also use the delete button on each widget.</p>
      <p><strong>Cancel:</strong> Press Escape to cancel dragging.</p>
      <p><strong>Keyboard:</strong> Focus a widget with Tab, then use arrow keys, Home, or End to move it. Press Delete to remove it after confirmation.</p>
    </div>
  </>;
}
