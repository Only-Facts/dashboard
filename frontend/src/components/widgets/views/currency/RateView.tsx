import { LuArrowRight, LuTrendingUp } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";

export default function RateView({ widget, items }: ViewProps) {
  const base = widget.config.base ?? "Base";
  const target = widget.config.target ?? "Target";

  return (
    <div className="rate-view">
      <div className="currency-pair"><span>{base}</span><LuArrowRight aria-hidden="true" /><span>{target}</span></div>
      <div className="primary-reading"><LuTrendingUp aria-hidden="true" /><strong>{items[0]?.value ?? "—"}</strong></div>
      <div className="compact-row"><span>Base</span><strong>1 {base}</strong></div>
    </div>
  );
}
