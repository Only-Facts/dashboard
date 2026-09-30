import { LuDroplets, LuWind } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { find, number } from "../../format";
import { Bar } from "../../shared";

export default function WindView({ items }: ViewProps) {
  const humidity = find(items, "Humidity");

  return (
    <div className="wind-view">
      <div className="primary-reading">
        <LuWind aria-hidden="true" />
        <strong>{find(items, "Wind")}</strong>
      </div>
      <div className="metric-line">
        <div><LuDroplets aria-hidden="true" /><span>Humidity</span><strong>{humidity}</strong></div>
        <Bar value={number(humidity)} max={100} tone="cool" />
      </div>
    </div>
  );
}
