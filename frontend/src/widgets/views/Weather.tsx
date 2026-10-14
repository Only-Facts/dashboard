import { LuCloudRain, LuCloudSun, LuSun, LuDroplets, LuSnowflake, LuSunrise, LuSunset, LuThermometer, LuWind } from "react-icons/lu";
import type { ViewProps } from "../WidgetUtils";
import { find, number } from "../WidgetUtils";
import { Bar } from "../WidgetUtils";

const FORECAST_PATTERN = /^(-?\d+(?:\.\d+)?)–(-?\d+(?:\.\d+)?) °C · (\d+(?:\.\d+)?) mm rain$/;

export function ForecastView({ items }: ViewProps) {
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

export function PrecipitationView({ items }: ViewProps) {
  const total = find(items, "Precipitation");
  const rain = find(items, "Rain");
  const showers = find(items, "Showers");
  const snow = find(items, "Snowfall");
  const period = items.find(item => item.label === "Period")?.value ?? "Current measurement period";
  const max = Math.max(number(total) ?? 0, number(rain) ?? 0, number(showers) ?? 0, 1);

  return (
    <div className="precipitation-view">
      <div className="compact-row"><span>Total precipitation</span><small>{period}</small></div>
      <div className="primary-reading"><LuCloudRain aria-hidden="true" /><strong>{total}</strong></div>
      <div className="metric-line">
        <div><LuDroplets aria-hidden="true" /><span>Rain</span><strong>{rain}</strong></div>
        <Bar value={number(rain)} max={max} tone="cool" />
      </div>
      <div className="metric-line">
        <div><LuCloudRain aria-hidden="true" /><span>Showers</span><strong>{showers}</strong></div>
        <Bar value={number(showers)} max={max} tone="cool" />
      </div>
      <div className="metric-line">
        <div><LuSnowflake aria-hidden="true" /><span>Snow</span><strong>{snow}</strong></div>
        <small>Snowfall depth · total above uses water equivalent</small>
      </div>
    </div>
  );
}

export function SunView({ items }: ViewProps) {
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

export function TemperatureView({ items }: ViewProps) {
  return (
    <div className="temperature-view">
      <div className="primary-reading">
        <LuThermometer aria-hidden="true" />
        <strong>{find(items, "Temperature")}</strong>
      </div>
      <div className="compact-row">
        <span>Feels like</span>
        <strong>{find(items, "Feels like")}</strong>
      </div>
    </div>
  );
}

export function WindView({ items }: ViewProps) {
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

function clockTime(text: string) {
  return text.match(/\d{2}:\d{2}$/)?.[0] ?? "—";
}

function minutesFromTimestamp(text: string) {
  const match = text.match(/(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function daylightDuration(sunrise: string, sunset: string) {
  const start = minutesFromTimestamp(sunrise);
  const end = minutesFromTimestamp(sunset);
  if (start === null || end === null || end < start) return null;
  return end - start;
}
