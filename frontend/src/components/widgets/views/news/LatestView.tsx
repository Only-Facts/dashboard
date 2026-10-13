import { LuNewspaper } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { ItemLink } from "../../shared";

export default function LatestView({ items }: ViewProps) {
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
