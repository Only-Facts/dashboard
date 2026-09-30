import type { ComponentType } from "react";
import type { ViewProps, WidgetVisualChrome } from "../../types/widgets";

interface WidgetDataStateProps extends ViewProps {
  chrome: WidgetVisualChrome;
  View: ComponentType<ViewProps>;
}

export default function WidgetDataState({ chrome, View, ...viewProps }: WidgetDataStateProps) {
  if (chrome.loading && !chrome.data) {
    return (
      <div className="widget-skeleton" role="status">
        <span className="sr-only">Loading data…</span>
        <i /><i /><i />
      </div>
    );
  }

  return (
    <>
      {chrome.error && <p role="alert" className="widget-error">{chrome.error}</p>}
      {chrome.data && viewProps.items.length === 0 && <p className="widget-empty">No results.</p>}
      {viewProps.items.length > 0 && <View {...viewProps} />}
    </>
  );
}
