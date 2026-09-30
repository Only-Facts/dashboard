import { LuRefreshCw } from "react-icons/lu";
import type { Widget, WidgetData } from "../../types/dashboard";

interface WidgetFooterInfoProps {
  widget: Widget;
  data: WidgetData | null;
  refreshSeconds: number;
}

export default function WidgetFooterInfo({ widget, data, refreshSeconds }: WidgetFooterInfoProps) {
  return (
    <>
      <span>{data ? data.source : widget.service.replaceAll("_", " ")}</span>
      <span className="refresh-interval">
        <LuRefreshCw size={11} aria-hidden="true" /> {formatInterval(refreshSeconds)}
      </span>
    </>
  );
}

function formatInterval(seconds: number) {
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}
