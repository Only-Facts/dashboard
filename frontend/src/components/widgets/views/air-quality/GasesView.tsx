import { LuAtom } from "react-icons/lu";
import type { ViewProps, WidgetTone } from "../../../../types/widgets";
import { number } from "../../format";
import { Bar } from "../../shared";

const FORMULAS = ["NO₂", "O₃", "SO₂"];
const TONES: WidgetTone[] = ["cool", "accent", "violet"];

export default function GasesView({ items }: ViewProps) {
  const max = Math.max(...items.map((item) => number(item.value) ?? 0), 1);

  return (
    <div className="gas-list">
      {items.slice(0, 4).map((item, index) => (
        <div className="gas-row" key={item.label}>
          <span className="gas-symbol"><LuAtom aria-hidden="true" />{FORMULAS[index] ?? "Gas"}</span>
          <div>
            <div><span>{item.label.split(" (")[0]}</span><strong>{item.value}</strong></div>
            <Bar value={number(item.value)} max={max} tone={TONES[index] ?? "violet"} />
          </div>
        </div>
      ))}
    </div>
  );
}
