import { LuChartNoAxesCombined } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { DetailList } from "../../shared";

export default function UnknownView({ items }: ViewProps) {
  return (
    <div className="unknown-view">
      <LuChartNoAxesCombined aria-hidden="true" />
      <DetailList items={items} />
    </div>
  );
}
