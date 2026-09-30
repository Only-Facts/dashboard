import { LuSunrise, LuSunset } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { find } from "../../format";
import { clockTime, daylightDuration } from "../../../../utils/weather";

export default function SunView({ items }: ViewProps) {
  const sunrise = find(items, "Sunrise");
  const sunset = find(items, "Sunset");
  const duration = daylightDuration(sunrise, sunset);

  return (
    <div className="sun-view">
      <div className="sun-times">
        <div><LuSunrise aria-hidden="true" /><span>Sunrise</span><strong>{clockTime(sunrise)}</strong></div>
        <div><LuSunset aria-hidden="true" /><span>Sunset</span><strong>{clockTime(sunset)}</strong></div>
      </div>
      <div className="compact-row">
        <span>Daylight</span>
        <strong>{duration === null ? "—" : `${Math.floor(duration / 60)}h ${duration % 60}m`}</strong>
      </div>
    </div>
  );
}
