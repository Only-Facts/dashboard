import { LuArrowDown, LuBanknote } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";

export default function ConvertView({ widget, items }: ViewProps) {
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
