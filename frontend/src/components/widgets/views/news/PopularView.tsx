import { LuFlame } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { ItemLink } from "../../shared";

export default function PopularView({ items }: ViewProps) {
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
