import { useState } from "react";
import { LuMapPin, LuRefreshCw, LuSearch } from "react-icons/lu";
import type { Widget, WidgetData, WidgetInput } from "../../api/dashboardApi";
import { ForecastView, PrecipitationView, SunView, TemperatureView, WindView } from "./Weather";

const views = [
  { type: "temperature", label: "Now", View: TemperatureView },
  { type: "forecast", label: "Forecast", View: ForecastView },
  { type: "wind", label: "Wind", View: WindView },
  { type: "precipitation", label: "Rain", View: PrecipitationView },
  { type: "sun", label: "Sun", View: SunView },
];

interface Props {
  widget: Widget;
  data: WidgetData | null;
  history: WidgetData[];
  loading: boolean;
  error: string;
  busy: boolean;
  refresh: () => void;
  onUpdate: (input: WidgetInput) => Promise<void>;
}

export function WeatherApp(props: Props) {
  // Remount drafts only after a successful persisted change.
  return <WeatherAppContent key={JSON.stringify([props.widget.type, props.widget.config, props.widget.title, props.widget.refreshSeconds])} {...props} />;
}

function WeatherAppContent({ widget, data, history, loading, error, busy, refresh, onUpdate }: Props) {
  const [city, setCity] = useState(widget.config.city ?? "Paris");
  const [title, setTitle] = useState(widget.title);
  const [interval, setInterval] = useState(widget.refreshSeconds);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const disabled = busy || saving;
  const active = views.find(view => view.type === widget.type) ?? views[0];
  const View = active.View;
  const items = data?.items.filter(item => item.label !== "Location") ?? [];
  const location = data?.items.find(item => item.label === "Location")?.value ?? widget.config.city;

  async function save(patch: Partial<WidgetInput>) {
    if (disabled) return;
    setSaving(true);
    setSaveError("");
    try {
      await onUpdate({ service: widget.service, type: widget.type, title: widget.title, config: widget.config, refreshSeconds: widget.refreshSeconds, ...patch });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save weather preferences.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="weather-app">
    <div className="weather-toolbar">
    <form className="weather-search" onSubmit={event => { event.preventDefault(); if (city.trim()) void save({ config: { ...widget.config, city: city.trim() } }); }}>
      <LuMapPin aria-hidden="true" />
      <label className="widget-search-field"><span className="sr-only">Weather city</span><input title={location} aria-label="Weather city" placeholder="Search a city" required maxLength={120} value={city} disabled={disabled} onChange={event => setCity(event.target.value)} /></label>
      <button type="submit" aria-label="Search weather" disabled={disabled || !city.trim()}><LuSearch aria-hidden="true" /></button>
    </form>
    <button className="weather-refresh" type="button" onClick={refresh} disabled={loading || saving} aria-label="Refresh weather" title="Refresh weather"><LuRefreshCw aria-hidden="true" /></button>
    </div>
    <div className="weather-tabs" role="group" aria-label="Weather views">
      {views.map(view => <button type="button" key={view.type} aria-pressed={widget.type === view.type} disabled={disabled} onClick={() => { if (widget.type !== view.type) void save({ type: view.type, config: { city: widget.config.city, ...(view.type === "forecast" ? { days: widget.config.days ?? "5" } : {}) } }); }}>{view.label}</button>)}
    </div>
    <div className="weather-scene">
      {error && <p role="alert" className="widget-error">{error}</p>}
      {loading && !data ? <p role="status">Loading weather…</p> : items.length ? <View widget={widget} items={items} history={history} /> : <p className="widget-empty">Weather is unavailable. Try another city or refresh.</p>}
      {active.type === "sun" && <small>{items.find(item => item.label === "Timezone")?.value}</small>}
    </div>
    {widget.type === "forecast" && <label className="weather-days">Forecast length<select aria-label="Forecast length" value={widget.config.days ?? "5"} disabled={disabled} onChange={event => void save({ config: { ...widget.config, days: event.target.value } })}>{[1,2,3,4,5,6,7].map(day => <option key={day} value={day}>{day} {day === 1 ? "day" : "days"}</option>)}</select></label>}
    <details className="weather-preferences">
      <summary>Customize</summary>
      <form onSubmit={event => { event.preventDefault(); void save({ title: title.trim(), refreshSeconds: interval }); }}>
        <label>Widget name<input required maxLength={80} value={title} disabled={disabled} onChange={event => setTitle(event.target.value)} /></label>
        <label>Refresh every (seconds)<input required type="number" min={60} max={86400} step={1} value={interval} disabled={disabled} onChange={event => setInterval(Number(event.target.value))} /></label>
        <button type="submit" disabled={disabled || !title.trim()}>Save preferences</button>
      </form>
    </details>
    {saving && <p className="sr-only" role="status">Saving weather…</p>}
    {saveError && <p className="widget-error" role="alert">{saveError}</p>}
  </div>;
}
