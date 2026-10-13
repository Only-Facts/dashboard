import { LuEllipsis } from "react-icons/lu";
import type { WidgetVisualChrome } from "../../types/widgets";

export default function WidgetControls({ chrome }: { chrome: WidgetVisualChrome }) {
  return (
    <div className="widget-controls orbit-widget-controls">
      {chrome.dragHandle}
      <details className="widget-menu">
        <summary aria-label={`Options for ${chrome.title}`} title="Widget options">
          <LuEllipsis size={18} aria-hidden="true" />
        </summary>
        <div className="widget-menu-panel" onClick={closeAfterButtonClick}>
          <button onClick={chrome.onRefresh} disabled={chrome.loading}>
            {chrome.loading ? "Refreshing…" : "Refresh"}
          </button>
          <button onClick={chrome.onEdit} disabled={chrome.busy}>Edit widget</button>
          <button onClick={() => chrome.onMove(-1)} disabled={chrome.busy || chrome.first}>Move earlier</button>
          <button onClick={() => chrome.onMove(1)} disabled={chrome.busy || chrome.last}>Move later</button>
          <button onClick={chrome.onDelete} disabled={chrome.busy} className="delete-action">Delete widget</button>
        </div>
      </details>
    </div>
  );
}

function closeAfterButtonClick(event: React.MouseEvent<HTMLDivElement>) {
  if (event.target instanceof HTMLButtonElement) {
    event.currentTarget.closest("details")?.removeAttribute("open");
  }
}
