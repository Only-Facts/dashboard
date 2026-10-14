import { LuCalendarClock, LuRadio, LuUsers } from "react-icons/lu";
import type { ViewProps } from "../WidgetUtils";
import { ItemLink } from "../WidgetUtils";

export function FollowedLiveView({ items }: ViewProps) {
  return (
    <div className="twitch-list twitch-live-list">
      {items.length === 0 && <p>No followed channels are live right now.</p>}
      {items.map((item, index) => (
        <div className="twitch-row" key={`${item.label}-${index}`}>
          <LuRadio aria-hidden="true" />
          <div>
            <strong>{item.label}</strong>
            <ItemLink item={item} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FollowedChannelsView({ items }: ViewProps) {
  return (
    <div className="twitch-list twitch-channel-list">
      {items.length === 0 && <p>You are not following any channels yet.</p>}
      {items.map((item, index) => (
        <div className="twitch-row" key={`${item.label}-${index}`}>
          <LuUsers aria-hidden="true" />
          <div>
            <ItemLink item={{ ...item, value: item.label }} />
            <small>{item.value}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScheduleView({ items }: ViewProps) {
  return (
    <div className="twitch-list twitch-schedule-list">
      {items.length === 0 && <p>Your channel has no upcoming scheduled streams.</p>}
      {items.map((item, index) => (
        <div className="twitch-row" key={`${item.label}-${index}`}>
          <LuCalendarClock aria-hidden="true" />
          <div>
            <small>{Number.isNaN(Date.parse(item.label)) ? item.label : new Date(item.label).toLocaleString()}</small>
            <ItemLink item={item} />
          </div>
        </div>
      ))}
    </div>
  );
}
