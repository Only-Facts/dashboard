import type { WidgetDataItem } from "../../../types/dashboard";
import ItemLink from "./ItemLink";

export default function DetailList({ items }: { items: WidgetDataItem[] }) {
  return (
    <dl className="detail-list">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <dt>{item.label}</dt>
          <dd><ItemLink item={item} /></dd>
        </div>
      ))}
    </dl>
  );
}
