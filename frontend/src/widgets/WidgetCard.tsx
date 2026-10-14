import { LuArrowUp, LuArrowDown, LuTrash2, LuRefreshCw } from "react-icons/lu";
import { AirQualityApp } from "./views/AirQualityApp";
import { CurrencyApp } from "./views/CurrencyApp";
import { NewsApp } from "./views/NewsApp";
import { TwitchApp } from "./views/TwitchApp";
import { SpotifyApp } from "./views/SpotifyApp";
import { SteamApp } from "./views/SteamApp";
import { WeatherApp } from "./views/WeatherApp";
import type { Widget, WidgetInput } from "../api/dashboardApi";
import { useWidgetData } from "./WidgetUtils";
import { defaultWidget, widgetRegistry } from "./registry";
import "./widgets.css";

interface WidgetCardProps {
  widget: Widget;
  busy: boolean;
  onUpdate: (input: WidgetInput) => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
}

export default function WidgetCard({ widget, busy, onUpdate, onMoveUp, onMoveDown, onDelete }: WidgetCardProps) {
  const { data, history, error, loading, refresh } = useWidgetData(widget);
  const location = data?.items.find((item) => item.label === "Location");
  const items = data?.items.filter((item) => item !== location) ?? [];
  const key = `${widget.service}:${widget.type}`;
  const { View, icon: Icon, size, design } = widgetRegistry[key] ?? defaultWidget;
  const safeKey = key.replaceAll(":", "-").replaceAll("_", "-");
  const miniApp = widget.service === "twitch" || widget.service === "spotify" || widget.service === "weather" || widget.service === "currency" || widget.service === "news" || widget.service === "steam" || widget.service === "air_quality";
  const subtitle = location?.value ?? widget.service.replaceAll("_", " ");

  return (
    <div className={`widget-visual widget-visual--${widget.service} visual-${safeKey}`} aria-label={widget.title}>
      <div data-slot="widget" data-size={size} data-design={design} data-variant="default"
        className={`wigggle-widget wigggle-widget--${size} wigggle-widget--${design} wigggle-widget--default orbit-wigggle`}
        role="article" aria-label={widget.title}>
        <div data-slot="widget-header" className="wigggle-widget__header orbit-widget-chrome">
          <div className="orbit-widget-identity">
            {!miniApp && <span className="orbit-wigggle__icon" aria-hidden="true"><Icon /></span>}
            <div className="orbit-widget-heading">
              <h2 data-slot="widget-title" className="wigggle-widget__title">{widget.title}</h2>
              {!miniApp && subtitle && <span className="orbit-wigggle__subtitle">{subtitle}</span>}
            </div>
          </div>

        </div>

        <div data-slot="widget-content" className="wigggle-widget__content orbit-widget-content" aria-busy={loading}>
          {widget.service === "weather" ? (
            <WeatherApp widget={widget} data={data} history={history} loading={loading} error={error} busy={busy} refresh={refresh} onUpdate={onUpdate} />
          ) : widget.service === "currency" ? (
            <CurrencyApp widget={widget} data={data} loading={loading} error={error} busy={busy} refresh={refresh} onUpdate={onUpdate} />
          ) : widget.service === "news" ? (
            <NewsApp widget={widget} data={data} loading={loading} error={error} busy={busy} refresh={refresh} onUpdate={onUpdate} />
          ) : widget.service === "steam" ? (
            <SteamApp widget={widget} data={data} history={history} loading={loading} error={error} busy={busy} refresh={refresh} onUpdate={onUpdate} />
          ) : widget.service === "air_quality" ? (
            <AirQualityApp widget={widget} data={data} loading={loading} error={error} busy={busy} refresh={refresh} onUpdate={onUpdate} />
          ) : widget.service === "twitch" ? (
            <TwitchApp widget={widget} data={data} loading={loading} error={error} busy={busy} refresh={refresh} onUpdate={onUpdate} />
          ) : widget.service === "spotify" ? (
            <SpotifyApp widget={widget} data={data} loading={loading} error={error} busy={busy} refresh={refresh} onUpdate={onUpdate} />
          ) : loading && !data ? (
            <div className="widget-skeleton" role="status">
              <span className="sr-only">Loading data…</span><i /><i /><i />
            </div>
          ) : (
            <>
              {error && <p role="alert" className="widget-error">{error}</p>}
              {data && items.length === 0 && <p className="widget-empty">No results.</p>}
              {items.length > 0 && <View widget={widget} items={items} history={history} />}
            </>
          )}
        </div>

        <div className="widget-actions" role="group" aria-label={`Actions for ${widget.title}`}>
          <button type="button" disabled={busy || !onMoveUp} onClick={onMoveUp} aria-label={`Move ${widget.title} up`} title="Move up"><LuArrowUp aria-hidden="true" /></button>
          <button type="button" disabled={busy || !onMoveDown} onClick={onMoveDown} aria-label={`Move ${widget.title} down`} title="Move down"><LuArrowDown aria-hidden="true" /></button>
          <button type="button" disabled={busy} onClick={onDelete} aria-label={`Delete ${widget.title}`} title="Delete widget"><LuTrash2 aria-hidden="true" /></button>
        </div>
        {!miniApp && <div data-slot="widget-footer" className="wigggle-widget__footer orbit-widget-footer">
          <span>{data ? data.source : widget.service.replaceAll("_", " ")}</span>
          <span className="refresh-interval">
            <LuRefreshCw size={11} aria-hidden="true" /> {formatInterval(widget.refreshSeconds)}
          </span>
        </div>}
      </div>
    </div>
  );
}

function formatInterval(seconds: number) {
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}
