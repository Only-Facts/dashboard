import { LuCalendarDays } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { ItemLink } from "../../shared";

export default function GameNewsView({ items }: ViewProps) {
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
