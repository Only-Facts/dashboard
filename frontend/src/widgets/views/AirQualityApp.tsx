import { useState, type FormEvent } from "react";
import { LuRefreshCw, LuSearch } from "react-icons/lu";
import type { Widget, WidgetData, WidgetInput } from "../../api/dashboardApi";
import { number } from "../WidgetUtils";

interface Props {
  widget: Widget;
  data: WidgetData | null;
  loading: boolean;
  error: string;
  busy: boolean;
  refresh: () => void;
  onUpdate: (input: WidgetInput) => Promise<void>;
}
const views = [["aqi", "Overview"], ["particles", "Particles"], ["gases", "Gases"]];

export function AirQualityApp(props: Props) {
  return <AirQualityAppContent key={JSON.stringify([props.widget.config, props.widget.type, props.widget.title, props.widget.refreshSeconds])} {...props} />;
}

function AirQualityAppContent({ widget, data, loading, error, busy, refresh, onUpdate }: Props) {
  const [city, setCity] = useState(widget.config.city ?? "Bordeaux");
  const [title, setTitle] = useState(widget.title);
  const [interval, setInterval] = useState(widget.refreshSeconds);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const disabled = busy || saving;
  const items = data?.items.filter(item => item.label !== "Location") ?? [];
  const location = data?.items.find(item => item.label === "Location")?.value;
  const aqi = number(items.find(item => item.label === "European AQI")?.value);

  async function save(patch: Partial<WidgetInput>) {
    if (disabled) return;
    setSaving(true);
    setSaveError("");
    try {
      await onUpdate({ service: widget.service, type: widget.type, title: widget.title,
        config: widget.config, refreshSeconds: widget.refreshSeconds, ...patch });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save air quality preferences.");
    } finally { setSaving(false); }
  }

  function search(event: FormEvent) {
    event.preventDefault();
    if (city.trim()) void save({ config: { city: city.trim() } });
  }

  return <div className="air-app">
    <div className="air-toolbar">
      <form className="air-search" onSubmit={search}>
        <label className="widget-search-field"><span className="sr-only">Air quality city</span><input aria-label="Air quality city" title={location} placeholder="Search a city" required maxLength={120} value={city} disabled={disabled} onChange={event => setCity(event.target.value)} /></label>
        <button type="submit" aria-label="Search air quality" title="Search air quality" disabled={disabled || !city.trim()}><LuSearch aria-hidden="true" /></button>
      </form>
      <button type="button" aria-label="Refresh air quality" title="Refresh air quality" onClick={refresh} disabled={loading || saving}><LuRefreshCw aria-hidden="true" /></button>
    </div>
    <nav className="air-tabs" aria-label="Air quality views">
      {views.map(([type, label]) => <button type="button" key={type} aria-pressed={widget.type === type} disabled={disabled} onClick={() => { if (widget.type !== type) void save({ type }); }}>{label}</button>)}
    </nav>
    {saving && <p role="status" className="sr-only">Saving air quality preferences…</p>}
    {saveError && <p role="alert" className="widget-error">{saveError}</p>}
    {error && <p role="alert" className="widget-error">{error}</p>}
    {loading && !data ? <p role="status">Loading air quality…</p> : items.length ? (
      widget.type === "aqi" ? <div className="air-overview">
        <span>European AQI</span>
        <div className="primary-reading"><strong>{aqi ?? "Unavailable"}</strong></div>
        {aqi !== null && <span>Lower is better</span>}
      </div> : <dl className="air-measurements">
        {items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
      </dl>
    ) : !error && <p>No readings available. Try another city or refresh.</p>}
    <details className="air-preferences">
      <summary>Customize</summary>
      <form onSubmit={event => { event.preventDefault(); void save({ title: title.trim(), refreshSeconds: interval }); }}>
        <label>Widget name<input required maxLength={80} value={title} disabled={disabled} onChange={event => setTitle(event.target.value)} /></label>
        <label>Refresh every (seconds)<input type="number" required min={60} max={86400} step={1} value={interval} disabled={disabled} onChange={event => setInterval(Number(event.target.value))} /></label>
        <button type="submit" disabled={disabled || !title.trim()}>Save preferences</button>
      </form>
    </details>
  </div>;
}
