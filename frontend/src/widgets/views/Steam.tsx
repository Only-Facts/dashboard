import { useState, type FormEvent } from "react";
import { LuMedal, LuCalendarDays, LuGamepad2, LuRadio, LuSearch } from "react-icons/lu";
import { dashboardApi } from "../../api/dashboardApi";
import type { ViewProps } from "../WidgetUtils";
import { number } from "../WidgetUtils";
import { Bar, ItemLink } from "../WidgetUtils";

export function AchievementsView({ items }: ViewProps) {
  return (
    <div className="achievement-list">
      {items.slice(0, 5).map((item, index) => (
        <div className="achievement-row" key={`${item.label}-${index}`}>
          <span className="medal"><LuMedal aria-hidden="true" />{index + 1}</span>
          <div>
            <div><span>{item.label.replaceAll("_", " ")}</span><strong>{item.value}</strong></div>
            <Bar value={number(item.value)} max={100} tone={index === 0 ? "warm" : "accent"} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GameNewsView({ items }: ViewProps) {
  return (
    <div className="game-news-list">
      {items.slice(0, 4).map((item, index) => {
        const date = item.label.slice(0, 10);
        const shortDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(5) : "—";

        return (
          <div key={`${item.label}-${index}`}>
            <span className="news-date"><LuCalendarDays aria-hidden="true" />{shortDate}</span>
            <ItemLink item={item} />
          </div>
        );
      })}
    </div>
  );
}

export function PlayersView({ items, history }: ViewProps) {
  const [game, setGame] = useState("");
  const [players, setPlayers] = useState(items[0]?.value ?? "");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const samples = history
    .flatMap((snapshot) => {
      const value = number(snapshot.items[0]?.value);
      return value === null ? [] : [{ value, time: snapshot.updatedAt }];
    })
    .slice(-12);
  const max = Math.max(...samples.map((sample) => sample.value), 1);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!game.trim() || searching) return;

    setSearching(true);
    setError("");
    const controller = new AbortController();
    try {
      const result = await dashboardApi.publicSteamPlayers(game.trim(), controller.signal);
      setPlayers(result.items[0]?.value ?? "—");
      setSource(result.source);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to find this game.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="players-view">
      <form className="steam-search" onSubmit={search}>
        <label className="sr-only" htmlFor="steam-game-search">Search a Steam game</label>
        <input
          id="steam-game-search"
          value={game}
          onChange={(event) => setGame(event.target.value)}
          placeholder="Search a game…"
          disabled={searching}
        />
        <button type="submit" disabled={searching || !game.trim()} aria-label="Search Steam game">
          <LuSearch aria-hidden="true" />
        </button>
      </form>
      {error && <p className="widget-error">{error}</p>}
      <div className="live-label"><LuRadio aria-hidden="true" /> LIVE</div>
      <div className="primary-reading"><LuGamepad2 aria-hidden="true" /><strong>{players || "—"}</strong></div>
      <span className="reading-label">players online</span>
      {source && <span className="reading-label">{source}</span>}
      {samples.length > 1 && (
        <div className="mini-bars" aria-label="Recent player count samples">
          {samples.map((sample, index) => (
            <i key={`${sample.time}-${index}`} style={{ height: `${Math.max(8, (sample.value / max) * 100)}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
