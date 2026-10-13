import { LuThermometer } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { find } from "../../format";

export default function TemperatureView({ items }: ViewProps) {
  return (
    <div className="temperature-view">
      <div className="primary-reading">
        <LuThermometer aria-hidden="true" />
        <strong>{find(items, "Temperature")}</strong>
      </div>
      <div className="compact-row">
        <span>Feels like</span>
        <strong>{find(items, "Feels like")}</strong>
      </div>
    </div>
  );
}
