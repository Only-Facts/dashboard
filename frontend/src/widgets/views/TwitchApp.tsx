import { useState } from "react";
import { LuRefreshCw } from "react-icons/lu";
import { SiTwitch } from "react-icons/si";
import type { Widget, WidgetData, WidgetInput } from "../../api/dashboardApi";
import { FollowedChannelsView, FollowedLiveView, ScheduleView } from "./Twitch";

interface Props {
  widget: Widget;
  data: WidgetData | null;
  loading: boolean;
  error: string;
  busy: boolean;
  refresh: () => void;
  onUpdate: (input: WidgetInput) => Promise<void>;
}
const views = [["followed_live", "Live"], ["followed_channels", "Channels"], ["schedule", "Schedule"]];

export function TwitchApp(props: Props) {
  return <TwitchAppContent key={JSON.stringify([props.widget.config, props.widget.type, props.widget.title, props.widget.refreshSeconds])} {...props} />;
}

function TwitchAppContent({ widget, data, loading, error, busy, refresh, onUpdate }: Props) {
  const [title, setTitle] = useState(widget.title);
  const [interval, setInterval] = useState(widget.refreshSeconds);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const disabled = busy || saving;
  const View = widget.type === "schedule" ? ScheduleView : widget.type === "followed_channels" ? FollowedChannelsView : FollowedLiveView;

  async function save(patch: Partial<WidgetInput>) {
    if (disabled) return;
    setSaving(true);
    setSaveError("");
    try {
      await onUpdate({ service: widget.service, type: widget.type, title: widget.title,
        config: { limit: widget.config.limit ?? "5" }, refreshSeconds: widget.refreshSeconds, ...patch });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save Twitch preferences.");
    } finally { setSaving(false); }
  }

  return <div className="twitch-app">
    <div className="twitch-toolbar">
      <span className="twitch-brand"><SiTwitch aria-hidden="true" /> Twitch</span>
      <button type="button" aria-label="Refresh Twitch" onClick={refresh} disabled={loading || saving}><LuRefreshCw aria-hidden="true" /></button>
    </div>
    <nav className="twitch-tabs" aria-label="Twitch views">
      {views.map(([type, label]) => <button type="button" key={type} aria-pressed={widget.type === type} disabled={disabled}
        onClick={() => { if (widget.type !== type) void save({ type }); }}>{label}</button>)}
    </nav>
    <div className="twitch-result-controls">
      <label>Items <select aria-label="Twitch item limit" value={widget.config.limit ?? "5"} disabled={disabled}
        onChange={event => void save({ config: { limit: event.target.value } })}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map(count => <option key={count} value={count}>{count}</option>)}
      </select></label>
      {widget.type === "schedule" && <small>Your channel’s schedule</small>}
    </div>
    {saving && <p className="sr-only" role="status">Saving Twitch preferences…</p>}
    {saveError && <p className="widget-error" role="alert">{saveError}</p>}
    {error && <p className="widget-error" role="alert">{error}</p>}
    {loading && !data ? <p role="status">Loading Twitch…</p> : data && <View widget={widget} items={data.items} history={[]} />}
    <details className="twitch-preferences">
      <summary>Customize</summary>
      <form onSubmit={event => { event.preventDefault(); void save({ title: title.trim(), refreshSeconds: interval }); }}>
        <label>Widget name<input required maxLength={80} value={title} disabled={disabled} onChange={event => setTitle(event.target.value)} /></label>
        <label>Refresh every (seconds)<input type="number" required min={60} max={86400} step={1} value={interval} disabled={disabled} onChange={event => setInterval(Number(event.target.value))} /></label>
        <button type="submit" disabled={disabled || !title.trim()}>Save preferences</button>
      </form>
    </details>
  </div>;
}
