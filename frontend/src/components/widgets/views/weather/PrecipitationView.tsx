import { LuCloudRain, LuDroplets, LuSnowflake } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { find, number } from "../../format";
import { Bar } from "../../shared";

export default function PrecipitationView({ items }: ViewProps) {
  const total = find(items, "Precipitation");
  const rain = find(items, "Rain");
  const snow = find(items, "Snowfall");
  const max = Math.max(number(total) ?? 0, number(rain) ?? 0, number(snow) ?? 0, 1);

  return (
    <div className="precipitation-view">
      <div className="primary-reading"><LuCloudRain aria-hidden="true" /><strong>{total}</strong></div>
      <div className="metric-line">
        <div><LuDroplets aria-hidden="true" /><span>Rain</span><strong>{rain}</strong></div>
        <Bar value={number(rain)} max={max} tone="cool" />
      </div>
      <div className="metric-line">
        <div><LuSnowflake aria-hidden="true" /><span>Snow</span><strong>{snow}</strong></div>
        <Bar value={number(snow)} max={max} tone="accent" />
      </div>
    </div>
  );
}
