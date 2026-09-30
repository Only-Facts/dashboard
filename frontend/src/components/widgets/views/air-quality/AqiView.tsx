import { LuGauge, LuLeaf } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { qualityLabel } from "../../../../utils/airQuality";
import { number } from "../../format";
import { Bar } from "../../shared";

export default function AqiView({ items }: ViewProps) {
  const value = number(items[0]?.value);

  return (
    <div className="aqi-view">
      <div className="primary-reading"><LuGauge aria-hidden="true" /><strong>{value ?? "—"}</strong></div>
      <div className="compact-row"><span><LuLeaf aria-hidden="true" /> European AQI</span><strong>{qualityLabel(value)}</strong></div>
      <Bar value={value} max={100} tone={value !== null && value > 60 ? "danger" : "accent"} />
    </div>
  );
}
