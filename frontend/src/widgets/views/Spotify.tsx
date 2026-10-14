import { SiSpotify } from "react-icons/si";
import type { ViewProps } from "../WidgetUtils";
import { ItemLink } from "../WidgetUtils";

export function SpotifyView({ widget, items }: ViewProps) {
  const empty = widget.type === "recently_played" ? "No recently played tracks yet."
    : widget.type === "top_tracks" ? "No top tracks for this period yet." : "No playlists found.";
  return (
    <div className="spotify-list" tabIndex={0} role="region" aria-label="Spotify results">
      {items.length === 0 && <p>{empty}</p>}
      {items.map((item, index) => (
        <div className="spotify-row" key={`${item.label}-${index}`}>
          <SiSpotify aria-hidden="true" />
          <div>
            <strong><ItemLink item={{ ...item, value: item.label }} /></strong>
            <small>{item.value}</small>
          </div>
        </div>
      ))}
      <small className="spotify-attribution">Spotify</small>
    </div>
  );
}
