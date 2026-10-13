import { LuCloudRain, LuCloudSun, LuSun } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";

const FORECAST_PATTERN = /^(-?\d+(?:\.\d+)?)–(-?\d+(?:\.\d+)?) °C · (\d+(?:\.\d+)?) mm rain$/;

export default function ForecastView({ items }: ViewProps) {
  return (
    <div className="forecast-view">
      {items.map((item, index) => {
        const match = item.value.match(FORECAST_PATTERN);
        const Icon = [LuCloudRain, LuCloudSun, LuSun][index % 3];
        const day = new Date(`${item.label}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });

        return (
          <div className="forecast-day" key={item.label}>
            <span>{day}</span>
            <Icon aria-hidden="true" />
            {match ? (
              <>
                <strong>{match[2]}°</strong>
                <small>{match[1]}° · {match[3]} mm</small>
              </>
            ) : <small>{item.value}</small>}
          </div>
        );
      })}
    </div>
  );
}
