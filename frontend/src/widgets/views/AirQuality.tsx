import { LuGauge, LuLeaf, LuAtom, LuCloud } from "react-icons/lu";
import type { ViewProps, WidgetTone } from "../WidgetUtils";
import { number } from "../WidgetUtils";
import { Bar } from "../WidgetUtils";

export function AqiView({ items }: ViewProps) {
  const value = number(items[0]?.value);

  return (
    <div className="aqi-view">
      <div className="primary-reading"><LuGauge aria-hidden="true" /><strong>{value ?? "—"}</strong></div>
      <div className="compact-row"><span><LuLeaf aria-hidden="true" /> European AQI</span><strong>{qualityLabel(value)}</strong></div>
      <Bar value={value} max={100} tone={value !== null && value > 60 ? "danger" : "accent"} />
    </div>
  );
}

const FORMULAS = ["NO₂", "O₃", "SO₂"];

const TONES: WidgetTone[] = ["cool", "accent", "violet"];

export function GasesView({ items }: ViewProps) {
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

export function ParticlesView({ items }: ViewProps) {
  const max = Math.max(...items.map((item) => number(item.value) ?? 0), 1);

  return (
    <div className="particle-list">
      {items.slice(0, 4).map((item) => (
        <div className="metric-line" key={item.label}>
          <div><LuCloud aria-hidden="true" /><span>{item.label}</span><strong>{item.value}</strong></div>
          <Bar value={number(item.value)} max={max} tone="cool" />
        </div>
      ))}
    </div>
  );
}

function qualityLabel(value: number | null) {
  if (value === null) return "Unavailable";
  if (value <= 20) return "Very good";
  if (value <= 40) return "Good";
  if (value <= 60) return "Moderate";
  if (value <= 80) return "Poor";
  return "Very poor";
}
