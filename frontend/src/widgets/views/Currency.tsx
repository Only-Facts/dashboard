import { LuArrowDown, LuBanknote, LuArrowRight, LuTrendingUp } from "react-icons/lu";
import type { ViewProps } from "../WidgetUtils";

export function ConvertView({ widget, items }: ViewProps) {
  const base = widget.config.base ?? "Base";
  const amount = widget.config.amount ?? items[0]?.label.split(" ")[0] ?? "—";

  return (
    <div className="convert-view">
      <div className="conversion-value"><LuBanknote aria-hidden="true" /><strong>{amount}</strong><span>{base}</span></div>
      <LuArrowDown className="conversion-arrow" aria-hidden="true" />
      <div className="conversion-result">{items[0]?.value ?? "—"}</div>
      {items[1]?.value && <small className="single-note">{items[1].value}</small>}
    </div>
  );
}

export function RateView({ widget, items }: ViewProps) {
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
