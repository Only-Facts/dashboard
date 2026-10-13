import { LuCircleDot } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { ItemLink } from "../../shared";

export default function IssuesView({ items }: ViewProps) {
  return (
    <div className="issues-view">
      <div className="issue-total"><LuCircleDot aria-hidden="true" /><strong>{items.length}</strong><span>open</span></div>
      <div className="issue-list">
        {items.slice(0, 5).map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <span>{item.label}</span>
            <ItemLink item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
