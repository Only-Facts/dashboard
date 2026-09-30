import { LuGamepad2, LuRadio } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { number } from "../../format";

export default function PlayersView({ items, history }: ViewProps) {
  const samples = history
    .flatMap((snapshot) => {
      const value = number(snapshot.items[0]?.value);
      return value === null ? [] : [{ value, time: snapshot.updatedAt }];
    })
    .slice(-12);
  const max = Math.max(...samples.map((sample) => sample.value), 1);

  return (
    <div className="players-view">
      <div className="live-label"><LuRadio aria-hidden="true" /> LIVE</div>
      <div className="primary-reading"><LuGamepad2 aria-hidden="true" /><strong>{items[0]?.value ?? "—"}</strong></div>
      <span className="reading-label">players online</span>
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
