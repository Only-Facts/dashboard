import { useState } from "react";
import { LuRefreshCw } from "react-icons/lu";
import type { Widget, WidgetData, WidgetInput } from "../../api/dashboardApi";
import { SpotifyView } from "./Spotify";

interface Props {
  widget: Widget;
  data: WidgetData | null;
  loading: boolean;
  error: string;
  busy: boolean;
  refresh: () => void;
  onUpdate: (input: WidgetInput) => Promise<void>;
}

export function SpotifyApp({ widget, data, loading, error, busy, refresh, onUpdate }: Props) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  async function configure(name: string, value: string) {
    if (busy || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await onUpdate({ service: widget.service, title: widget.title,
        type: name === "type" ? value : widget.type,
        config: name === "type" ? { limit: widget.config.limit ?? "5", ...(value === "top_tracks" ? { time_range: widget.config.time_range ?? "medium_term" } : {}) } : { ...widget.config, [name]: value }, refreshSeconds: widget.refreshSeconds });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save Spotify preferences.");
    } finally { setSaving(false); }
  }
  return <div className="spotify-app">
    <nav className="twitch-tabs spotify-tabs" aria-label="Spotify views">
      {[["recently_played", "Recent"], ["top_tracks", "Top tracks"], ["playlists", "Playlists"]].map(([type, label]) => <button type="button" key={type} aria-pressed={widget.type === type} disabled={busy || saving} onClick={() => { if (widget.type !== type) void configure("type", type); }}>{label}</button>)}
    </nav>
    <div className="spotify-controls">
      <label>Items <select aria-label="Spotify item limit" value={widget.config.limit} disabled={busy || saving}
        onChange={event => void configure("limit", event.target.value)}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map(count => <option key={count} value={count}>{count}</option>)}
      </select></label>
      {widget.type === "top_tracks" && <select aria-label="Top tracks period" value={widget.config.time_range} disabled={busy || saving}
        onChange={event => void configure("time_range", event.target.value)}>
        <option value="short_term">Last 4 weeks</option><option value="medium_term">Last 6 months</option><option value="long_term">Last year</option>
      </select>}
      <button type="button" aria-label="Refresh Spotify" onClick={refresh} disabled={loading || saving}><LuRefreshCw aria-hidden="true" /></button>
    </div>
    {(error || saveError) && <p role="alert" className="widget-error">{saveError || error}</p>}
    {loading && !data ? <p role="status">Loading Spotify…</p> : data && <SpotifyView widget={widget} items={data.items} history={[]} />}
  </div>;
}
