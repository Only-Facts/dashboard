import { useState, type FormEvent } from "react";
import { LuRefreshCw, LuSearch } from "react-icons/lu";
import type { Widget, WidgetData, WidgetInput } from "../../api/dashboardApi";
import { ItemLink } from "../WidgetUtils";

interface Props {
  widget: Widget;
  data: WidgetData | null;
  loading: boolean;
  error: string;
  busy: boolean;
  refresh: () => void;
  onUpdate: (input: WidgetInput) => Promise<void>;
}

export function NewsApp(props: Props) {
  return <NewsAppContent key={JSON.stringify([props.widget.config, props.widget.type, props.widget.title, props.widget.refreshSeconds])} {...props} />;
}

function NewsAppContent({ widget, data, loading, error, busy, refresh, onUpdate }: Props) {
  const [query, setQuery] = useState(widget.config.query ?? "programming");
  const [title, setTitle] = useState(widget.title);
  const [interval, setInterval] = useState(widget.refreshSeconds);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const disabled = busy || saving;

  async function save(patch: Partial<WidgetInput>) {
    if (disabled) return;
    setSaving(true);
    setSaveError("");
    try {
      await onUpdate({ service: widget.service, type: widget.type, title: widget.title,
        config: { query: widget.config.query ?? "programming", limit: widget.config.limit ?? "5" }, refreshSeconds: widget.refreshSeconds, ...patch });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save your news feed.");
    } finally { setSaving(false); }
  }

  function search(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) void save({ config: { query: query.trim(), limit: widget.config.limit ?? "5" } });
  }

  return <div className="news-app">
    <div className="news-toolbar">
      <form className="news-search" onSubmit={search}>
        <label className="widget-search-field"><span className="sr-only">News topic</span><input aria-label="News topic" placeholder="Search a topic" required maxLength={120} value={query} disabled={disabled} onChange={event => setQuery(event.target.value)} /></label>
        <button type="submit" aria-label="Search news" title="Search news" disabled={disabled || !query.trim()}><LuSearch aria-hidden="true" /></button>
      </form>
      <button type="button" className="news-refresh" aria-label="Refresh news" title="Refresh news" onClick={refresh} disabled={loading || saving}><LuRefreshCw aria-hidden="true" /></button>
    </div>
    <div className="news-feed-controls">
      <nav className="news-tabs" aria-label="News feed">
        {[["popular", "Popular"], ["latest", "Latest"]].map(([type, label]) => <button type="button" key={type} aria-pressed={widget.type === type} disabled={disabled} onClick={() => { if (type !== widget.type) void save({ type }); }}>{label}</button>)}
      </nav>
      <select aria-label="Number of stories" value={widget.config.limit ?? "5"} disabled={disabled} onChange={event => void save({ config: { query: widget.config.query ?? "programming", limit: event.target.value } })}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map(count => <option key={count} value={count}>{count} {count === 1 ? "story" : "stories"}</option>)}
      </select>
    </div>
    {saving && <p role="status" className="sr-only">Saving news feed…</p>}
    {saveError && <p role="alert" className="widget-error">{saveError}</p>}
    {error && <p role="alert" className="widget-error">{error}</p>}
    {loading && !data ? <p role="status">Loading stories…</p> : data?.items.length ? (
      <ul className="news-headlines" aria-label={`Stories about ${widget.config.query ?? "programming"}`}>
        {data.items.map((item, index) => <li key={`${item.url ?? item.value}-${index}`}><ItemLink item={item} /></li>)}
      </ul>
    ) : !error && <p className="news-empty">No stories found. Try another topic.</p>}
    <details className="news-preferences">
      <summary>Customize</summary>
      <form onSubmit={event => { event.preventDefault(); void save({ title: title.trim(), refreshSeconds: interval }); }}>
        <label>Widget name<input required maxLength={80} value={title} disabled={disabled} onChange={event => setTitle(event.target.value)} /></label>
        <label>Refresh every (seconds)<input type="number" required min={60} max={86400} step={1} value={interval} disabled={disabled} onChange={event => setInterval(Number(event.target.value))} /></label>
        <button type="submit" disabled={disabled || !title.trim()}>Save preferences</button>
      </form>
    </details>
  </div>;
}
