import { LuCloud } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { number } from "../../format";
import { Bar } from "../../shared";

export default function ParticlesView({ items }: ViewProps) {
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
