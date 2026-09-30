import type { WidgetTone } from "../../../types/widgets";
import { clamp } from "../format";

interface BarProps {
  value: number | null;
  max: number;
  tone?: WidgetTone;
}

export default function Bar({ value, max, tone = "accent" }: BarProps) {
  const width = value === null ? 0 : clamp((value / Math.max(max, 1)) * 100);

  return (
    <div className={`chart-track chart-track--${tone}`} aria-hidden="true">
      <i style={{ width: `${width}%` }} />
    </div>
  );
}
