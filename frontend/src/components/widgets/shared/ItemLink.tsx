import { LuArrowUpRight } from "react-icons/lu";
import type { WidgetDataItem } from "../../../types/dashboard";

export default function ItemLink({ item }: { item: WidgetDataItem }) {
  if (!item.url?.startsWith("https://")) return <span>{item.value}</span>;

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer">
      {item.value}
      <LuArrowUpRight aria-hidden="true" />
    </a>
  );
}
