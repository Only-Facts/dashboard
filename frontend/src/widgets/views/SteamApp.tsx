import { useState, type FormEvent } from "react";
import { LuRefreshCw, LuSearch } from "react-icons/lu";
import type { Widget, WidgetData, WidgetInput } from "../../api/dashboardApi";
import { ItemLink, number } from "../WidgetUtils";

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
const views = [["players", "Players"], ["game_news", "News"], ["achievements", "Achievements"]];

export function SteamApp(props: Props) {
  return <SteamAppContent key={JSON.stringify([props.widget.config, props.widget.type, props.widget.title, props.widget.refreshSeconds])} {...props} />;
}

function SteamAppContent({ widget, data, history, loading, error, busy, refresh, onUpdate }: Props) {
  const [game, setGame] = useState(widget.config.game ?? "");
  const [title, setTitle] = useState(widget.title);
  const [interval, setInterval] = useState(widget.refreshSeconds);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const disabled = busy || saving;
  const items = data?.items ?? [];
  const resolvedGame = data?.source.startsWith("Steam · ") ? data.source.slice(8) : "";
  const samples = history.flatMap(snapshot => {
    const value = number(snapshot.items.find(item => item.label === "Players online")?.value);
    return value === null ? [] : [{ value, time: snapshot.updatedAt }];
  }).slice(-12);
  const maximum = Math.max(...samples.map(sample => sample.value), 1);

  async function save(patch: Partial<WidgetInput>) {
    if (disabled) return;
    setSaving(true);
    setSaveError("");
    try {
      await onUpdate({ service: widget.service, type: widget.type, title: widget.title,
        config: widget.config, refreshSeconds: widget.refreshSeconds, ...patch });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save your Steam widget.");
    } finally { setSaving(false); }
  }

  function gameConfig(type: string, name = game.trim()): Record<string, string> {
    return { game: name, ...(type === "players" ? {} : { limit: widget.config.limit ?? "5" }) };
  }

  function search(event: FormEvent) {
    event.preventDefault();
    if (game.trim()) void save({ config: gameConfig(widget.type) });
  }

  return <div className="steam-app">
    <div className="steam-app-toolbar">
      <form className="steam-app-search" onSubmit={search}>
        <label className="widget-search-field"><span className="sr-only">Steam game</span><input aria-label="Steam game" placeholder="Search a game" title={resolvedGame || undefined} required maxLength={120} value={game} disabled={disabled} onChange={event => setGame(event.target.value)} /></label>
        <button type="submit" aria-label="Search Steam game" title="Search Steam game" disabled={disabled || !game.trim()}><LuSearch aria-hidden="true" /></button>
      </form>
      <button type="button" aria-label="Refresh Steam" title="Refresh Steam" onClick={refresh} disabled={loading || saving}><LuRefreshCw aria-hidden="true" /></button>
    </div>
    <nav className="steam-app-tabs" aria-label="Steam views">
      {views.map(([type, label]) => <button type="button" key={type} aria-pressed={widget.type === type} disabled={disabled || !game.trim()} onClick={() => { if (widget.type !== type) void save({ type, config: gameConfig(type) }); }}>{label}</button>)}
    </nav>
    {resolvedGame && resolvedGame !== widget.config.game && resolvedGame !== "Steam game" && <p className="steam-resolved-game">{resolvedGame}</p>}
    {saving && <p role="status" className="sr-only">Saving Steam widget…</p>}
    {saveError && <p role="alert" className="widget-error">{saveError}</p>}
    {error && <p role="alert" className="widget-error">{error}</p>}
    {loading && !data ? <p role="status">Loading Steam…</p> : items.length ? <>
      {widget.type === "players" && <div className="steam-app-players">
        <div className="primary-reading"><strong>{items.find(item => item.label === "Players online")?.value ?? "Unavailable"}</strong></div>
        <span>Players online</span>
        {samples.length > 1 && <div className="mini-bars" aria-label="Recent player count samples">{samples.map(sample => <i key={sample.time} title={`${sample.value} players · ${sample.time}`} style={{ height: `${Math.max(2, sample.value / maximum * 100)}%` }} />)}</div>}
      </div>}
      {widget.type === "game_news" && <ul className="steam-app-stories">{items.map((item, index) => <li key={`${item.url ?? item.value}-${index}`}><ItemLink item={item} /></li>)}</ul>}
      {widget.type === "achievements" && <dl className="steam-app-achievements">{items.map((item, index) => <div key={`${item.label}-${index}`}><dt>{item.label.replaceAll("_", " ").toLowerCase()}</dt><dd>{item.value}</dd></div>)}</dl>}
    </> : !error && <p>No {widget.type === "game_news" ? "news" : widget.type === "achievements" ? "achievements" : "player data"} available for this game.</p>}
    {widget.type !== "players" && <label className="steam-app-limit">{widget.type === "game_news" ? "Stories" : "Achievements"}<select aria-label="Steam result count" value={widget.config.limit ?? "5"} disabled={disabled || !game.trim()} onChange={event => void save({ config: { ...gameConfig(widget.type), limit: event.target.value } })}>{Array.from({ length: 10 }, (_, index) => index + 1).map(count => <option key={count} value={count}>{count}</option>)}</select></label>}
    <details className="steam-app-preferences">
      <summary>Customize</summary>
      <form onSubmit={event => { event.preventDefault(); void save({ title: title.trim(), refreshSeconds: interval }); }}>
        <label>Widget name<input required maxLength={80} value={title} disabled={disabled} onChange={event => setTitle(event.target.value)} /></label>
        <label>Refresh every (seconds)<input type="number" required min={60} max={86400} step={1} value={interval} disabled={disabled} onChange={event => setInterval(Number(event.target.value))} /></label>
        <button type="submit" disabled={disabled || !title.trim()}>Save preferences</button>
      </form>
    </details>
  </div>;
}
