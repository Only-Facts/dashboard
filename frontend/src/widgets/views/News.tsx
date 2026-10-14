import { LuNewspaper, LuFlame } from "react-icons/lu";
import type { ViewProps } from "../WidgetUtils";
import { ItemLink } from "../WidgetUtils";

export function LatestView({ items }: ViewProps) {
  return (
    <div className="story-list latest">
      {items.slice(0, 5).map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <LuNewspaper aria-hidden="true" />
          <div><ItemLink item={item} /><small>{item.label}</small></div>
        </div>
      ))}
    </div>
  );
}

export function PopularView({ items }: ViewProps) {
  return (
    <ol className="story-list ranked">
      {items.slice(0, 5).map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <span className="story-rank">{index + 1}</span>
          <div><ItemLink item={item} /><small><LuFlame aria-hidden="true" /> {item.label}</small></div>
        </li>
      ))}
    </ol>
  );
}
